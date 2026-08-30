import { analyzeEnergyData } from './energy-analyzer';
import {
  deriveDownbeats,
  derivePhraseBoundaries,
  MUSICAL_ANALYZER_VERSION,
  validateMusicalAnalysis,
} from './musical-analysis-schema';
import type { EnergyData, MusicalAnalysis, MusicalAnalysisQuality, MusicalSectionLabel, Track } from '../../src/types';

export async function analyzeWithStandardEngine(track: Track, fallbackReason?: string): Promise<MusicalAnalysis> {
  const energyData = await analyzeEnergyData(track);
  return musicalAnalysisFromEnergyData(track, energyData, fallbackReason);
}

export function musicalAnalysisFromEnergyData(
  track: Track,
  energyData: EnergyData,
  fallbackReason?: string,
): MusicalAnalysis {
  const duration = track.duration || inferDuration(energyData);
  const times = buildTimes(energyData, duration);
  const beats = cleanTimes(energyData.beats ?? [], duration);
  const downbeats = deriveDownbeats(beats);
  const phraseBoundaries = derivePhraseBoundaries(downbeats, beats);
  const bpm = track.bpm ?? estimateBpmFromBeats(beats);
  const hasMetadataBpm = typeof track.bpm === 'number' && track.bpm > 0;
  const quality = inferQuality(energyData, beats, hasMetadataBpm);
  const warnings = [
    ...(energyData.analysisQuality === 'fallback' ? ['El analisis detallado no estuvo disponible.'] : []),
    ...(!hasMetadataBpm && !bpm ? ['BPM no disponible con suficiente confianza.'] : []),
    ...detectBeatGridWarnings(beats, duration),
  ];

  return validateMusicalAnalysis({
    trackId: track.id,
    engine: 'standard',
    quality,
    bpm,
    tempoConfidence: inferTempoConfidence(beats, duration, hasMetadataBpm, quality),
    beats,
    downbeats,
    phraseBoundaries,
    sections: energyData.segments.map((segment) => ({
      label: mapEnergyLabel(segment.label),
      startTime: Number(Math.max(0, segment.startTime).toFixed(3)),
      endTime: Number(Math.max(segment.startTime, segment.endTime).toFixed(3)),
      confidence: sectionConfidence(segment.label, quality),
      avgEnergy: clamp(segment.avgEnergy, 0, 1),
    })),
    features: {
      times,
      rmsEnergy: energyData.rmsEnergy.map((value) => clamp(value, 0, 1)),
      lowEnergy: alignSeries(energyData.lowEnergy, energyData.rmsEnergy.length, energyData.rmsEnergy.map((value) => value * 0.7)),
      onsetStrength: buildOnsetStrength(energyData.rmsEnergy),
    },
    diagnostics: {
      analyzerVersion: MUSICAL_ANALYZER_VERSION,
      warnings,
      fallbackReason,
    },
  });
}

export function energyDataFromMusicalAnalysis(analysis: MusicalAnalysis): EnergyData {
  const duration = Math.max(
    analysis.features.times[analysis.features.times.length - 1] ?? 0,
    analysis.sections[analysis.sections.length - 1]?.endTime ?? 0,
  );
  const hopSeconds = inferHopSeconds(analysis.features.times);
  return {
    trackId: analysis.trackId,
    sampleRate: 11025,
    hopSize: Math.max(1, Math.round(11025 * hopSeconds)),
    times: analysis.features.times,
    rmsEnergy: analysis.features.rmsEnergy,
    lowEnergy: alignSeries(analysis.features.lowEnergy, analysis.features.rmsEnergy.length, analysis.features.rmsEnergy),
    onsets: analysis.features.times.filter((_, index) => (analysis.features.onsetStrength[index] ?? 0) >= 0.62),
    beats: analysis.beats,
    segments: analysis.sections.map((section) => ({
      startTime: section.startTime,
      endTime: section.endTime || duration,
      avgEnergy: section.avgEnergy ?? averageEnergyInRange(analysis, section.startTime, section.endTime),
      label: labelForEnergy(section.label),
    })),
    analysisQuality: analysis.quality,
  };
}

function buildTimes(energyData: EnergyData, duration: number): number[] {
  if (energyData.times?.length === energyData.rmsEnergy.length) return cleanTimes(energyData.times, duration);
  if (energyData.rmsEnergy.length === 0) return [];
  if (energyData.rmsEnergy.length === 1) return [0];
  const maxTime = duration > 0 ? duration : energyData.rmsEnergy.length - 1;
  return energyData.rmsEnergy.map((_, index) => Number(((index / (energyData.rmsEnergy.length - 1)) * maxTime).toFixed(3)));
}

function inferDuration(energyData: EnergyData): number {
  if (energyData.times?.length) return energyData.times[energyData.times.length - 1];
  return energyData.rmsEnergy.length;
}

function inferQuality(energyData: EnergyData, beats: number[], hasMetadataBpm: boolean): MusicalAnalysisQuality {
  if (energyData.analysisQuality === 'fallback') return 'fallback';
  if (beats.length > 64 && hasMetadataBpm && energyData.segments.length >= 4) return 'medium';
  if (beats.length > 24 && energyData.segments.length >= 3) return 'low';
  return 'fallback';
}

