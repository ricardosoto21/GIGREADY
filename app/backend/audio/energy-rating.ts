import type { EnergyRatingProfile, MusicalAnalysis, MusicalAnalysisSection, Track } from '../../src/types';

export interface EnergyRatingResult {
  score: number;
  rating: 1 | 2 | 3 | 4 | 5;
  profile: EnergyRatingProfile;
  confidence: number;
  reason: string;
}

interface ProfileWeights {
  sustainedEnergy: number;
  lowEnd: number;
  rhythmDensity: number;
  dropIntensity: number;
  sectionContrast: number;
  averageEnergy: number;
}

interface EnergyMetrics {
  sustainedEnergy: number;
  lowEnd: number;
  rhythmDensity: number;
  dropIntensity: number;
  sectionContrast: number;
  averageEnergy: number;
}

const PROFILE_WEIGHTS: Record<EnergyRatingProfile, ProfileWeights> = {
  auto: {
    sustainedEnergy: 0.25,
    lowEnd: 0.2,
    rhythmDensity: 0.2,
    dropIntensity: 0.15,
    sectionContrast: 0.1,
    averageEnergy: 0.1,
  },
  general: {
    sustainedEnergy: 0.25,
    lowEnd: 0.2,
    rhythmDensity: 0.2,
    dropIntensity: 0.15,
    sectionContrast: 0.1,
    averageEnergy: 0.1,
  },
  house_tech_house: {
    sustainedEnergy: 0.3,
    lowEnd: 0.22,
    rhythmDensity: 0.22,
    dropIntensity: 0.08,
    sectionContrast: 0.08,
    averageEnergy: 0.1,
  },
  techno: {
    sustainedEnergy: 0.28,
    lowEnd: 0.26,
    rhythmDensity: 0.24,
    dropIntensity: 0.06,
    sectionContrast: 0.06,
    averageEnergy: 0.1,
  },
  trance_melodic: {
    sustainedEnergy: 0.14,
    lowEnd: 0.16,
    rhythmDensity: 0.12,
    dropIntensity: 0.25,
    sectionContrast: 0.23,
    averageEnergy: 0.1,
  },
  psytrance: {
    sustainedEnergy: 0.26,
    lowEnd: 0.18,
    rhythmDensity: 0.28,
    dropIntensity: 0.08,
    sectionContrast: 0.06,
    averageEnergy: 0.14,
  },
  minimal: {
    sustainedEnergy: 0.24,
    lowEnd: 0.2,
    rhythmDensity: 0.26,
    dropIntensity: 0.04,
    sectionContrast: 0.08,
    averageEnergy: 0.18,
  },
  drum_bass: {
    sustainedEnergy: 0.2,
    lowEnd: 0.24,
    rhythmDensity: 0.3,
    dropIntensity: 0.14,
    sectionContrast: 0.06,
    averageEnergy: 0.06,
  },
  reggaeton_latin: {
    sustainedEnergy: 0.24,
    lowEnd: 0.26,
    rhythmDensity: 0.22,
    dropIntensity: 0.08,
    sectionContrast: 0.06,
    averageEnergy: 0.14,
  },
  hip_hop_trap: {
    sustainedEnergy: 0.18,
    lowEnd: 0.32,
    rhythmDensity: 0.18,
    dropIntensity: 0.1,
    sectionContrast: 0.06,
    averageEnergy: 0.16,
  },
  downtempo_warmup: {
    sustainedEnergy: 0.18,
    lowEnd: 0.14,
    rhythmDensity: 0.12,
    dropIntensity: 0.06,
    sectionContrast: 0.18,
    averageEnergy: 0.32,
  },
};

const PROFILE_LABELS: Record<EnergyRatingProfile, string> = {
  auto: 'Automatico',
  general: 'General DJ',
  house_tech_house: 'House / Tech House',
  techno: 'Techno',
  trance_melodic: 'Trance / Melodic',
  psytrance: 'Psytrance',
  minimal: 'Minimal / Minimal Techno',
  drum_bass: 'Drum & Bass',
  reggaeton_latin: 'Reggaeton / Latin',
  hip_hop_trap: 'Hip Hop / Trap',
  downtempo_warmup: 'Downtempo / Warm-up',
};

