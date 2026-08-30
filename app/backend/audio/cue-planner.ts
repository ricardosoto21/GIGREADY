import { v4 as uuidv4 } from 'uuid';
import type {
  CueSource,
  CueType,
  MusicalAnalysis,
  MusicalAnalysisQuality,
  MusicalAnalysisSection,
  SnapQuality,
  SuggestedCue,
  Track,
} from '../../src/types';

interface CuePlannerOptions {
  minConfidence?: number;
}

interface Candidate {
  type: CueType;
  time: number;
  label: string;
  confidence: number;
  reason: string;
}

export function planCueSuggestions(
  track: Track,
  analysis: MusicalAnalysis,
  options: CuePlannerOptions = {},
): SuggestedCue[] {
  const duration = track.duration || 0;
  if (duration < 60 || analysis.quality === 'failed') return [];

  const minConfidence = options.minConfidence ?? 0.35;
  const qualityScale = qualityConfidenceScale(analysis.quality);
  const source: CueSource = analysis.quality === 'fallback' ? 'rule' : 'audio_analysis';
  const candidates = buildCandidates(track, analysis);
  const cues: SuggestedCue[] = [];

  for (const candidate of candidates) {
    const snapped = snapCueTime(candidate.time, analysis, duration);
    const confidence = clamp(candidate.confidence * qualityScale * snapConfidenceScale(snapped.quality), 0, 0.98);
    if (confidence < minConfidence) continue;
    if (snapped.time < 0 || snapped.time > duration) continue;
    if (cues.some((cue) => cue.type === candidate.type || Math.abs(cue.timeSeconds - snapped.time) < 1.5)) continue;

    cues.push({
      id: uuidv4(),
      trackId: track.id,
      type: candidate.type,
      timeSeconds: Number(snapped.time.toFixed(3)),
      label: candidate.label,
      confidence: Number(confidence.toFixed(2)),
      source,
      status: 'suggested',
      color: getCueColor(candidate.type),
      snapQuality: snapped.quality,
      reason: candidate.reason,
      analysisQuality: analysis.quality,
    });
  }

  return cues.sort((a, b) => a.timeSeconds - b.timeSeconds);
}

export function getCueColor(type: CueType): string {
  const colors: Record<CueType, string> = {
    INTRO: '#157f3b',
    FIRST_BEAT: '#365f91',
    MIX_IN: '#087990',
    GROOVE_START: '#5b5f97',
    BASS_IN: '#4f46a5',
    BREAK: '#9a6400',
    BUILD_UP: '#9d5425',
    DROP: '#b42318',
    MIX_OUT: '#9a3f73',
    OUTRO: '#7a4a91',
  };
  return colors[type];
}

