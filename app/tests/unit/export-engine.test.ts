import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { exportCSV, exportM3U, exportPDF } from '../../backend/exporters/export-engine';
import type { DashboardSummary, ScanSession, Track } from '../../src/types';

function makeTrack(id: string, overrides: Partial<Track> = {}): Track {
  return {
    id,
    path: `C:\\Music\\track-${id}.mp3`,
    filename: `track-${id}.mp3`,
    extension: '.mp3',
    directory: 'C:\\Music',
    fileSize: 1000000,
    modifiedAt: new Date().toISOString(),
    hasArtwork: false,
    ffprobeValid: true,
    riskLevel: 'ok',
    issues: [],
    suggestedCues: [],
    approvedCues: [],
    analysisStatus: 'completed',
    duration: 300,
    ...overrides,
  };
}

describe('Export Engine', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gigready-export-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('exportCSV', () => {
    it('generates CSV with BOM', async () => {
      const tracks = [makeTrack('1', { artist: 'Artist A', title: 'Title A' })];
      const outputPath = path.join(tempDir, 'test.csv');
      await exportCSV(tracks, outputPath);
      
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content.startsWith('\uFEFF')).toBe(true);
      expect(content).toContain('Artist A');
      expect(content).toContain('Title A');
    });

    it('escapes special characters in CSV', async () => {
      const tracks = [makeTrack('1', { artist: 'Artist, Name', title: 'Track "Quote"' })];
      const outputPath = path.join(tempDir, 'test.csv');
      await exportCSV(tracks, outputPath);
      
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('"Artist, Name"');
      expect(content).toContain('"Track ""Quote"""');
    });
  });

  describe('exportM3U', () => {
    it('generates M3U8 with BOM and EXTINF', async () => {
      const tracks = [
        makeTrack('1', { artist: 'Artist A', title: 'Title A', duration: 300 }),
        makeTrack('2', { filename: 'Simple.wav', duration: 180 }),
      ];
      const outputPath = path.join(tempDir, 'test.m3u8');
      await exportM3U(tracks, outputPath);
      
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content.startsWith('\uFEFF')).toBe(true);
      expect(content).toContain('#EXTM3U');
      expect(content).toContain('#EXTINF:300,Artist A - Title A');
      expect(content).toContain('#EXTINF:180,Simple.wav');
      expect(content).toContain('C:\\Music\\track-1.mp3');
      expect(content).toContain('C:\\Music\\track-2.mp3');
    });

    it('excludes critical tracks from M3U', async () => {
      const tracks = [
        makeTrack('1', { riskLevel: 'ok' }),
        makeTrack('2', { riskLevel: 'critical' }),
      ];
      const outputPath = path.join(tempDir, 'test.m3u8');
      await exportM3U(tracks, outputPath);
      
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('track-1.mp3');
      expect(content).not.toContain('track-2.mp3');
    });
  });

  describe('exportPDF', () => {
    it('generates a PDF without runtime PDF dependencies', async () => {
      const tracks = [makeTrack('1', { riskLevel: 'warning' })];
      const session = {
        id: 's1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rootPath: 'C:\\Music',
        mode: 'normal',
        totalFiles: 1,
        audioFiles: 1,
        completedFiles: 1,
        failedFiles: 0,
        criticalCount: 0,
        warningCount: 1,
        infoCount: 0,
        duplicateExactCount: 0,
        duplicateProbableCount: 0,
        score: 82,
        status: 'completed',
        settings: {
          includeSubfolders: true,
          calculateHashes: false,
          validateWithFfprobe: true,
          analyzeCues: false,
          compatibilityProfile: 'general',
          minMp3Bitrate: 192,
          minDurationSeconds: 45,
          maxPathLength: 240,
          concurrency: 4,
        },
      } satisfies ScanSession;
      const dashboard = {
        score: 82,
        scoreLabel: 'Requiere revision menor',
        totalTracks: 1,
        criticalCount: 0,
        warningCount: 1,
        infoCount: 0,
        duplicateExactCount: 0,
        duplicateProbableCount: 0,
        lowQualityCount: 0,
        unreadableCount: 0,
        suggestedCuesCount: 0,
        approvedCuesCount: 0,
        scanDurationMs: 100,
      } satisfies DashboardSummary;
      const outputPath = path.join(tempDir, 'report.pdf');

      await exportPDF(tracks, session, dashboard, outputPath);

      const content = await fs.readFile(outputPath);
      expect(content.toString('ascii', 0, 8)).toBe('%PDF-1.4');
      expect(content.toString('ascii')).toContain('GigReady - Reporte de Auditoria');
    });
  });
});