function inferTempoConfidence(
  beats: number[],
  duration: number,
  hasMetadataBpm: boolean,
  quality: MusicalAnalysisQuality,
): number {
  if (quality === 'fallback') return hasMetadataBpm ? 0.55 : 0.32;
  if (beats.length < 8 || duration <= 0) return hasMetadataBpm ? 0.58 : 0.38;
  const coverage = (beats[beats.length - 1] - beats[0]) / duration;
  return clamp((hasMetadataBpm ? 0.48 : 0.28) + (coverage * 0.28), 0, hasMetadataBpm ? 0.78 : 0.58);
}

function estimateBpmFromBeats(beats: number[]): number | undefined {
  if (beats.length < 8) return undefined;
  const intervals = beats.slice(1).map((beat, index) => beat - beats[index]).filter((value) => value > 0.2 && value < 2);
  if (intervals.length < 4) return undefined;
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  const bpm = 60 / median;
  return bpm >= 40 && bpm <= 260 ? Number(bpm.toFixed(2)) : undefined;
}

function detectBeatGridWarnings(beats: number[], duration: number): string[] {
  if (beats.length < 16 || duration <= 0) return [];

  const intervals = beats
    .slice(1)
    .map((beat, index) => beat - beats[index])
    .filter((value) => value > 0.2 && value < 2);

  if (intervals.length < 12) return ['La grilla puede requerir revision manual.'];

  const sorted = [...intervals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const irregularRatio = intervals.filter((value) => Math.abs(value - median) / median > 0.08).length / intervals.length;
  const coverage = (beats[beats.length - 1] - beats[0]) / duration;
  const warnings: string[] = [];

  if (irregularRatio > 0.22) {
    warnings.push('La grilla puede estar corrida o tener variaciones de tempo.');
  }

  if (coverage < 0.62) {
    warnings.push('La deteccion de beat no cubre suficiente parte del track.');
  }

  return warnings;
}

function buildOnsetStrength(energy: number[]): number[] {
  if (energy.length === 0) return [];
  const deltas = energy.map((value, index) => Math.max(0, value - (energy[index - 1] ?? value)));
  const high = Math.max(0.001, percentile([...deltas].sort((a, b) => a - b), 0.95));
  return deltas.map((value) => clamp(value / high, 0, 1));
}

function mapEnergyLabel(label?: string): MusicalSectionLabel {
  const normalized = (label || '').toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'INTRO') return 'INTRO';
  if (normalized === 'GROOVE' || normalized === 'MAIN') return 'GROOVE';
  if (normalized === 'BREAK') return 'BREAK';
  if (normalized === 'BUILD' || normalized === 'BUILD_UP') return 'BUILD';
  if (normalized === 'DROP') return 'DROP';
  if (normalized === 'OUTRO') return 'OUTRO';
  return 'UNKNOWN';
}

function labelForEnergy(label: MusicalSectionLabel): string {
  const labels: Record<MusicalSectionLabel, string> = {
    INTRO: 'Intro',
    GROOVE: 'Groove',
    BREAK: 'Break',
    BUILD: 'Build',
    DROP: 'Drop',
    OUTRO: 'Outro',
    UNKNOWN: 'Track',
  };
  return labels[label];
}

function sectionConfidence(label: string | undefined, quality: MusicalAnalysisQuality): number {
  const base = label ? 0.58 : 0.42;
  const scale: Record<MusicalAnalysisQuality, number> = {
    high: 1,
    medium: 0.9,
    low: 0.78,
    fallback: 0.52,
    failed: 0.2,
  };
  return clamp(base * scale[quality], 0.1, 0.82);
}

function alignSeries(values: number[], length: number, fallback: number[]): number[] {
  if (values.length === length) return values.map((value) => clamp(value, 0, 1));
  if (values.length < 2) return fallback.slice(0, length).map((value) => clamp(value, 0, 1));
  return Array.from({ length }, (_, index) => {
    const sourceIndex = (index / Math.max(1, length - 1)) * (values.length - 1);
    const left = Math.floor(sourceIndex);
    const right = Math.min(values.length - 1, left + 1);
    const ratio = sourceIndex - left;
    return clamp(values[left] * (1 - ratio) + values[right] * ratio, 0, 1);
  });
}

function averageEnergyInRange(analysis: MusicalAnalysis, startTime: number, endTime: number): number {
  const values = analysis.features.rmsEnergy.filter((_, index) => {
    const time = analysis.features.times[index] ?? index;
    return time >= startTime && time <= endTime;
  });
  if (values.length === 0) return 0.5;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function inferHopSeconds(times: number[]): number {
  if (times.length < 2) return 1;
  return Math.max(0.05, times[1] - times[0]);
}

function cleanTimes(values: number[], duration: number): number[] {
  return values
    .filter((value) => Number.isFinite(value) && value >= 0 && (!duration || value <= duration))
    .map((value) => Number(value.toFixed(3)));
}

function percentile(sortedValues: number[], ratio: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.max(0, Math.min(sortedValues.length - 1, Math.round((sortedValues.length - 1) * ratio)));
  return sortedValues[index];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