function buildCandidates(track: Track, analysis: MusicalAnalysis): Candidate[] {
  const duration = track.duration || 0;
  const beatDuration = estimateBeatDuration(analysis);
  const phrase16 = beatDuration * 16;
  const phrase32 = beatDuration * 32;
  const intro = findSection(analysis, 'INTRO');
  const groove = findSection(analysis, 'GROOVE');
  const breakSection = findSection(analysis, 'BREAK');
  const build = findSection(analysis, 'BUILD');
  const drop = findSection(analysis, 'DROP');
  const outro = findSection(analysis, 'OUTRO');
  const firstBeat = analysis.beats[0] ?? 0;
  const candidates: Candidate[] = [];

  candidates.push({
    type: 'INTRO',
    time: 0,
    label: 'Intro',
    confidence: 0.92,
    reason: 'Inicio del track.',
  });

  candidates.push({
    type: 'FIRST_BEAT',
    time: firstBeat,
    label: 'First Beat',
    confidence: analysis.tempoConfidence >= 0.7 ? 0.9 : 0.72,
    reason: 'Primer beat con referencia rítmica.',
  });

  const mixInTime = nextPhraseBoundary(analysis, Math.max(intro?.endTime ?? phrase32, phrase16), phrase32);
  if (mixInTime > 0 && mixInTime < duration * 0.48) {
    candidates.push({
      type: 'MIX_IN',
      time: mixInTime,
      label: 'Mix In',
      confidence: 0.82,
      reason: 'Frase estable después de la introducción.',
    });
  }

  const grooveStart = groove?.startTime ?? nextPhraseBoundary(analysis, mixInTime + phrase16, phrase16);
  if (grooveStart > mixInTime + Math.min(2, beatDuration * 2) && grooveStart < duration * 0.55) {
    candidates.push({
      type: 'GROOVE_START',
      time: grooveStart,
      label: 'Groove Start',
      confidence: sectionConfidence(groove, 0.72),
      reason: 'Inicio de una sección estable.',
    });
  }

  if (grooveStart && grooveStart < duration * 0.45) {
    candidates.push({
      type: 'BASS_IN',
      time: nextPhraseBoundary(analysis, grooveStart, phrase16),
      label: 'Bass In',
      confidence: sectionConfidence(groove, 0.68),
      reason: 'Entrada probable de cuerpo rítmico.',
    });
  }

  if (breakSection && breakSection.startTime > duration * 0.18 && breakSection.startTime < duration * 0.82) {
    candidates.push({
      type: 'BREAK',
      time: breakSection.startTime,
      label: 'Break',
      confidence: sectionConfidence(breakSection, 0.78),
      reason: 'Inicio de una sección de menor energía.',
    });
  }

  const dropTime = drop?.startTime;
  const buildTime = build?.startTime ?? (
    dropTime ? previousPhraseBoundary(analysis, dropTime - phrase16, phrase16) : undefined
  );
  if (buildTime && dropTime && buildTime > duration * 0.22 && buildTime < dropTime - beatDuration) {
    candidates.push({
      type: 'BUILD_UP',
      time: buildTime,
      label: 'Build Up',
      confidence: sectionConfidence(build, 0.7),
      reason: 'Frase previa al retorno de energía.',
    });
  }

  if (drop && isValidDrop(drop, analysis) && drop.startTime > duration * 0.28 && drop.startTime < duration * 0.9) {
    candidates.push({
      type: 'DROP',
      time: drop.startTime,
      label: 'Drop',
      confidence: sectionConfidence(drop, 0.84),
      reason: 'Retorno de energía y low-end.',
    });
  }

  const mixOutBase = outro?.startTime ?? duration - (duration > 300 ? phrase32 * 2 : phrase32);
  const mixOutTime = previousPhraseBoundary(analysis, mixOutBase, phrase32);
  if (mixOutTime > duration * 0.55 && mixOutTime < duration - 12) {
    candidates.push({
      type: 'MIX_OUT',
      time: mixOutTime,
      label: 'Mix Out',
      confidence: sectionConfidence(outro, 0.78),
      reason: 'Frase útil antes de la salida.',
    });
  }

  const outroTime = outro?.startTime ?? previousPhraseBoundary(analysis, duration - phrase16, phrase16);
  const minimumOutroGap = Math.max(12, phrase16 * 0.75);
  const hasUsefulOutroGap = !candidates.some((candidate) => (
    candidate.type === 'MIX_OUT' && Math.abs(outroTime - candidate.time) < minimumOutroGap
  ));
  if (hasUsefulOutroGap && outroTime > duration * 0.62 && outroTime < duration) {
    candidates.push({
      type: 'OUTRO',
      time: outroTime,
      label: 'Outro',
      confidence: sectionConfidence(outro, 0.78),
      reason: 'Inicio de la sección final.',
    });
  }

  return candidates;
}

function snapCueTime(time: number, analysis: MusicalAnalysis, duration: number): { time: number; quality: SnapQuality } {
  const phrase = nearestWithin(analysis.phraseBoundaries, time, 4);
  if (phrase !== undefined) return { time: phrase, quality: 'phrase' };
  const downbeat = nearestWithin(analysis.downbeats, time, 2);
  if (downbeat !== undefined) return { time: downbeat, quality: 'downbeat' };
  const beat = nearestWithin(analysis.beats, time, 1);
  if (beat !== undefined) return { time: beat, quality: 'beat' };
  return { time: clamp(time, 0, duration), quality: 'unsnapped' };
}

