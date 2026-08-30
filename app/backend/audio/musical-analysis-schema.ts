import { z } from 'zod';
import type {
  MusicalAnalysis,
  MusicalAnalysisQuality,
  MusicalSectionLabel,
  Track,
} from '../../src/types';

export const MUSICAL_ANALYZER_VERSION = '1.2.0-beta.1';

const sectionLabelSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase().replace(/\s+/g, '_');
}, z.enum(['INTRO', 'GROOVE', 'BREAK', 'BUILD', 'DROP', 'OUTRO', 'UNKNOWN']));

export const musicalAnalysisSchema = z.object({
  trackId: z.string(),
  engine: z.enum(['standard', 'advanced_internal']),
  quality: z.enum(['high', 'medium', 'low', 'fallback', 'failed']),
  bpm: z.number().positive().optional(),
  tempoConfidence: z.number().min(0).max(1),
  beats: z.array(z.number().nonnegative()),
  downbeats: z.array(z.number().nonnegative()),
  phraseBoundaries: z.array(z.number().nonnegative()),
  sections: z.array(z.object({
    label: sectionLabelSchema,
    startTime: z.number().nonnegative(),
    endTime: z.number().nonnegative(),
    confidence: z.number().min(0).max(1),
    avgEnergy: z.number().min(0).max(1).optional(),
  })),
  features: z.object({
    times: z.array(z.number().nonnegative()),
    rmsEnergy: z.array(z.number().min(0).max(1)),
    lowEnergy: z.array(z.number().min(0).max(1)),
    onsetStrength: z.array(z.number().min(0).max(1)),
    spectralFlux: z.array(z.number().min(0).max(1)).optional(),
  }),
  diagnostics: z.object({
    analyzerVersion: z.string(),
    warnings: z.array(z.string()),
    fallbackReason: z.string().optional(),
    error: z.string().optional(),
  }),
});

export const sidecarAnalysisSchema = musicalAnalysisSchema.partial({
  trackId: true,
  engine: true,
  quality: true,
  diagnostics: true,
}).extend({
  bpm: z.number().positive().optional(),
  tempoConfidence: z.number().min(0).max(1).optional(),
  beats: z.array(z.number().nonnegative()).optional(),
  downbeats: z.array(z.number().nonnegative()).optional(),
  phraseBoundaries: z.array(z.number().nonnegative()).optional(),
});

export function validateMusicalAnalysis(analysis: MusicalAnalysis): MusicalAnalysis {
  return musicalAnalysisSchema.parse(analysis) as MusicalAnalysis;
}

export function normalizeSidecarAnalysis(raw: unknown, track: Track): MusicalAnalysis {
  const parsed = sidecarAnalysisSchema.parse(raw);
  const features = parsed.features ?? {
    times: [],
    rmsEnergy: [],
    lowEnergy: [],
    onsetStrength: [],
  };
  const beats = cleanTimes(parsed.beats ?? [], track.duration);
  const downbeats = cleanTimes(parsed.downbeats ?? deriveDownbeats(beats), track.duration);
  const phraseBoundaries = cleanTimes(parsed.phraseBoundaries ?? derivePhraseBoundaries(downbeats, beats), track.duration);
  const warnings = parsed.diagnostics?.warnings ?? [];

  return validateMusicalAnalysis({
    trackId: track.id,
    engine: 'advanced_internal',
    quality: parsed.quality ?? inferQuality(parsed.tempoConfidence, beats, parsed.sections ?? []),
    bpm: parsed.bpm,
    tempoConfidence: parsed.tempoConfidence ?? inferTempoConfidence(beats, track.duration),
    beats,
    downbeats,
    phraseBoundaries,
    sections: normalizeSections(parsed.sections ?? [], track.duration),
    features: {
      times: cleanTimes(features.times ?? [], track.duration),
      rmsEnergy: normalizeFeatureLength(features.rmsEnergy ?? []),
      lowEnergy: normalizeFeatureLength(features.lowEnergy ?? []),
      onsetStrength: normalizeFeatureLength(features.onsetStrength ?? []),
      spectralFlux: features.spectralFlux ? normalizeFeatureLength(features.spectralFlux) : undefined,
    },
    diagnostics: {
      analyzerVersion: MUSICAL_ANALYZER_VERSION,
      warnings,
      fallbackReason: parsed.diagnostics?.fallbackReason,
      error: parsed.diagnostics?.error,
    },
  });
}

export function deriveDownbeats(beats: number[]): number[] {
  return beats.filter((_, index) => index % 4 === 0);
}

export function derivePhraseBoundaries(downbeats: number[], beats: number[]): number[] {
  const source = downbeats.length > 0 ? downbeats : deriveDownbeats(beats);
  return source.filter((_, index) => index % 4 === 0);
}

function inferQuality(
  tempoConfidence: number | undefined,
  beats: number[] | undefined,
  sections: Array<{ confidence: number }> | undefined,
): MusicalAnalysisQuality {
  const avgSectionConfidence = sections?.length
    ? sections.reduce((sum, section) => sum + section.confidence, 0) / sections.length
    : 0;
  const tempo = tempoConfidence ?? 0;
  if ((beats?.length ?? 0) > 32 && tempo >= 0.82 && avgSectionConfidence >= 0.74) return 'high';
  if ((beats?.length ?? 0) > 16 && tempo >= 0.62) return 'medium';
  return 'low';
}

function inferTempoConfidence(beats: number[], duration?: number): number {
  if (!duration || beats.length < 8) return 0.35;
  const coverage = Math.min(1, (beats[beats.length - 1] - beats[0]) / duration);
  return Math.max(0.35, Math.min(0.78, coverage));
}

function normalizeSections(
  sections: Array<{ label: MusicalSectionLabel | string; startTime: number; endTime: number; confidence: number; avgEnergy?: number }>,
  duration?: number,
) {
  return sections
    .map((section) => ({
      label: normalizeSectionLabel(section.label),
      startTime: clampTime(section.startTime, duration),
      endTime: clampTime(section.endTime, duration),
      confidence: clamp(section.confidence, 0, 1),
      avgEnergy: section.avgEnergy === undefined ? undefined : clamp(section.avgEnergy, 0, 1),
    }))
    .filter((section) => section.endTime > section.startTime)
    .sort((a, b) => a.startTime - b.startTime);
}

function normalizeSectionLabel(label: MusicalSectionLabel | string): MusicalSectionLabel {
  const normalized = String(label).trim().toUpperCase().replace(/\s+/g, '_');
  if (['INTRO', 'GROOVE', 'BREAK', 'BUILD', 'DROP', 'OUTRO'].includes(normalized)) {
    return normalized as MusicalSectionLabel;
  }
  if (normalized === 'MAIN') return 'GROOVE';
  if (normalized === 'BUILD_UP' || normalized === 'BUIDUP') return 'BUILD';
  return 'UNKNOWN';
}

function normalizeFeatureLength(values: number[]): number[] {
  return values.map((value) => clamp(value, 0, 1)).filter(Number.isFinite);
}

function cleanTimes(values: number[], duration?: number): number[] {
  const max = duration && duration > 0 ? duration : Number.POSITIVE_INFINITY;
  return [...new Set(values
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= max)
    .map((value) => Number(value.toFixed(3))))]
    .sort((a, b) => a - b);
}

function clampTime(value: number, duration?: number): number {
  const max = duration && duration > 0 ? duration : Number.POSITIVE_INFINITY;
  return Number(clamp(value, 0, max).toFixed(3));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
