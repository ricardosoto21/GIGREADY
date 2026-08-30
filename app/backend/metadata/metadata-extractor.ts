import * as mm from 'music-metadata';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { createReadStream } from 'fs';
import { getFfprobePath } from '../ffmpeg/ffmpeg-path';

export interface MetadataResult {
  artist?: string;
  title?: string;
  album?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  container?: string;
  hasArtwork: boolean;
  fileSize: number;
  modifiedAt: string;
  createdAt?: string;
  ffprobeValid?: boolean;
  ffprobeError?: string;
  error?: string;
}

interface ExtractMetadataOptions {
  useFfprobeFallback?: boolean;
}

interface FfprobeData {
  streams?: FfprobeStream[];
  format?: FfprobeFormat;
}

interface FfprobeFormat {
  format_name?: string;
  duration?: string;
  bit_rate?: string;
  tags?: Record<string, string>;
}

interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  codec_long_name?: string;
  sample_rate?: string;
  channels?: number;
  bit_rate?: string;
  disposition?: { attached_pic?: number };
  tags?: Record<string, string>;
}

/**
 * Extract metadata from an audio file using music-metadata.
 */
export async function extractMetadata(filePath: string, options: ExtractMetadataOptions = {}): Promise<MetadataResult> {
  const stats = await fs.stat(filePath);
  
  const result: MetadataResult = {
    hasArtwork: false,
    fileSize: stats.size,
    modifiedAt: stats.mtime.toISOString(),
    createdAt: stats.birthtime?.toISOString(),
  };

  try {
    const metadata = await mm.parseFile(filePath, {
      duration: true,
      skipCovers: false,
    });

    const { common, format } = metadata;

    // Common metadata
    result.artist = cleanString(common.artist) || cleanString(common.albumartist);
    result.title = cleanString(common.title);
    result.album = cleanString(common.album);
    result.genre = cleanString(common.genre?.[0]);
    result.bpm = normalizeBpm(common.bpm);
    result.key = cleanString(common.key);
    result.hasArtwork = (common.picture && common.picture.length > 0) || false;

    // Format metadata
    result.duration = format.duration;
    result.bitrate = format.bitrate ? Math.round(format.bitrate / 1000) : undefined;
    result.sampleRate = format.sampleRate;
    result.channels = format.numberOfChannels;
    result.codec = format.codec;
    result.container = format.container;
  } catch (err: any) {
    result.error = err.message;
  }

  if (options.useFfprobeFallback && shouldUseFfprobeFallback(result)) {
    try {
      const probe = await probeFile(filePath);
      result.ffprobeValid = hasAudioStream(probe);
      mergeFfprobeMetadata(result, probe);
    } catch (err: any) {
      result.ffprobeValid = false;
      result.ffprobeError = err.stderr || err.message || 'No se pudo validar el archivo.';
    }
  }

  applyFilenameFallback(result, filePath);

  return result;
}

/**
 * Calculate SHA256 hash of a file using streaming for memory efficiency.
 */
export async function calculateHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Validate a file using ffprobe.
 * Returns true if the file is valid, false otherwise.
 */
export async function validateWithFfprobe(filePath: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const probe = await probeFile(filePath);
    if (!hasAudioStream(probe)) {
      return { valid: false, error: 'No se encontro una pista de audio valida.' };
    }

    return { valid: true };
  } catch (err: any) {
    return {
      valid: false,
      error: err.stderr || err.message || 'No se pudo validar el archivo.',
    };
  }
}

async function probeFile(filePath: string): Promise<FfprobeData> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  const { stdout } = await execFileAsync(getFfprobePath(), [
    '-v', 'error',
    '-show_format',
    '-show_streams',
    '-of', 'json',
    filePath,
  ], { timeout: 30000, maxBuffer: 10 * 1024 * 1024 });

  return JSON.parse(stdout || '{}') as FfprobeData;
}

function shouldUseFfprobeFallback(result: MetadataResult): boolean {
  return !result.artist ||
    !result.title ||
    !result.duration ||
    !result.bitrate ||
    !result.sampleRate ||
    !result.channels ||
    !result.codec ||
    !result.container ||
    !result.bpm ||
    !result.key;
}

function mergeFfprobeMetadata(result: MetadataResult, probe: FfprobeData): void {
  const audioStream = probe.streams?.find((stream) => stream.codec_type === 'audio');
  const artworkStream = probe.streams?.find((stream) => stream.disposition?.attached_pic === 1);
  const tagSources = [
    probe.format?.tags,
    audioStream?.tags,
    ...(probe.streams?.map((stream) => stream.tags) ?? []),
  ].filter(Boolean) as Record<string, string>[];

  result.artist ??= findTag(tagSources, ['artist', 'album_artist', 'albumartist', 'performer', 'TPE1']);
  result.title ??= findTag(tagSources, ['title', 'TITLE', 'TIT2']);
  result.album ??= findTag(tagSources, ['album', 'TALB']);
  result.genre ??= findTag(tagSources, ['genre', 'TCON']);
  result.bpm ??= normalizeBpm(findTag(tagSources, ['bpm', 'BPM', 'TBPM', 'tmpo', 'tempo']));
  result.key ??= findTag(tagSources, ['initialkey', 'initial_key', 'key', 'TKEY', 'tonality']);

  result.duration ??= normalizeNumber(probe.format?.duration);
  result.bitrate ??= normalizeBitrate(probe.format?.bit_rate) ?? normalizeBitrate(audioStream?.bit_rate);
  result.sampleRate ??= normalizeInteger(audioStream?.sample_rate);
  result.channels ??= audioStream?.channels;
  result.codec ??= audioStream?.codec_name || audioStream?.codec_long_name;
  result.container ??= probe.format?.format_name;
  result.hasArtwork = result.hasArtwork || Boolean(artworkStream);
}

function hasAudioStream(probe: FfprobeData): boolean {
  return Boolean(probe.streams?.some((stream) => stream.codec_type === 'audio'));
}

function findTag(sources: Record<string, string>[], names: string[]): string | undefined {
  const normalizedNames = names.map((name) => name.toLowerCase());
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (normalizedNames.includes(key.toLowerCase())) {
        const cleaned = cleanString(value);
        if (cleaned) return cleaned;
      }
    }
  }
  return undefined;
}

function applyFilenameFallback(result: MetadataResult, filePath: string): void {
  const baseName = path.basename(filePath, path.extname(filePath)).replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!baseName) return;

  const split = baseName.split(/\s+-\s+/);
  if (split.length >= 2) {
    result.artist ??= cleanString(split[0]);
    result.title ??= cleanString(split.slice(1).join(' - '));
  }

  result.title ??= cleanString(baseName);
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeBpm(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : normalizeNumber(value);
  if (!parsed || parsed < 40 || parsed > 260) return undefined;
  return Math.round(parsed * 100) / 100;
}

function normalizeBitrate(value: unknown): number | undefined {
  const parsed = normalizeNumber(value);
  if (!parsed) return undefined;
  return Math.round(parsed > 10000 ? parsed / 1000 : parsed);
}

function normalizeInteger(value: unknown): number | undefined {
  const parsed = normalizeNumber(value);
  return parsed ? Math.round(parsed) : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