function nextPhraseBoundary(analysis: MusicalAnalysis, afterTime: number, fallbackStep: number): number {
  const boundary = analysis.phraseBoundaries.find((time) => time >= afterTime);
  if (boundary !== undefined) return boundary;
  return Math.ceil(afterTime / fallbackStep) * fallbackStep;
}

function previousPhraseBoundary(analysis: MusicalAnalysis, beforeTime: number, fallbackStep: number): number {
  const boundary = [...analysis.phraseBoundaries].reverse().find((time) => time <= beforeTime);
  if (boundary !== undefined) return boundary;
  return Math.max(0, Math.floor(beforeTime / fallbackStep) * fallbackStep);
}

function nearestWithin(values: number[], target: number, toleranceSeconds: number): number | undefined {
  if (values.length === 0) return undefined;
  let best = values[0];
  let distance = Math.abs(best - target);
  for (const value of values) {
    const nextDistance = Math.abs(value - target);
    if (nextDistance < distance) {
      best = value;
      distance = nextDistance;
    }
  }
  return distance <= toleranceSeconds ? best : undefined;
}

function findSection(analysis: MusicalAnalysis, label: MusicalAnalysisSection['label']): MusicalAnalysisSection | undefined {
  return analysis.sections.find((section) => section.label === label);
}

function isValidDrop(drop: MusicalAnalysisSection, analysis: MusicalAnalysis): boolean {
  const before = averageEnergy(analysis, Math.max(0, drop.startTime - 16), drop.startTime);
  const after = averageEnergy(analysis, drop.startTime, Math.min(drop.endTime, drop.startTime + 16));
  const lowBefore = averageLowEnergy(analysis, Math.max(0, drop.startTime - 16), drop.startTime);
  const lowAfter = averageLowEnergy(analysis, drop.startTime, Math.min(drop.endTime, drop.startTime + 16));
  return after - before > 0.08 || lowAfter - lowBefore > 0.06 || drop.confidence >= 0.78;
}

function averageEnergy(analysis: MusicalAnalysis, start: number, end: number): number {
  return averageFeature(analysis.features.rmsEnergy, analysis.features.times, start, end);
}

function averageLowEnergy(analysis: MusicalAnalysis, start: number, end: number): number {
  return averageFeature(analysis.features.lowEnergy, analysis.features.times, start, end);
}

function averageFeature(values: number[], times: number[], start: number, end: number): number {
  const selected = values.filter((_, index) => {
    const time = times[index] ?? index;
    return time >= start && time <= end;
  });
  if (selected.length === 0) return 0;
  return selected.reduce((sum, value) => sum + value, 0) / selected.length;
}

function estimateBeatDuration(analysis: MusicalAnalysis): number {
  if (analysis.bpm && analysis.bpm > 0) return 60 / analysis.bpm;
  if (analysis.beats.length >= 4) {
    const intervals = analysis.beats.slice(1).map((beat, index) => beat - analysis.beats[index]).filter((value) => value > 0);
    intervals.sort((a, b) => a - b);
    return intervals[Math.floor(intervals.length / 2)] || 0.469;
  }
  return 0.469;
}

function sectionConfidence(section: MusicalAnalysisSection | undefined, fallback: number): number {
  return section ? Math.max(fallback, section.confidence) : fallback;
}

function qualityConfidenceScale(quality: MusicalAnalysisQuality): number {
  const scale: Record<MusicalAnalysisQuality, number> = {
    high: 1,
    medium: 0.92,
    low: 0.72,
    fallback: 0.62,
    failed: 0,
  };
  return scale[quality];
}

function snapConfidenceScale(quality: SnapQuality): number {
  const scale: Record<SnapQuality, number> = {
    phrase: 1,
    downbeat: 0.92,
    beat: 0.82,
    unsnapped: 0.68,
  };
  return scale[quality];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
