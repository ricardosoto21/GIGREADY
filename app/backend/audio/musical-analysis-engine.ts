import { analyzeWithNativeSidecar } from './native-sidecar-analyzer';
import { analyzeWithStandardEngine } from './standard-analyzer';
import type { MusicalAnalysis, ScanSettings, Track } from '../../src/types';

export async function analyzeMusicalTrack(
  track: Track,
  settings: Pick<ScanSettings, 'analysisEngine'>,
  signal?: AbortSignal,
): Promise<MusicalAnalysis> {
  if (settings.analysisEngine === 'advanced_internal') {
    try {
      return await analyzeWithNativeSidecar(track, signal);
    } catch (error: any) {
      return analyzeWithStandardEngine(track, error?.message || 'El análisis avanzado no estuvo disponible.');
    }
  }

  return analyzeWithStandardEngine(track);
}
