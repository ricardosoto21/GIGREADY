import { execFile } from 'child_process';
import { promisify } from 'util';
import type { EnergyData, EnergySegment, Track } from '../../src/types';
import { getFfprobePath } from '../ffmpeg/ffmpeg-path';

const execFileAsync = promisify(execFile);
const ANALYSIS_SAMPLE_RATE = 11025;
const MAX_BUFFER_BYTES = 24 * 1024 * 1024;
const ANALYSIS_TIMEOUT_MS = 90_000;

interface AstatsFrame {
  best_effort_timestamp_time?: string;
  tags?: {
    'lavfi.astats.Overall.RMS_level'?: string;
    'lavfi.astats.Overall.Peak_level'?: string;
  };
}

interface AstatsOutput {
  frames?: AstatsFrame[];
}

interface EnergyPoint {
  time: number;
  value: number;
}

/**
 * Analyze audio energy with ffprobe filters.
 * Falls back to a deterministic structure if the binary cannot decode the file.
 */
export async function analyzeEnergyData(track: Track): Promise<EnergyData> {
  if (!track.path || !track.duration || track.duration < 1) {
    return generateEnergyData(track);
  }

  try {
    const windowSeconds = track.duration > 900 ? 2 : 1;
    const [rmsPoints, lowPoints] = await Promise.all([
      readAstatsEnergy(track.path, windowSeconds),
      readAstatsEnergy(track.path, windowSeconds, 'low'),
    ]);

    if (rmsPoints.length < 3) return generateEnergyData(track);

    const rmsEnergy = normalizeSeries(rmsPoints.map((point) => point.value));
    const lowEnergy = alignSeries(
      normalizeSeries(lowPoints.map((point) => point.value)),
      rmsEnergy.length,
      rmsEnergy.map((value) => value * 0.7),
    );
    const times = rmsPoints.map((point) => point.time);
    const combined = rmsEnergy.map((value, index) => (value * 0.7) + ((lowEnergy[index] ?? value) * 0.3));
    const smoothCombined = smoothSeries(combined, 2);
    const onsets = detectOnsets(smoothCombined, times);
    const beats = estimateBeats(track, onsets);
    const segments = detectEnergySegments(track, smoothCombined, lowEnergy, times, beats);

    return {
      trackId: track.id,
      sampleRate: ANALYSIS_SAMPLE_RATE,
      hopSize: ANALYSIS_SAMPLE_RATE * windowSeconds,
      times,
      rmsEnergy,
      lowEnergy,
      onsets,
      beats,
      segments,
      analysisQuality: 'low',
    };
  } catch {
    return generateEnergyData(track);
  }
}

/**
 * Fallback energy map used when detailed audio analysis is unavailable.
 */
export function generateEnergyData(track: Track): EnergyData {
  const duration = track.duration || 300;
  const numPoints = Math.max(80, Math.min(360, Math.round(duration)));
  const rmsEnergy: number[] = [];

  const introEnd = duration * 0.15;
  const breakStart = duration * 0.45;
  const breakEnd = duration * 0.55;
  const dropStart = duration * 0.6;
  const outroStart = duration * 0.85;

  for (let index = 0; index < numPoints; index++) {
    const time = (index / Math.max(1, numPoints - 1)) * duration;
    let base = 0.55;

    if (time < introEnd) base = 0.35;
    else if (time >= breakStart && time < breakEnd) base = 0.18;
    else if (time >= dropStart && time < outroStart) base = 0.82;
    else if (time >= outroStart) base = 0.32;

    rmsEnergy.push(base);
  }

  const lowEnergy = rmsEnergy.map((value) => value * 0.75);
  const beats = estimateBeats(track, []);

  return {
    trackId: track.id,
    sampleRate: track.sampleRate || 44100,
    hopSize: Math.max(1, Math.round(duration / numPoints)),
    times: Array.from({ length: numPoints }, (_, index) => Number(((index / Math.max(1, numPoints - 1)) * duration).toFixed(3))),
    rmsEnergy,
    lowEnergy,
    onsets: [],
    beats,
    segments: [
      { startTime: 0, endTime: introEnd, avgEnergy: 0.35, label: 'Intro' },
      { startTime: introEnd, endTime: breakStart, avgEnergy: 0.58, label: 'Groove' },
      { startTime: breakStart, endTime: breakEnd, avgEnergy: 0.18, label: 'Break' },
      { startTime: breakEnd, endTime: dropStart, avgEnergy: 0.62, label: 'Build' },
      { startTime: dropStart, endTime: outroStart, avgEnergy: 0.82, label: 'Drop' },
      { startTime: outroStart, endTime: duration, avgEnergy: 0.32, label: 'Outro' },
    ],
    analysisQuality: 'fallback',
  };
}

