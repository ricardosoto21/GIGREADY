import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '../../backend/scanner/filename-sanitizer';

describe('Filename Sanitizer', () => {
  it('returns unchanged result for clean filename', () => {
    const result = sanitizeFilename('Artist - Track Name.mp3');
    expect(result.hasChanges).toBe(false);
    expect(result.newName).toBe('Artist - Track Name.mp3');
  });

  it('removes emojis from filename', () => {
    const result = sanitizeFilename('🔥Track Ñandú final!!!.mp3');
    expect(result.newName).not.toMatch(/[\u{1F600}-\u{1F64F}]/u);
    expect(result.hasChanges).toBe(true);
    expect(result.changes).toContain('Emojis eliminados');
  });

  it('replaces accented characters', () => {
    const result = sanitizeFilename('Ñandú Corazón.mp3');
    expect(result.newName).not.toContain('ñ');
    expect(result.newName).not.toContain('ú');
    expect(result.newName).not.toContain('ó');
    expect(result.changes.some((c) => c.includes('Tildes'))).toBe(true);
  });

  it('replaces problematic characters', () => {
    const result = sanitizeFilename('Track: Final?.mp3');
    expect(result.newName).not.toContain(':');
    expect(result.newName).not.toContain('?');
  });

  it('normalizes multiple spaces', () => {
    const result = sanitizeFilename('Track   Name.mp3');
    expect(result.newName).toBe('Track_Name.mp3');
  });

  it('preserves file extension', () => {
    const result = sanitizeFilename('Track Name.flac');
    expect(result.newName.endsWith('.flac')).toBe(true);
  });

  it('truncates very long names', () => {
    const longName = 'A'.repeat(250) + '.mp3';
    const result = sanitizeFilename(longName, true, 100);
    expect(result.newName.length).toBeLessThanOrEqual(104); // 100 + .mp3
    expect(result.changes.some((c) => c.includes('acortado'))).toBe(true);
  });

  it('handles empty name after sanitization', () => {
    const result = sanitizeFilename('🔥🎵.mp3');
    expect(result.newName).not.toBe('.mp3');
    expect(result.newName.length).toBeGreaterThan(4);
  });
});