export function calculateEnergyRating(
  track: Track,
  analysis: MusicalAnalysis,
  selectedProfile: EnergyRatingProfile,
): EnergyRatingResult {
  const profile = selectedProfile === 'auto'
    ? resolveProfileFromGenre(track.genre)
    : selectedProfile;
  const weights = PROFILE_WEIGHTS[profile] ?? PROFILE_WEIGHTS.general;
  const metrics = calculateMetrics(analysis);
  const rawScore = clamp01(
    metrics.sustainedEnergy * weights.sustainedEnergy +
    metrics.lowEnd * weights.lowEnd +
    metrics.rhythmDensity * weights.rhythmDensity +
    metrics.dropIntensity * weights.dropIntensity +
    metrics.sectionContrast * weights.sectionContrast +
    metrics.averageEnergy * weights.averageEnergy,
  ) * 100;
  const score = calibrateGenreScore(rawScore, profile, metrics);
  const rating = scoreToRating(score);
  const confidence = calculateConfidence(analysis, metrics);
  const reason = buildReason(profile, metrics, rating);

  return {
    score: Number(score.toFixed(1)),
    rating,
    profile,
    confidence: Number(confidence.toFixed(2)),
    reason,
  };
}

export function rekordboxRatingValue(rating?: number): number {
  if (!rating || rating < 1) return 0;
  return Math.max(0, Math.min(255, Math.round(rating) * 51));
}

function calculateMetrics(analysis: MusicalAnalysis): EnergyMetrics {
  const rms = analysis.features.rmsEnergy;
  const low = alignSeries(analysis.features.lowEnergy, rms.length, rms.map((value) => value * 0.7));
  const onset = alignSeries(analysis.features.onsetStrength, rms.length, rms.map(() => 0));
  const averageEnergy = average(rms);
  const sustainedEnergy = rms.length ? rms.filter((value) => value >= 0.62).length / rms.length : 0;
  const lowEnd = percentile([...low].sort((a, b) => a - b), 0.75);
  const rhythmDensity = clamp01(average(onset) * 1.35);
  const dropIntensity = calculateDropIntensity(analysis);
  const sectionContrast = calculateSectionContrast(analysis);

  return {
    sustainedEnergy,
    lowEnd,
    rhythmDensity,
    dropIntensity,
    sectionContrast,
    averageEnergy,
  };
}

function calculateDropIntensity(analysis: MusicalAnalysis): number {
  const drop = findSection(analysis, 'DROP');
  if (!drop) return percentile([...analysis.features.rmsEnergy].sort((a, b) => a - b), 0.82);
  const before = averageFeature(analysis.features.rmsEnergy, analysis.features.times, Math.max(0, drop.startTime - 16), drop.startTime);
  const after = averageFeature(analysis.features.rmsEnergy, analysis.features.times, drop.startTime, Math.min(drop.endTime, drop.startTime + 24));
  const lowBefore = averageFeature(analysis.features.lowEnergy, analysis.features.times, Math.max(0, drop.startTime - 16), drop.startTime);
  const lowAfter = averageFeature(analysis.features.lowEnergy, analysis.features.times, drop.startTime, Math.min(drop.endTime, drop.startTime + 24));
  return clamp01(((after - before) * 0.55) + ((lowAfter - lowBefore) * 0.45) + (drop.confidence * 0.25));
}

function calculateSectionContrast(analysis: MusicalAnalysis): number {
  if (analysis.sections.length < 2) return 0.25;
  const values = analysis.sections.map((section) => section.avgEnergy ?? averageFeature(
    analysis.features.rmsEnergy,
    analysis.features.times,
    section.startTime,
    section.endTime,
  ));
  return clamp01(Math.max(...values) - Math.min(...values));
}

function calculateConfidence(analysis: MusicalAnalysis, metrics: EnergyMetrics): number {
  const qualityBase = {
    high: 0.9,
    medium: 0.76,
    low: 0.58,
    fallback: 0.36,
    failed: 0.12,
  }[analysis.quality];
  const featureCoverage = analysis.features.rmsEnergy.length >= 60 ? 0.08 : 0;
  const structureCoverage = analysis.sections.length >= 4 ? 0.06 : 0;
  const ratingClarity = Math.abs(metrics.averageEnergy - 0.5) * 0.08;
  return clamp01(qualityBase + featureCoverage + structureCoverage + ratingClarity);
}

