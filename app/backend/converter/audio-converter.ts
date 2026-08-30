import fg from 'fast-glob';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { extractMetadata } from '../metadata/metadata-extractor';
import { getFfmpegPath } from '../ffmpeg/ffmpeg-path';
import type {
  ConversionItem,
  ConversionPlan,
  ConversionProgress,
  ConversionResult,
  ConversionSource,
  ConversionTargetFormat,
} from '../../src/types';

const SUPPORTED_INPUT_EXTENSIONS = new Set(['.mp3', '.wav', '.aiff', '.aif', '.flac', '.m4a', '.aac', '.ogg']);

interface ActiveConversionJob {
  cancelled: boolean;
  child?: ChildProcessWithoutNullStreams;
}

const activeJobs = new Map<string, ActiveConversionJob>();

export async function buildConversionPlan(
  source: ConversionSource,
  targetFormat: ConversionTargetFormat,
  outputDirectory: string,
): Promise<ConversionPlan> {
  const files = await discoverConversionFiles(source);
  const reservedOutputs = new Set<string>();
  const items: ConversionItem[] = [];

  for (const sourcePath of files) {
    const relativePath = buildRelativePath(source, sourcePath);
    const outputPath = await buildOutputPath(outputDirectory, relativePath, targetFormat, reservedOutputs);
    const metadata = await safeExtractMetadata(sourcePath);

    items.push({
      id: randomUUID(),
      sourcePath,
      relativePath,
      filename: path.basename(sourcePath),
      extension: path.extname(sourcePath).toLowerCase(),
      duration: metadata.duration,
      bitrate: metadata.bitrate,
      sampleRate: metadata.sampleRate,
      channels: metadata.channels,
      codec: metadata.codec,
      targetFormat,
      outputPath,
      status: 'ready',
      errorMessage: metadata.error,
    });
  }

  return {
    id: randomUUID(),
    source,
    targetFormat,
    outputDirectory,
    totalFiles: items.length,
    items,
    createdAt: new Date().toISOString(),
  };
}

export async function startConversionPlan(
  plan: ConversionPlan,
  onProgress: (progress: ConversionProgress) => void,
): Promise<ConversionResult> {
  const job: ActiveConversionJob = { cancelled: false };
  activeJobs.set(plan.id, job);

  const items = plan.items.map((item) => ({ ...item }));
  const errors: string[] = [];
  let converted = 0;
  let failed = 0;

  try {
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (job.cancelled) {
        item.status = 'skipped';
        continue;
      }

      item.status = 'converting';
      onProgress({
        jobId: plan.id,
        current: index + 1,
        total: items.length,
        currentFile: item.filename,
        status: 'running',
        message: 'Convirtiendo archivo',
      });

      try {
        await fs.mkdir(path.dirname(item.outputPath), { recursive: true });
        item.outputPath = await getUniqueOutputPath(item.outputPath);
        await convertItem(item, job);
        item.status = 'completed';
        converted++;
      } catch (err: any) {
        if (job.cancelled) {
          item.status = 'skipped';
          continue;
        }
        item.status = 'failed';
        item.errorMessage = cleanProcessError(err);
        errors.push(`${item.filename}: ${item.errorMessage}`);
        failed++;
      }
    }

    const cancelled = job.cancelled;
    onProgress({
      jobId: plan.id,
      current: items.length,
      total: items.length,
      status: cancelled ? 'cancelled' : 'completed',
      message: cancelled ? 'Conversion cancelada' : 'Conversion finalizada',
    });

    return {
      jobId: plan.id,
      outputDirectory: plan.outputDirectory,
      converted,
      failed,
      cancelled,
      items,
      errors,
    };
  } finally {
    activeJobs.delete(plan.id);
  }
}

export function cancelConversion(jobId: string): void {
  const job = activeJobs.get(jobId);
  if (!job) return;
  job.cancelled = true;
  job.child?.kill();
}

