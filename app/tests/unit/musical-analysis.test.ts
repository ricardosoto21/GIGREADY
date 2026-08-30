import { describe, expect, it } from 'vitest';
import { normalizeSidecarAnalysis } from '../../backend/audio/musical-analysis-schema';
import { planCueSuggestions } from '../../backend/audio/cue-planner';
import { musicalAnalysisFromEnergyData } from '../../backend/audio/standard-analyzer';
import type { EnergyData, MusicalAnalysis, Track } from '../../src/types';

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    path: 'C:\\Music\\Artist - Track.mp3',
    filename: 'Artist - Track.mp3',
    extension: '.mp3',
    directory: 'C:\\Music',
    fileSize: 1000,
    modifiedAt: new Date().toISOString(),
    hasArtwork: false,
    ffprobeValid: true,
    riskLevel: 'ok',
    issues: [],
    suggestedCues: [],
    approvedCues: [],
    analysisStatus: 'completed',
    duration: 180,
    bpm: 120,
    ...overrides,
  };
}

function makeAnalysis(track: Track, overrides: Partial<MusicalAnalysis> = {}): MusicalAnalysis {
  const beats = Array.from({ length: 360 }, (_, index) => index * 0.5);
  const downbeats = beats.filter((_, index) => index % 4 === 0);
  const phraseBoundaries = downbeats.filter((_, index) => index % 4 === 0);
  const times = Array.from({ length: 180 }, (_, index) => index);
  return {
    trackId: track.id,
    engine: 'advanced_internal',
    quality: 'high',
    bpm: 120,
    tempoConfidence: 0.92,
    beats,
    downbeats,
    phraseBoundaries,
    sections: [
      { label: 'INTRO', startTime: 0, endTime: 16, confidence: 0.9, avgEnergy: 0.25 },
      { label: 'GROOVE', startTime: 16, endTime: 48, confidence: 0.86, avgEnergy: 0.6 },
      { label: 'BREAK', startTime: 48, endTime: 64, confidence: 0.82, avgEnergy: 0.18 },
      { label: 'BUILD', startTime: 64, endTime: 72, confidence: 0.78, avgEnergy: 0.55 },
      { label: 'DROP', startTime: 72, endTime: 148, confidence: 0.88, avgEnergy: 0.9 },
      { label: 'OUTRO', startTime: 148, endTime: 180, confidence: 0.8, avgEnergy: 0.32 },
    ],
    features: {
      times,
      rmsEnergy: times.map((time) => (time >= 72 && time < 148 ? 0.9 : time >= 48 && time < 64 ? 0.15 : 0.45)),
      lowEnergy: times.map((time) => (time >= 72 && time < 148 ? 0.92 : 0.25)),
      onsetStrength: times.map((time) => (time === 72 ? 1 : 0.1)),
    },
    diagnostics: {
      analyzerVersion: '1.2.0-beta.1',
      warnings: [],
    },
    ...overrides,
  };
}

describe('Musical analysis contract', () => {
  it('normalizes sidecar output into a full analysis object', () => {
    const track = makeTrack();
    const analysis = normalizeSidecarAnalysis({
      quality: 'high',
      bpm: 124,
      tempoConfidence: 0.9,
      beats: [0, 0.484, 0.968, 1.452, 1.936],
      sections: [{ label: 'drop', startTime: 64, endTime: 120, confidence: 0.86 }],
      features: {
        times: [0, 1, 2],
        rmsEnergy: [0.2, 0.4, 0.8],
        lowEnergy: [0.1, 0.3, 0.7],
        onsetStrength: [0, 0.2, 1],
      },
    }, track);

    expect(analysis.trackId).toBe(track.id);
    expect(analysis.engine).toBe('advanced_internal');
    expect(analysis.sections[0].label).toBe('DROP');
    expect(analysis.downbeats.length).toBeGreaterThan(0);
    expect(analysis.phraseBoundaries.length).toBeGreaterThan(0);
  });
});

