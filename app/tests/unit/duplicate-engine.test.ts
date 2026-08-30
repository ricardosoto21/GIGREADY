import { describe, it, expect } from 'vitest';
import { detectExactDuplicates, detectProbableDuplicates } from '../../backend/duplicates/duplicate-engine';
import type { Track } from '../../src/types';

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: Math.random().toString(36).slice(2),
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
    ...overrides,
  };
}

describe('Duplicate Engine - Exact Duplicates', () => {
  it('detects exact duplicates by SHA256', () => {
    const hash = 'abc123def456';
    const t1 = makeTrack({ sha256: hash, path: 'C:\\Music\\copy1.mp3' });
    const t2 = makeTrack({ sha256: hash, path: 'C:\\Music\\copy2.mp3' });
    const t3 = makeTrack({ sha256: 'differenthash', path: 'C:\\Music\\other.mp3' });

    const groups = detectExactDuplicates([t1, t2, t3]);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('exact');
    expect(groups[0].trackIds).toContain(t1.id);
    expect(groups[0].trackIds).toContain(t2.id);
    expect(groups[0].trackIds).not.toContain(t3.id);
  });

  it('returns empty when no duplicates', () => {
    const tracks = [
      makeTrack({ sha256: 'hash1' }),
      makeTrack({ sha256: 'hash2' }),
      makeTrack({ sha256: 'hash3' }),
    ];
    expect(detectExactDuplicates(tracks)).toHaveLength(0);
  });

  it('handles tracks without hashes gracefully', () => {
    const tracks = [
      makeTrack({ sha256: undefined }),
      makeTrack({ sha256: undefined }),
    ];
    expect(detectExactDuplicates(tracks)).toHaveLength(0);
  });
});

describe('Duplicate Engine - Probable Duplicates', () => {
  it('detects probable duplicates with same artist and title', () => {
    const t1 = makeTrack({
      artist: 'Test Artist', title: 'Same Song', duration: 240,
      filename: 'Test Artist - Same Song.mp3', fileSize: 8000000,
    });
    const t2 = makeTrack({
      artist: 'Test Artist', title: 'Same Song', duration: 242,
      filename: 'Test Artist - Same Song (2).mp3', fileSize: 7900000,
    });
    const t3 = makeTrack({
      artist: 'Other Artist', title: 'Different Track', duration: 180,
      filename: 'Other Artist - Different Track.mp3', fileSize: 5000000,
    });

    const groups = detectProbableDuplicates([t1, t2, t3]);
    expect(groups.length).toBeGreaterThanOrEqual(1);
    const firstGroup = groups[0];
    expect(firstGroup.trackIds).toContain(t1.id);
    expect(firstGroup.trackIds).toContain(t2.id);
  });

  it('returns empty when tracks are clearly different', () => {
    const tracks = [
      makeTrack({ artist: 'Artist A', title: 'Song One', duration: 180, filename: 'song1.mp3' }),
      makeTrack({ artist: 'Artist B', title: 'Song Two', duration: 300, filename: 'song2.mp3' }),
      makeTrack({ artist: 'Artist C', title: 'Song Three', duration: 240, filename: 'song3.mp3' }),
    ];
    const groups = detectProbableDuplicates(tracks, 0.9);
    expect(groups).toHaveLength(0);
  });
});
