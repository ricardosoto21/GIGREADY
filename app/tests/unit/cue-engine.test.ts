import { describe, it, expect } from 'vitest';
import { suggestCues } from '../../backend/audio/cue-engine';
import type { EnergyData, Track } from '../../src/types';

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'test-track-1',
    path: 'C:\\Music\\track.mp3',
    filename: 'track.mp3',
    extension: '.mp3',
    directory: 'C:\\Music',
    fileSize: 8000000,
    modifiedAt: new Date().toISOString(),
    hasArtwork: false,
    ffprobeValid: true,
    riskLevel: 'ok',
    issues: [],
    suggestedCues: [],
    approvedCues: [],
    analysisStatus: 'completed',
    duration: 360,
    bpm: 128,
    ...overrides,
  };
}

describe('Cue Engine - suggestCues', () => {
  it('returns cues for a standard electronic track', () => {
    const track = makeTrack({ duration: 360, bpm: 128 });
    const cues = suggestCues(track);
    expect(cues.length).toBeGreaterThan(0);
  });

  it('always includes INTRO at 0 seconds', () => {
    const track = makeTrack({ duration: 360, bpm: 128 });
    const cues = suggestCues(track);
    const intro = cues.find((c) => c.type === 'INTRO');
    expect(intro).toBeDefined();
    expect(intro!.timeSeconds).toBe(0);
  });

  it('all cue times are within track duration', () => {
    const track = makeTrack({ duration: 360, bpm: 128 });
    const cues = suggestCues(track);
    for (const cue of cues) {
      expect(cue.timeSeconds).toBeGreaterThanOrEqual(0);
      expect(cue.timeSeconds).toBeLessThanOrEqual(track.duration!);
    }
  });

  it('all cues start as suggested status', () => {
    const track = makeTrack({ duration: 360, bpm: 128 });
    const cues = suggestCues(track);
    for (const cue of cues) {
      expect(cue.status).toBe('suggested');
    }
  });

  it('all cues have rule source', () => {
    const track = makeTrack({ duration: 360, bpm: 128 });
    const cues = suggestCues(track);
    for (const cue of cues) {
      expect(cue.source).toBe('rule');
    }
  });

  it('returns no cues for very short tracks', () => {
    const track = makeTrack({ duration: 30 });
    const cues = suggestCues(track);
    expect(cues).toHaveLength(0);
  });

  it('works without BPM (uses default 128)', () => {
    const track = makeTrack({ duration: 360, bpm: undefined });
    const cues = suggestCues(track);
    expect(cues.length).toBeGreaterThan(0);
  });

  it('cue times increase monotonically', () => {
    const track = makeTrack({ duration: 420, bpm: 130 });
    const cues = suggestCues(track);
    for (let i = 1; i < cues.length; i++) {
      expect(cues[i].timeSeconds).toBeGreaterThanOrEqual(cues[i - 1].timeSeconds);
    }
  });

  it('all cues have a color assigned', () => {
    const track = makeTrack({ duration: 360, bpm: 128 });
    const cues = suggestCues(track);
    for (const cue of cues) {
      expect(cue.color).toBeDefined();
      expect(cue.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('confidence values are between 0 and 1', () => {
    const track = makeTrack({ duration: 360, bpm: 128 });
    const cues = suggestCues(track);
    for (const cue of cues) {
      if (cue.confidence !== undefined) {
        expect(cue.confidence).toBeGreaterThanOrEqual(0);
        expect(cue.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  it('uses analyzed sections when energy data is available', () => {
    const track = makeTrack({ duration: 180, bpm: 120 });
    const energyData: EnergyData = {
      trackId: track.id,
      sampleRate: 11025,
      hopSize: 11025,
      rmsEnergy: Array.from({ length: 180 }, (_, index) => (index >= 72 && index < 132 ? 0.9 : 0.35)),
      lowEnergy: Array.from({ length: 180 }, (_, index) => (index >= 72 && index < 132 ? 0.9 : 0.25)),
      onsets: [0, 72],
      beats: Array.from({ length: 360 }, (_, index) => index * 0.5),
      segments: [
        { startTime: 0, endTime: 16, avgEnergy: 0.3, label: 'Intro' },
        { startTime: 16, endTime: 48, avgEnergy: 0.55, label: 'Groove' },
        { startTime: 48, endTime: 64, avgEnergy: 0.15, label: 'Break' },
        { startTime: 64, endTime: 72, avgEnergy: 0.5, label: 'Build' },
        { startTime: 72, endTime: 148, avgEnergy: 0.9, label: 'Drop' },
        { startTime: 148, endTime: 180, avgEnergy: 0.3, label: 'Outro' },
      ],
    };

    const cues = suggestCues(track, energyData);

    expect(cues.find((cue) => cue.type === 'BREAK')?.timeSeconds).toBe(48);
    expect(cues.find((cue) => cue.type === 'DROP')?.timeSeconds).toBe(72);
    expect(cues.every((cue) => cue.source === 'audio_analysis')).toBe(true);
  });
});