describe('Cue planner', () => {
  it('snaps strong section cues to phrase boundaries', () => {
    const track = makeTrack();
    const analysis = makeAnalysis(track);
    const cues = planCueSuggestions(track, analysis, { minConfidence: 0.5 });

    const drop = cues.find((cue) => cue.type === 'DROP');
    expect(drop).toBeDefined();
    expect(drop?.timeSeconds).toBe(72);
    expect(drop?.snapQuality).toBe('phrase');
    expect(drop?.analysisQuality).toBe('high');
  });

  it('filters low confidence fallback cues when threshold is strict', () => {
    const track = makeTrack();
    const analysis = makeAnalysis(track, { quality: 'fallback', engine: 'standard', tempoConfidence: 0.32 });
    const cues = planCueSuggestions(track, analysis, { minConfidence: 0.7 });

    expect(cues.length).toBe(0);
  });

  it('keeps basic fallback cues with the product default threshold', () => {
    const track = makeTrack({ bpm: undefined });
    const analysis = makeAnalysis(track, {
      quality: 'fallback',
      engine: 'standard',
      bpm: undefined,
      tempoConfidence: 0.32,
    });
    const cues = planCueSuggestions(track, analysis, { minConfidence: 0.35 });

    expect(cues.length).toBeGreaterThan(0);
    expect(cues.some((cue) => cue.type === 'INTRO')).toBe(true);
    expect(cues.every((cue) => cue.confidence === undefined || cue.confidence >= 0.35)).toBe(true);
  });

  it('keeps core fallback cues with previously saved threshold settings', () => {
    const track = makeTrack({ bpm: undefined });
    const analysis = makeAnalysis(track, {
      quality: 'fallback',
      engine: 'standard',
      bpm: undefined,
      tempoConfidence: 0.32,
    });
    const cues = planCueSuggestions(track, analysis, { minConfidence: 0.5 });

    expect(cues.some((cue) => cue.type === 'INTRO')).toBe(true);
    expect(cues.some((cue) => cue.type === 'MIX_IN')).toBe(true);
    expect(cues.every((cue) => cue.confidence === undefined || cue.confidence < 0.7)).toBe(true);
  });

  it('avoids redundant outro cues when mix out is already close to the outro section', () => {
    const track = makeTrack();
    const analysis = makeAnalysis(track);
    const cues = planCueSuggestions(track, analysis, { minConfidence: 0.5 });

    expect(cues.some((cue) => cue.type === 'MIX_OUT')).toBe(true);
    expect(cues.some((cue) => cue.type === 'OUTRO')).toBe(false);
  });
});

describe('Standard analyzer diagnostics', () => {
  it('warns when the beat grid appears irregular', () => {
    const track = makeTrack({ duration: 80, bpm: undefined });
    const times = Array.from({ length: 80 }, (_, index) => index);
    const beats = Array.from({ length: 120 }, (_, index) => {
      const drift = index % 5 === 0 ? 0.12 : index % 7 === 0 ? -0.09 : 0;
      return Number(Math.max(0, index * 0.5 + drift).toFixed(3));
    });
    const energyData: EnergyData = {
      trackId: track.id,
      sampleRate: 11025,
      hopSize: 11025,
      times,
      rmsEnergy: times.map((time) => (time > 16 && time < 64 ? 0.72 : 0.35)),
      lowEnergy: times.map((time) => (time > 16 && time < 64 ? 0.68 : 0.28)),
      onsets: beats.filter((_, index) => index % 4 === 0),
      beats,
      segments: [
        { startTime: 0, endTime: 16, avgEnergy: 0.35, label: 'Intro' },
        { startTime: 16, endTime: 48, avgEnergy: 0.72, label: 'Groove' },
        { startTime: 48, endTime: 64, avgEnergy: 0.68, label: 'Drop' },
        { startTime: 64, endTime: 80, avgEnergy: 0.3, label: 'Outro' },
      ],
    };

    const analysis = musicalAnalysisFromEnergyData(track, energyData);

    expect(analysis.diagnostics.warnings.some((warning) => warning.includes('grilla'))).toBe(true);
  });
});