function buildReason(profile: EnergyRatingProfile, metrics: EnergyMetrics, rating: number): string {
  const strongest = Object.entries(metrics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([key]) => metricLabel(key));
  return `${PROFILE_LABELS[profile]}: ${rating} estrellas por ${strongest.join(' y ')}.`;
}

function resolveProfileFromGenre(genre?: string): EnergyRatingProfile {
  const normalized = (genre || '').toLowerCase();
  if (/(psy|psytrance|goa|full[\s-]?on|forest|darkpsy|hi[\s-]?tech|hitech)/.test(normalized)) return 'psytrance';
  if (/(minimal|minimal techno|minimal tech|microhouse)/.test(normalized)) return 'minimal';
  if (/(techno|hardgroove|industrial)/.test(normalized)) return 'techno';
  if (/(tech house|house|garage|disco)/.test(normalized)) return 'house_tech_house';
  if (/(trance|melodic|progressive)/.test(normalized)) return 'trance_melodic';
  if (/(drum|dnb|jungle|bass)/.test(normalized)) return 'drum_bass';
  if (/(reggaeton|latin|dembow|dancehall)/.test(normalized)) return 'reggaeton_latin';
  if (/(hip hop|hip-hop|trap|rap)/.test(normalized)) return 'hip_hop_trap';
  if (/(ambient|downtempo|chill|warm)/.test(normalized)) return 'downtempo_warmup';
  return 'general';
}

function calibrateGenreScore(score: number, profile: EnergyRatingProfile, metrics: EnergyMetrics): number {
  if (profile === 'psytrance') {
    const floor = metrics.rhythmDensity >= 0.28 || metrics.sustainedEnergy >= 0.22 ? 43 : 34;
    const boosted = score * 0.86 + metrics.rhythmDensity * 18 + metrics.averageEnergy * 10;
    return Math.min(100, Math.max(floor, boosted));
  }

  if (profile === 'minimal') {
    const grooveScore = score * 0.9 + metrics.rhythmDensity * 12 + metrics.lowEnd * 8;
    return Math.min(92, Math.max(24, grooveScore));
  }

  if (profile === 'techno') {
    return Math.min(100, Math.max(28, score * 0.95 + metrics.sustainedEnergy * 8));
  }

  return score;
}

function scoreToRating(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 81) return 5;
  if (score >= 61) return 4;
  if (score >= 41) return 3;
  if (score >= 21) return 2;
  return 1;
}

function findSection(analysis: MusicalAnalysis, label: MusicalAnalysisSection['label']): MusicalAnalysisSection | undefined {
  return analysis.sections.find((section) => section.label === label);
}

function averageFeature(values: number[], times: number[], start: number, end: number): number {
  const selected = values.filter((_, index) => {
    const time = times[index] ?? index;
    return time >= start && time <= end;
  });
  return average(selected);
}

function alignSeries(values: number[], length: number, fallback: number[]): number[] {
  if (values.length === length) return values.map(clamp01);
  if (values.length < 2) return fallback.slice(0, length).map(clamp01);
  return Array.from({ length }, (_, index) => {
    const sourceIndex = (index / Math.max(1, length - 1)) * (values.length - 1);
    const left = Math.floor(sourceIndex);
    const right = Math.min(values.length - 1, left + 1);
    const ratio = sourceIndex - left;
    return clamp01(values[left] * (1 - ratio) + values[right] * ratio);
  });
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues: number[], ratio: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.max(0, Math.min(sortedValues.length - 1, Math.round((sortedValues.length - 1) * ratio)));
  return sortedValues[index];
}

function metricLabel(key: string): string {
  const labels: Record<string, string> = {
    sustainedEnergy: 'energia sostenida',
    lowEnd: 'low-end',
    rhythmDensity: 'densidad ritmica',
    dropIntensity: 'intensidad de drop',
    sectionContrast: 'contraste de secciones',
    averageEnergy: 'energia promedio',
  };
  return labels[key] ?? key;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
