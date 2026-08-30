import { describe, it, expect } from 'vitest';
import { auditTrack, calculateRiskLevel, calculateScore } from '../../backend/risk/risk-engine';
import type { Track, ScanSettings } from '../../src/types';

const defaultSettings: ScanSettings = {
  mode: 'normal',
  includeSubfolders: true,
  calculateHashes: false,
  validateWithFfprobe: true,
  analyzeCues: true,
  analysisEngine: 'standard',
  compatibilityProfile: 'general',
  minMp3Bitrate: 192,
  minDurationSeconds: 45,
  maxPathLength: 250,
  concurrency: 4,
  advancedAnalysisConcurrency: 2,
  minCueConfidence: 0.35,
  energyRatingProfile: 'auto',
  acceptedFormats: ['.mp3', '.wav', '.aiff', '.flac', '.m4a', '.aac', '.ogg'],
  problematicChars: '<>:"/\\|?*',
};

function makeTrack(overrides: Partial<Track> = {}): Partial<Track> {
  return {
    id: 'test-id-1',
    path: 'C:\\Music\\Artist - Track.mp3',
    filename: 'Artist - Track.mp3',
    extension: '.mp3',
    directory: 'C:\\Music',
    fileSize: 8000000,
    modifiedAt: new Date().toISOString(),
    hasArtwork: true,
    ffprobeValid: true,
    duration: 240,
    bitrate: 320,
    sampleRate: 44100,
    channels: 2,
    artist: 'Test Artist',
    title: 'Test Track',
    genre: 'Electronic',
    ...overrides,
  };
}

describe('Risk Engine - auditTrack', () => {
  it('returns no issues for a perfect track', () => {
    const track = makeTrack({ bpm: 128, key: 'Am' });
    const issues = auditTrack(track, { settings: defaultSettings });
    const critical = issues.filter((i) => i.severity === 'critical');
    const warnings = issues.filter((i) => i.severity === 'warning');
    expect(critical).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('flags ffprobe invalid as critical', () => {
    const track = makeTrack({ ffprobeValid: false });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'critical' && i.type === 'ffprobe_invalid')).toBe(true);
  });

  it('flags zero duration as critical', () => {
    const track = makeTrack({ duration: 0 });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'critical' && i.type === 'duration_invalid')).toBe(true);
  });

  it('flags missing duration as critical', () => {
    const track = makeTrack({ duration: undefined });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'critical' && i.type === 'duration_invalid')).toBe(true);
  });

  it('flags MP3 at 128kbps as warning', () => {
    const track = makeTrack({ extension: '.mp3', bitrate: 128 });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'warning' && i.type === 'bitrate_very_low')).toBe(true);
  });

  it('flags MP3 below configured min bitrate as warning', () => {
    const track = makeTrack({ extension: '.mp3', bitrate: 160 });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'warning' && i.type === 'bitrate_low')).toBe(true);
  });

  it('does not flag WAV for bitrate', () => {
    const track = makeTrack({ extension: '.wav', bitrate: 1411 });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.type === 'bitrate_very_low' || i.type === 'bitrate_low')).toBe(false);
  });

  it('flags emoji in filename as warning', () => {
    const track = makeTrack({ filename: '🔥Track.mp3' });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'warning' && i.type === 'filename_emoji')).toBe(true);
  });

  it('flags path over limit as warning', () => {
    const longPath = 'C:\\' + 'A'.repeat(260);
    const track = makeTrack({ path: longPath });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'warning' && i.type === 'path_too_long')).toBe(true);
  });

  it('flags short duration as warning', () => {
    const track = makeTrack({ duration: 20 });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'warning' && i.type === 'duration_short')).toBe(true);
  });

  it('flags missing artist as info', () => {
    const track = makeTrack({ artist: undefined });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'info' && i.type === 'no_artist')).toBe(true);
  });

  it('flags missing title as info', () => {
    const track = makeTrack({ title: undefined });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'info' && i.type === 'no_title')).toBe(true);
  });

  it('flags missing artwork as info', () => {
    const track = makeTrack({ hasArtwork: false });
    const issues = auditTrack(track, { settings: defaultSettings });
    expect(issues.some((i) => i.severity === 'info' && i.type === 'no_artwork')).toBe(true);
  });
});

describe('Risk Engine - calculateRiskLevel', () => {
  it('returns critical when any critical issue exists', () => {
    const issues = [
      { id: '1', trackId: 'x', type: 'ffprobe_invalid', severity: 'critical' as const, message: '', canAutoFix: false },
      { id: '2', trackId: 'x', type: 'no_artist', severity: 'info' as const, message: '', canAutoFix: false },
    ];
    expect(calculateRiskLevel(issues)).toBe('critical');
  });

  it('returns warning when only warnings exist', () => {
    const issues = [
      { id: '1', trackId: 'x', type: 'bitrate_low', severity: 'warning' as const, message: '', canAutoFix: false },
    ];
    expect(calculateRiskLevel(issues)).toBe('warning');
  });

  it('returns ok when no issues', () => {
    expect(calculateRiskLevel([])).toBe('ok');
  });
});

describe('Risk Engine - calculateScore', () => {
  it('returns 100 for perfect library', () => {
    expect(calculateScore(10, 0, 0, 0)).toBe(100);
  });

  it('caps score at 49 when criticals exist', () => {
    const score = calculateScore(100, 1, 0, 0);
    expect(score).toBeLessThanOrEqual(49);
  });

  it('returns 100 for empty library', () => {
    expect(calculateScore(0, 0, 0, 0)).toBe(100);
  });

  it('reduces score for warnings', () => {
    const score = calculateScore(100, 0, 50, 0);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(50);
  });
});