async function readAstatsEnergy(filePath: string, windowSeconds: number, band?: 'low'): Promise<EnergyPoint[]> {
  const filter = buildAstatsFilter(filePath, windowSeconds, band);
  const { stdout } = await execFileAsync(getFfprobePath(), [
    '-v', 'error',
    '-f', 'lavfi',
    '-i', filter,
    '-show_entries',
    'frame=best_effort_timestamp_time:frame_tags=lavfi.astats.Overall.RMS_level,lavfi.astats.Overall.Peak_level',
    '-of',
    'json',
  ], {
    timeout: ANALYSIS_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER_BYTES,
  });

  const parsed = JSON.parse(stdout || '{}') as AstatsOutput;
  return (parsed.frames ?? [])
    .map((frame, index) => ({
      time: parseNumber(frame.best_effort_timestamp_time) ?? index * windowSeconds,
      value: dbToLinear(parseNumber(frame.tags?.['lavfi.astats.Overall.RMS_level'])),
    }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value));
}

function buildAstatsFilter(filePath: string, windowSeconds: number, band?: 'low'): string {
  const sampleCount = Math.max(1024, Math.round(ANALYSIS_SAMPLE_RATE * windowSeconds));
  const parts = [
    `amovie=filename='${escapeLavfiPath(filePath)}'`,
    `aresample=${ANALYSIS_SAMPLE_RATE}`,
  ];

  if (band === 'low') {
    parts.push('highpass=f=25', 'lowpass=f=180');
  }

  parts.push(`asetnsamples=n=${sampleCount}`);
  parts.push('astats=metadata=1:reset=1');
  return parts.join(',');
}

function escapeLavfiPath(filePath: string): string {
  return filePath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'");
}

function dbToLinear(db: number | undefined): number {
  if (db === undefined || !Number.isFinite(db)) return 0;
  if (db <= -80) return 0;
  if (db >= 0) return 1;
  return Math.pow(10, db / 20);
}

function normalizeSeries(values: number[]): number[] {
  if (values.length === 0) return values;
  const smoothed = smoothSeries(values, 1);
  const sorted = [...smoothed].sort((a, b) => a - b);
  const low = percentile(sorted, 0.08);
  const high = percentile(sorted, 0.95);
  const range = Math.max(0.0001, high - low);

  return smoothed.map((value) => clamp((value - low) / range, 0, 1));
}

function alignSeries(values: number[], length: number, fallback: number[]): number[] {
  if (values.length === length) return values;
  if (values.length < 2) return fallback;

  return Array.from({ length }, (_, index) => {
    const sourceIndex = (index / Math.max(1, length - 1)) * (values.length - 1);
    const left = Math.floor(sourceIndex);
    const right = Math.min(values.length - 1, left + 1);
    const ratio = sourceIndex - left;
    return values[left] * (1 - ratio) + values[right] * ratio;
  });
}

function smoothSeries(values: number[], radius: number): number[] {
  if (radius <= 0) return values;
  return values.map((_, index) => {
    let sum = 0;
    let count = 0;
    for (let offset = -radius; offset <= radius; offset++) {
      const nextIndex = index + offset;
      if (nextIndex >= 0 && nextIndex < values.length) {
        sum += values[nextIndex];
        count++;
      }
    }
    return sum / count;
  });
}

function detectOnsets(energy: number[], times: number[]): number[] {
  if (energy.length < 3) return [];
  const deltas = energy.slice(1).map((value, index) => Math.max(0, value - energy[index]));
  const threshold = Math.max(0.08, percentile([...deltas].sort((a, b) => a - b), 0.82));
  const onsets: number[] = [];

  for (let index = 1; index < energy.length; index++) {
    const delta = energy[index] - energy[index - 1];
    if (delta >= threshold && energy[index] > 0.32) {
      const time = times[index] ?? index;
      if (onsets.length === 0 || time - onsets[onsets.length - 1] > 1.5) {
        onsets.push(time);
      }
    }
  }

  return onsets;
}

