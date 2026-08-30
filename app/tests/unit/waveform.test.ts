import { describe, expect, it } from 'vitest';
import { clampTime, timeToX, xToTime } from '../../src/components/Waveform';

describe('waveform timing helpers', () => {
  it('maps time to x inside a zoomed view', () => {
    expect(timeToX(45, 30, 60, 600)).toBe(150);
  });

  it('maps x back to time inside a zoomed view', () => {
    expect(xToTime(300, 30, 60, 600)).toBe(60);
  });

  it('clamps cue movement to track duration', () => {
    expect(clampTime(-10, 240)).toBe(0);
    expect(clampTime(260, 240)).toBe(240);
    expect(clampTime(120, 240)).toBe(120);
  });
});
