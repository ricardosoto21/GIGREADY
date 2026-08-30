import { describe, expect, it } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { buildFfmpegArgs, getTargetExtension, getUniqueOutputPath } from '../../backend/converter/audio-converter';

describe('audio converter', () => {
  it('builds a safe MP3 320 kbps command', () => {
    const args = buildFfmpegArgs('C:/Music/source.wav', 'C:/Out/source-converted.mp3', 'mp3');

    expect(args).toContain('-n');
    expect(args).toContain('libmp3lame');
    expect(args).toContain('320k');
    expect(args).toContain('C:/Out/source-converted.mp3');
  });

  it('uses PCM output for WAV and AIFF', () => {
    expect(buildFfmpegArgs('in.aiff', 'out.wav', 'wav')).toContain('pcm_s24le');
    expect(buildFfmpegArgs('in.wav', 'out.aiff', 'aiff')).toContain('pcm_s24be');
  });

  it('returns expected target extensions', () => {
    expect(getTargetExtension('mp3')).toBe('.mp3');
    expect(getTargetExtension('wav')).toBe('.wav');
    expect(getTargetExtension('aiff')).toBe('.aiff');
  });

  it('does not reuse an existing output path', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'gigready-converter-'));
    const existing = path.join(dir, 'track-converted.mp3');
    await fs.writeFile(existing, 'existing');

    await expect(getUniqueOutputPath(existing)).resolves.toBe(path.join(dir, 'track-converted-2.mp3'));
  });
});
