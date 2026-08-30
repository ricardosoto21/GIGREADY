import { getCueColor, planCueSuggestions } from './cue-planner';
import { musicalAnalysisFromEnergyData } from './standard-analyzer';
import type { EnergyData, SuggestedCue, Track } from '../../src/types';

/**
 * Generate memory cue suggestions from musical analysis.
 * This wrapper keeps the older API available for existing callers and tests.
 */
export function suggestCues(track: Track, energyData?: EnergyData, minConfidence = 0.3): SuggestedCue[] {
  if (!track.duration || track.duration < 60) return [];
  if (energyData) {
    const analysis = musicalAnalysisFromEnergyData(track, energyData);
    return planCueSuggestions(track, analysis, { minConfidence });
  }

  const fallbackAnalysis = musicalAnalysisFromEnergyData(track, {
    trackId: track.id,
    sampleRate: track.sampleRate || 44100,
    hopSize: 1,
    times: buildTimes(track.duration),
    rmsEnergy: buildFlatEnergy(track.duration, 0.52),
    lowEnergy: buildFlatEnergy(track.duration, 0.42),
    onsets: [],
    beats: buildBeatGrid(track.duration, track.bpm),
    segments: buildFallbackSegments(track),
    analysisQuality: 'fallback',
  }, 'No hay análisis de estructura disponible.');

  return planCueSuggestions(track, fallbackAnalysis, { minConfidence });
}

export { getCueColor };

function buildTimes(duration: number): number[] {
  const points = Math.max(80, Math.min(360, Math.round(duration)));
  return Array.from({ length: points }, (_, index) => Number(((index / Math.max(1, points - 1)) * duration).toFixed(3)));
}

function buildFlatEnergy(duration: number, value: number): number[] {
  return buildTimes(duration).map(() => value);
}

function buildBeatGrid(duration: number, bpm?: number): number[] {
  const beatDuration = 60 / (bpm && bpm > 0 ? bpm : 128);
  const beats: number[] = [];
  for (let time = 0; time <= duration; time += beatDuration) {
    beats.push(Number(time.toFixed(3)));
  }
  return beats;
}

function buildFallbackSegments(track: Track) {
  const duration = track.duration || 300;
  return [
    { startTime: 0, endTime: duration * 0.15, avgEnergy: 0.35, label: 'Intro' },
    { startTime: duration * 0.15, endTime: duration * 0.45, avgEnergy: 0.55, label: 'Groove' },
    { startTime: duration * 0.45, endTime: duration * 0.55, avgEnergy: 0.24, label: 'Break' },
    { startTime: duration * 0.55, endTime: duration * 0.6, avgEnergy: 0.58, label: 'Build' },
    { startTime: duration * 0.6, endTime: duration * 0.85, avgEnergy: 0.78, label: 'Drop' },
    { startTime: duration * 0.85, endTime: duration, avgEnergy: 0.32, label: 'Outro' },
  ];
}
