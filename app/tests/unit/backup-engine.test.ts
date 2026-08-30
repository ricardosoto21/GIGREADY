import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createBackup, createCleanFolder } from '../../backend/backup/backup-engine';

const testRoot = path.join(process.cwd(), '.tmp-tests', 'backup-engine');

async function writeFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

describe('Backup Engine', () => {
  beforeEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
    await fs.mkdir(testRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  it('creates a timestamped backup preserving relative structure', async () => {
    const sourceRoot = path.join(testRoot, 'source');
    const fileA = path.join(sourceRoot, 'playlist', 'track-a.mp3');
    const fileB = path.join(sourceRoot, 'playlist', 'nested', 'track-b.mp3');
    await writeFile(fileA, 'a');
    await writeFile(fileB, 'b');

    const backupPath = await createBackup([fileA, fileB], path.join(testRoot, 'backups'));

    expect(path.basename(backupPath)).toMatch(/^GigReady_Backup_/);
    await expect(fs.readFile(path.join(backupPath, 'track-a.mp3'), 'utf-8')).resolves.toBe('a');
    await expect(fs.readFile(path.join(backupPath, 'nested', 'track-b.mp3'), 'utf-8')).resolves.toBe('b');
  });

  it('removes a partial backup and rejects when any source cannot be copied', async () => {
    const sourceRoot = path.join(testRoot, 'source');
    const backupRoot = path.join(testRoot, 'backups');
    const existingFile = path.join(sourceRoot, 'track-a.mp3');
    const missingFile = path.join(sourceRoot, 'missing.mp3');
    await writeFile(existingFile, 'a');

    await expect(createBackup([existingFile, missingFile], backupRoot)).rejects.toThrow(
      'No se pudo completar el respaldo',
    );
    await expect(fs.readdir(backupRoot)).resolves.toEqual([]);
  });

  it('creates a clean folder with flat structure and safe filenames', async () => {
    const sourceRoot = path.join(testRoot, 'source');
    const outputRoot = path.join(testRoot, 'clean');
    const fileA = path.join(sourceRoot, 'playlist', 'original-a.mp3');
    const fileB = path.join(sourceRoot, 'playlist', 'original-b.mp3');
    await writeFile(fileA, 'a');
    await writeFile(fileB, 'b');

    const result = await createCleanFolder([
      { sourcePath: fileA, newFilename: 'Artist_A_Track.mp3' },
      { sourcePath: fileB, newFilename: 'Artist_B_Track.mp3' },
    ], outputRoot, true, sourceRoot);

    expect(result.copied).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.copiedFiles).toEqual([
      { sourcePath: fileA, destPath: path.join(outputRoot, 'Artist_A_Track.mp3') },
      { sourcePath: fileB, destPath: path.join(outputRoot, 'Artist_B_Track.mp3') },
    ]);
    await expect(fs.readFile(path.join(outputRoot, 'Artist_A_Track.mp3'), 'utf-8')).resolves.toBe('a');
    await expect(fs.readFile(path.join(outputRoot, 'Artist_B_Track.mp3'), 'utf-8')).resolves.toBe('b');
  });

  it('creates a clean folder using explicit relative paths', async () => {
    const sourceRoot = path.join(testRoot, 'source');
    const outputRoot = path.join(testRoot, 'clean');
    const fileA = path.join(sourceRoot, 'track-a.mp3');
    await writeFile(fileA, 'a');

    const result = await createCleanFolder([
      { sourcePath: fileA, relativePath: path.join('House', 'track-a.mp3') },
    ], outputRoot, false, sourceRoot);

    expect(result.copied).toBe(1);
    expect(result.copiedFiles[0]).toEqual({
      sourcePath: fileA,
      destPath: path.join(outputRoot, 'House', 'track-a.mp3'),
    });
    await expect(fs.readFile(path.join(outputRoot, 'House', 'track-a.mp3'), 'utf-8')).resolves.toBe('a');
  });
});