function estimateBeats(track: Track, onsets: number[]): number[] {
  const duration = track.duration || 0;
  if (duration <= 0) return [];
  const bpm = track.bpm && track.bpm > 0 ? track.bpm : 128;
  const beatDuration = 60 / bpm;
  const firstBeat = onsets.find((time) => time <= Math.min(8, duration * 0.08)) ?? 0;
  const beats: number[] = [];

  for (let time = firstBeat; time <= duration; time += beatDuration) {
    beats.push(Number(time.toFixed(3)));
  }

  return beats;
}

export function detectEnergySegments(
  track: Track,
  energy: number[],
  lowEnergy: number[],
  times: number[],
  beats: number[] = [],
): EnergySegment[] {
  const duration = track.duration || times[times.length - 1] || energy.length;
  if (energy.length < 6 || duration <= 0) return generateEnergyData(track).segments;

  const introEnd = detectIntroEnd(energy, times, duration);
  const outroStart = detectOutroStart(energy, times, duration);
  const breakSegment = detectBreakSegment(energy, times, duration, introEnd, outroStart);
  const dropStart = detectDropStart(energy, lowEnergy, times, duration, breakSegment?.endTime ?? introEnd, outroStart);
  const segments: EnergySegment[] = [];

  addSegment(segments, 'Intro', 0, introEnd, energy, times);

  if (breakSegment && breakSegment.startTime > introEnd + 4) {
    addSegment(segments, 'Groove', introEnd, breakSegment.startTime, energy, times);
    addSegment(segments, 'Break', breakSegment.startTime, breakSegment.endTime, energy, times);
  } else if (dropStart > introEnd + 4) {
    addSegment(segments, 'Groove', introEnd, dropStart, energy, times);
  }

  if (breakSegment && dropStart > breakSegment.endTime + 2) {
    addSegment(segments, 'Build', breakSegment.endTime, dropStart, energy, times);
  }

  if (dropStart < outroStart - 4) {
    addSegment(segments, 'Drop', dropStart, outroStart, energy, times);
  }

  addSegment(segments, 'Outro', Math.max(outroStart, lastEnd(segments)), duration, energy, times);

  return mergeSmallSegments(snapSegmentsToBeats(segments, beats), duration);
}

function detectIntroEnd(energy: number[], times: number[], duration: number): number {
  const searchEnd = Math.min(duration * 0.28, 96);
  const maxIndex = findIndexAtTime(times, searchEnd);
  const median = percentile([...energy.slice(0, maxIndex + 1)].sort((a, b) => a - b), 0.55);

  for (let index = 4; index <= maxIndex; index++) {
    const current = avg(energy.slice(index, Math.min(energy.length, index + 4)));
    const previous = avg(energy.slice(Math.max(0, index - 4), index));
    if (current > Math.max(0.42, median + 0.1) && current - previous > 0.08) {
      return times[index] ?? duration * 0.15;
    }
  }

  return duration * 0.15;
}

function detectOutroStart(energy: number[], times: number[], duration: number): number {
  const startIndex = findIndexAtTime(times, duration * 0.68);
  const high = percentile([...energy].sort((a, b) => a - b), 0.65);

  for (let index = energy.length - 5; index > startIndex; index--) {
    const current = avg(energy.slice(index, Math.min(energy.length, index + 5)));
    const previous = avg(energy.slice(Math.max(0, index - 8), index));
    if (current < Math.max(0.28, high - 0.22) && previous - current > 0.08) {
      return times[index] ?? duration * 0.84;
    }
  }

  return duration * 0.85;
}