export function buildFfmpegArgs(inputPath: string, outputPath: string, targetFormat: ConversionTargetFormat): string[] {
  const args = [
    '-nostdin',
    '-hide_banner',
    '-loglevel', 'error',
    '-n',
    '-i', inputPath,
    '-map', '0:a:0',
    '-vn',
    '-map_metadata', '0',
  ];

  if (targetFormat === 'mp3') {
    args.push('-c:a', 'libmp3lame', '-b:a', '320k');
  } else if (targetFormat === 'wav') {
    args.push('-c:a', 'pcm_s24le');
  } else {
    args.push('-c:a', 'pcm_s24be', '-f', 'aiff');
  }

  args.push(outputPath);
  return args;
}

export async function getUniqueOutputPath(targetPath: string): Promise<string> {
  const parsed = path.parse(targetPath);
  let candidate = targetPath;
  let index = 2;

  while (await pathExists(candidate)) {
    candidate = path.join(parsed.dir, `${parsed.name}-${index}${parsed.ext}`);
    index++;
  }

  return candidate;
}

export function getTargetExtension(targetFormat: ConversionTargetFormat): string {
  return targetFormat === 'aiff' ? '.aiff' : `.${targetFormat}`;
}

async function discoverConversionFiles(source: ConversionSource): Promise<string[]> {
  if (source.type === 'files') {
    return source.paths
      .filter((filePath) => SUPPORTED_INPUT_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  }

  const rootPath = source.rootPath || source.paths[0];
  if (!rootPath) return [];

  const entries = await fg('**/*', {
    cwd: rootPath,
    absolute: true,
    onlyFiles: true,
    dot: false,
    suppressErrors: true,
  });

  return entries
    .filter((filePath) => SUPPORTED_INPUT_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function buildRelativePath(source: ConversionSource, sourcePath: string): string {
  if (source.type === 'folder') {
    const rootPath = source.rootPath || source.paths[0];
    if (rootPath) {
      const relativePath = path.relative(rootPath, sourcePath);
      if (relativePath && !relativePath.startsWith('..')) return relativePath;
    }
  }

  return path.basename(sourcePath);
}

async function buildOutputPath(
  outputDirectory: string,
  relativePath: string,
  targetFormat: ConversionTargetFormat,
  reservedOutputs: Set<string>,
): Promise<string> {
  const parsed = path.parse(relativePath);
  const basePath = path.join(outputDirectory, parsed.dir, `${parsed.name}-converted${getTargetExtension(targetFormat)}`);
  let candidate = await getUniqueOutputPath(basePath);
  let index = 2;

  while (reservedOutputs.has(candidate.toLowerCase())) {
    candidate = path.join(path.dirname(basePath), `${parsed.name}-converted-${index}${getTargetExtension(targetFormat)}`);
    index++;
  }

  reservedOutputs.add(candidate.toLowerCase());
  return candidate;
}

async function safeExtractMetadata(filePath: string): Promise<{
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  error?: string;
}> {
  try {
    return await extractMetadata(filePath, { useFfprobeFallback: true });
  } catch (err: any) {
    return { error: err?.message || 'No se pudo leer el archivo.' };
  }
}

async function convertItem(item: ConversionItem, job: ActiveConversionJob): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(getFfmpegPath(), buildFfmpegArgs(item.sourcePath, item.outputPath, item.targetFormat), {
      windowsHide: true,
    });
    job.child = child;

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 12000) stderr = stderr.slice(-12000);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      job.child = undefined;
      if (job.cancelled) {
        reject(new Error('Conversion cancelada.'));
        return;
      }
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `FFmpeg finalizo con codigo ${code}.`));
      }
    });
  });
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function cleanProcessError(err: any): string {
  const message = err?.message || 'No se pudo convertir el archivo.';
  return message.replace(/\s+/g, ' ').trim().slice(0, 500);
}
