import { describe, expect, it } from 'vitest';
import { detectEnergySegments, generateEnergyData } from '../../backend/audio/energy-analyzer';
import type { Track } from '../../src/types';

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
    ...overrides,
  };
}

describe('Energy Analyzer', () => {
  it('generates a fallback map with musical sections', () => {
    const energy = generateEnergyData(makeTrack());

    expect(energy.rmsEnergy.length).toBeGreaterThan(80);
    expect(energy.lowEnergy).toHaveLength(energy.rmsEnergy.length);
    expect(energy.segments.map((segment) => segment.label)).toContain('Break');
    expect(energy.segments.map((segment) => segment.label)).toContain('Drop');
  });

  it('detects break and drop from an energy curve', () => {
    const track = makeTrack({ duration: 120 });
    const times = Array.from({ length: 120 }, (_, index) => index);
    const energy = times.map((time) => {
      if (time < 18) return 0.25;
      if (time >= 45 && time < 62) return 0.12;
      if (time >= 72 && time < 102) return 0.9;
      if (time >= 102) return 0.28;
      return 0.58;
    });
    const lowEnergy = energy.map((value, index) => (index >= 72 && index < 102 ? 0.95 : value * 0.65));

    const segments = detectEnergySegments(track, energy, lowEnergy, times);

    const labels = segments.map((segment) => segment.label);
    expect(labels).toContain('Break');
    expect(labels).toContain('Drop');
    expect(segments.find((segment) => segment.label === 'Drop')?.startTime).toBeGreaterThanOrEqual(60);
  });
});
