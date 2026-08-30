import { execFile } from 'child_process';
import { promisify } from 'util';
import { normalizeSidecarAnalysis } from './musical-analysis-schema';
import type { MusicalAnalysis, Track } from '../../src/types';

const execFileAsync = promisify(execFile);
const SIDECAR_TIMEOUT_MS = 180_000;

export async function analyzeWithNativeSidecar(track: Track, signal?: AbortSignal): Promise<MusicalAnalysis> {
  const command = getSidecarCommand();
  if (!command) {
    throw new Error('El análisis avanzado no está configurado.');
  }

  const { stdout } = await execFileAsync(command, [
    'analyze',
    '--input',
    track.path,
    '--format',
    'json',
  ], {
    timeout: SIDECAR_TIMEOUT_MS,
    maxBuffer: 64 * 1024 * 1024,
    signal,
  });

  let raw: unknown;
  try {
    raw = JSON.parse(stdout || '{}');
  } catch {
    throw new Error('El análisis avanzado no entregó una respuesta válida.');
  }

  return normalizeSidecarAnalysis(raw, track);
}

function getSidecarCommand(): string | undefined {
  const configured = process.env.GIGREADY_MIR_ANALYZER_PATH?.trim();
  if (configured) return configured;
  return undefined;
}