function detectBreakSegment(
  energy: number[],
  times: number[],
  duration: number,
  introEnd: number,
  outroStart: number,
): { startTime: number; endTime: number } | null {
  const startIndex = findIndexAtTime(times, Math.max(introEnd + 8, duration * 0.22));
  const endIndex = findIndexAtTime(times, Math.min(outroStart - 8, duration * 0.78));
  const threshold = percentile([...energy].sort((a, b) => a - b), 0.32);
  let best: { start: number; end: number; avg: number } | null = null;
  let index = startIndex;

  while (index < endIndex) {
    if (energy[index] > threshold) {
      index++;
      continue;
    }

    const start = index;
    while (index < endIndex && energy[index] <= threshold + 0.05) index++;
    const end = index;
    const startTime = times[start] ?? start;
    const endTime = times[end] ?? end;
    const length = endTime - startTime;
    if (length >= 8) {
      const segmentAvg = avg(energy.slice(start, end));
      if (!best || segmentAvg < best.avg) best = { start, end, avg: segmentAvg };
    }
  }

  if (!best) return null;
  return {
    startTime: times[best.start] ?? duration * 0.45,
    endTime: times[best.end] ?? duration * 0.55,
  };
}

function detectDropStart(
  energy: number[],
  lowEnergy: number[],
  times: number[],
  duration: number,
  afterTime: number,
  beforeTime: number,
): number {
  const startIndex = findIndexAtTime(times, Math.max(afterTime, duration * 0.25));
  const endIndex = findIndexAtTime(times, Math.min(beforeTime, duration * 0.86));
  let bestIndex = startIndex;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let index = startIndex + 1; index <= endIndex; index++) {
    const energyRise = energy[index] - avg(energy.slice(Math.max(0, index - 5), index));
    const lowRise = (lowEnergy[index] ?? energy[index]) - avg(lowEnergy.slice(Math.max(0, index - 5), index));
    const absoluteEnergy = energy[index];
    const score = (energyRise * 0.45) + (lowRise * 0.35) + (absoluteEnergy * 0.2);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return times[bestIndex] ?? duration * 0.6;
}

function addSegment(
  segments: EnergySegment[],
  label: string,
  startTime: number,
  endTime: number,
  energy: number[],
  times: number[],
): void {
  const start = Math.max(0, startTime);
  const end = Math.max(start, endTime);
  if (end - start < 2) return;
  const startIndex = findIndexAtTime(times, start);
  const endIndex = findIndexAtTime(times, end);
  segments.push({
    startTime: Number(start.toFixed(3)),
    endTime: Number(end.toFixed(3)),
    avgEnergy: avg(energy.slice(startIndex, Math.max(startIndex + 1, endIndex + 1))),
    label,
  });
}

function snapSegmentsToBeats(segments: EnergySegment[], beats: number[]): EnergySegment[] {
  if (beats.length < 4) return segments;
  return segments.map((segment, index) => {
    const snappedStart = index === 0 ? 0 : nearestValue(beats, segment.startTime);
    const snappedEnd = index === segments.length - 1 ? segment.endTime : nearestValue(beats, segment.endTime);
    return {
      ...segment,
      startTime: Math.min(snappedStart, snappedEnd),
      endTime: Math.max(snappedStart, snappedEnd),
    };
  });
}

function mergeSmallSegments(segments: EnergySegment[], duration: number): EnergySegment[] {
  const normalized = segments
    .filter((segment) => segment.endTime > segment.startTime)
    .sort((a, b) => a.startTime - b.startTime);

  if (normalized.length === 0) return [{ startTime: 0, endTime: duration, avgEnergy: 0.5, label: 'Track' }];

  for (let index = 1; index < normalized.length; index++) {
    normalized[index - 1].endTime = Math.min(normalized[index - 1].endTime, normalized[index].startTime);
  }
  normalized[normalized.length - 1].endTime = duration;

  return normalized.filter((segment) => segment.endTime - segment.startTime >= 1);
}

function findIndexAtTime(times: number[], time: number): number {
  if (times.length === 0) return 0;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < times.length; index++) {
    const distance = Math.abs(times[index] - time);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function nearestValue(values: number[], target: number): number {
  return values.reduce((best, value) => (
    Math.abs(value - target) < Math.abs(best - target) ? value : best
  ), values[0]);
}

function percentile(sortedValues: number[], ratio: number): number {
  if (sortedValues.length === 0) return 0;
  const index = clamp(Math.round((sortedValues.length - 1) * ratio), 0, sortedValues.length - 1);
  return sortedValues[index];
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lastEnd(segments: EnergySegment[]): number {
  return segments.length ? segments[segments.length - 1].endTime : 0;
}
