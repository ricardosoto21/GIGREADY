import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { getFfmpegPath } from '../ffmpeg/ffmpeg-path';
import { registerPreviewFile } from './media-preview-registry';
import type { Track } from '../../src/types';

export async function createPreviewClip(
  track: Track,
  tempRoot: string,
  startTimeSeconds: number,
  durationSeconds = 18,
): Promise<string> {
  const outputDir = path.join(tempRoot, 'gigready-preview-clips');
  await fs.mkdir(outputDir, { recursive: true });

  const safeStart = Math.max(0, startTimeSeconds - 4);
  const safeDuration = Math.max(4, Math.min(30, durationSeconds));
  const outputPath = path.join(outputDir, `${track.id}-${Math.round(safeStart * 1000)}.mp3`);

  await convertPreview(track.path, outputPath, safeStart, safeDuration);
  const token = registerPreviewFile(outputPath);
  return `gigready-media://preview/${encodeURIComponent(token)}`;
}

function convertPreview(inputPath: string, outputPath: string, startTime: number, duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(getFfmpegPath(), [
      '-nostdin',
      '-hide_banner',
      '-loglevel', 'error',
      '-y',
      '-ss', startTime.toFixed(3),
      '-t', duration.toFixed(3),
      '-i', inputPath,
      '-map', '0:a:0',
      '-vn',
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      outputPath,
    ], { windowsHide: true });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 8000) stderr = stderr.slice(-8000);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `No se pudo preparar la vista previa.`));
      }
    });
  });
}
