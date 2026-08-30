import { describe, expect, it } from 'vitest';
import { calculateEnergyRating, rekordboxRatingValue } from '../../backend/audio/energy-rating';
import type { MusicalAnalysis, Track } from '../../src/types';

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
    bpm: 128,
    genre: 'Techno',
    ...overrides,
  };
}

function makeAnalysis(energy = 0.88): MusicalAnalysis {
  const times = Array.from({ length: 180 }, (_, index) => index);
  return {
    trackId: 'track-1',
    engine: 'standard',
    quality: 'medium',
    bpm: 128,
    tempoConfidence: 0.72,
    beats: Array.from({ length: 384 }, (_, index) => Number((index * 0.469).toFixed(3))),
    downbeats: Array.from({ length: 96 }, (_, index) => Number((index * 1.876).toFixed(3))),
    phraseBoundaries: Array.from({ length: 24 }, (_, index) => Number((index * 7.504).toFixed(3))),
    sections: [
      { label: 'INTRO', startTime: 0, endTime: 24, confidence: 0.7, avgEnergy: 0.4 },
      { label: 'GROOVE', startTime: 24, endTime: 72, confidence: 0.78, avgEnergy: energy },
      { label: 'BREAK', startTime: 72, endTime: 88, confidence: 0.7, avgEnergy: 0.24 },
      { label: 'DROP', startTime: 96, endTime: 152, confidence: 0.82, avgEnergy: energy },
      { label: 'OUTRO', startTime: 152, endTime: 180, confidence: 0.7, avgEnergy: 0.35 },
    ],
    features: {
      times,
      rmsEnergy: times.map((time) => (time >= 24 && time < 152 ? energy : 0.35)),
      lowEnergy: times.map((time) => (time >= 24 && time < 152 ? 0.9 : 0.28)),
      onsetStrength: times.map((_, index) => (index % 2 === 0 ? 0.82 : 0.32)),
    },
    diagnostics: {
      analyzerVersion: '1.2.0-beta.1',
      warnings: [],
    },
  };
}

describe('Energy rating', () => {
  it('uses genre metadata when profile is automatic', () => {
    const result = calculateEnergyRating(makeTrack({ genre: 'Techno' }), makeAnalysis(), 'auto');
    expect(result.profile).toBe('techno');
    expect(result.rating).toBeGreaterThanOrEqual(4);
  });

  it('keeps a manually selected profile', () => {
    const result = calculateEnergyRating(makeTrack({ genre: 'Techno' }), makeAnalysis(0.45), 'downtempo_warmup');
    expect(result.profile).toBe('downtempo_warmup');
    expect(result.rating).toBeGreaterThanOrEqual(1);
    expect(result.rating).toBeLessThanOrEqual(5);
  });

  it('resolves Psytrance from genre metadata and avoids under-rating high energy tracks', () => {
    const result = calculateEnergyRating(makeTrack({ genre: 'Psytrance' }), makeAnalysis(0.74), 'auto');
    expect(result.profile).toBe('psytrance');
    expect(result.rating).toBeGreaterThanOrEqual(3);
  });

  it('resolves Minimal from genre metadata', () => {
    const result = calculateEnergyRating(makeTrack({ genre: 'Minimal Techno' }), makeAnalysis(0.48), 'auto');
    expect(result.profile).toBe('minimal');
    expect(result.rating).toBeGreaterThanOrEqual(1);
    expect(result.rating).toBeLessThanOrEqual(5);
  });

  it('maps stars to Rekordbox rating values', () => {
    expect(rekordboxRatingValue(0)).toBe(0);
    expect(rekordboxRatingValue(1)).toBe(51);
    expect(rekordboxRatingValue(3)).toBe(153);
    expect(rekordboxRatingValue(5)).toBe(255);
  });
});
