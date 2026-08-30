import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { getDatabase } from '../database/database';
import { scanDirectory } from './file-scanner';
import { extractMetadata, calculateHash, validateWithFfprobe } from '../metadata/metadata-extractor';
import { auditTrack, calculateRiskLevel, calculateScore } from '../risk/risk-engine';
import { detectExactDuplicates, detectProbableDuplicates } from '../duplicates/duplicate-engine';
import { analyzeMusicalTrack } from '../audio/musical-analysis-engine';
import { planCueSuggestions } from '../audio/cue-planner';
import { energyDataFromMusicalAnalysis } from '../audio/standard-analyzer';
import { MUSICAL_ANALYZER_VERSION } from '../audio/musical-analysis-schema';
import { calculateEnergyRating } from '../audio/energy-rating';
import type { MusicalAnalysis, ScanSettings, Track, TrackIssue, ScanProgress } from '../../src/types';

const TRACK_ANALYZER_VERSION = '1.0.3';

interface ActiveScan {
  sessionId: string;
  abortController: AbortController;
}

const activeScan: { current: ActiveScan | null } = { current: null };

/**
 * Start a full scan session.
 * Orchestrates file discovery, metadata extraction, risk analysis, duplicate detection, and cue suggestion.
 */
export async function startScan(
  rootPath: string,
  settingsInput: ScanSettings,
  senderWindow: BrowserWindow,
): Promise<string> {
  // Cancel any existing scan
  if (activeScan.current) {
    activeScan.current.abortController.abort();
  }

  const sessionId = uuidv4();
  const abortController = new AbortController();
  activeScan.current = { sessionId, abortController };

  const db = getDatabase();
  const createdAt = new Date().toISOString();
  const settings = normalizeScanSettings(settingsInput);

  // Create session record
  db.prepare(`
    INSERT INTO scan_sessions (id, created_at, updated_at, root_path, mode, status, settings_json)
    VALUES (?, ?, ?, ?, ?, 'running', ?)
  `).run(sessionId, createdAt, createdAt, rootPath, settings.mode, JSON.stringify(settings));

  // Run async so we can return sessionId immediately
  runScan(sessionId, rootPath, settings, abortController.signal, senderWindow).catch((err) => {
    console.error('Scan failed:', err);
    db.prepare(`UPDATE scan_sessions SET status='failed', updated_at=? WHERE id=?`).run(new Date().toISOString(), sessionId);
    clearActiveScan(sessionId);
    safeEmit(senderWindow, 'scan:error', { sessionId, message: err.message });
  });

  return sessionId;
}

async function runScan(
  sessionId: string,
  rootPath: string,
  settings: ScanSettings,
  signal: AbortSignal,
  win: BrowserWindow,
): Promise<void> {
  const db = getDatabase();
  const startTime = Date.now();

  // ── Phase 1: Discover files ──
  emitProgress(win, sessionId, 'discovering', 0, 1, undefined, 'Descubriendo archivos de audio...');

  const scanResult = await scanDirectory(
    rootPath,
    settings.acceptedFormats,
    settings.includeSubfolders,
    (discovered) => {
      emitProgress(win, sessionId, 'discovering', discovered, discovered, undefined, `Encontrados ${discovered} archivos de audio...`);
    },
    signal,
  );

  if (signal.aborted) return finalizeCancelled(sessionId, db);

  const audioFiles = scanResult.audioFiles;
  const total = audioFiles.length;

  db.prepare(`UPDATE scan_sessions SET total_files=?, audio_files=?, updated_at=? WHERE id=?`)
    .run(scanResult.totalFiles, total, new Date().toISOString(), sessionId);

  // ── Phase 2: Analyze tracks ──
  emitProgress(win, sessionId, 'analyzing', 0, total, undefined, `Analizando ${total} archivos...`);

  const processedTracks: Track[] = [];
  const concurrency = Math.min(settings.concurrency || 4, total);
  let completed = 0;
  let failed = 0;

  // Process in batches for concurrency
  for (let i = 0; i < audioFiles.length; i += concurrency) {
    if (signal.aborted) return finalizeCancelled(sessionId, db);

    const batch = audioFiles.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((filePath) => analyzeFile(filePath, sessionId, settings, db))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      completed++;

      if (result.status === 'fulfilled' && result.value) {
        processedTracks.push(result.value);
        if (result.value.riskLevel !== 'ok') {
          // Already stored issues in DB via analyzeFile
        }
      } else {
        failed++;
        const filePath = batch[j];
        // Store a failed track record
        const failureMessage = result.status === 'rejected'
          ? getErrorMessage(result.reason)
          : 'No se pudo procesar el archivo.';
        const failedTrack = createFailedTrack(filePath, failureMessage);
        storeTrack(failedTrack, sessionId, db);
        storeIssues(failedTrack.issues, db);
      }

      emitProgress(win, sessionId, 'analyzing', completed, total, batch[j], `Analizando: ${path.basename(batch[j])}`);
    }
  }

  if (signal.aborted) return finalizeCancelled(sessionId, db);

  // ── Phase 3: Detect duplicates ──
  emitProgress(win, sessionId, 'duplicates', 0, 1, undefined, 'Detectando duplicados...');

  let duplicateExactCount = 0;
  let duplicateProbableCount = 0;

  if (processedTracks.length > 0) {
    // Exact duplicates (only if hashes were calculated)
    if (settings.calculateHashes) {
      const exactGroups = detectExactDuplicates(processedTracks);
      duplicateExactCount = exactGroups.length;
      storeDuplicateGroups(exactGroups, sessionId, db);
    }

    // Probable duplicates
    const probableGroups = detectProbableDuplicates(processedTracks);
    duplicateProbableCount = probableGroups.length;
    storeDuplicateGroups(probableGroups, sessionId, db);
  }

  if (signal.aborted) return finalizeCancelled(sessionId, db);

  // ── Phase 4: Suggest cues ──
  if (processedTracks.length > 0) {
    const musicTracks = processedTracks.filter((track) => track.riskLevel !== 'critical' && track.duration);
    emitProgress(win, sessionId, 'cues', 0, musicTracks.length, undefined, 'Analizando estructura...');

    let musicIdx = 0;
    const musicConcurrency = Math.max(1, Math.min(
      settings.analysisEngine === 'advanced_internal' ? settings.advancedAnalysisConcurrency : settings.concurrency,
      musicTracks.length || 1,
    ));

    for (let i = 0; i < musicTracks.length; i += musicConcurrency) {
      if (signal.aborted) return finalizeCancelled(sessionId, db);

      const batch = musicTracks.slice(i, i + musicConcurrency);
      const results = await Promise.allSettled(
        batch.map((track) => analyzeTrackMusic(track, settings, signal, db)),
      );

      for (let index = 0; index < results.length; index++) {
        if (signal.aborted) return finalizeCancelled(sessionId, db);
        const result = results[index];
        if (result.status === 'fulfilled') {
          const { track, analysis } = result.value;
          storeMusicalAnalysis(track.id, analysis, db);
          storeEnergyData(track.id, energyDataFromMusicalAnalysis(analysis), db);
          updateAnalysisCache(track, settings, analysis, db);
          const energyRating = calculateEnergyRating(track, analysis, settings.energyRatingProfile);
          storeEnergyRating(track.id, energyRating, db);
          Object.assign(track, {
            energyScore: energyRating.score,
            energyRating: energyRating.rating,
            energyRatingProfile: energyRating.profile,
            energyRatingConfidence: energyRating.confidence,
            energyRatingReason: energyRating.reason,
          });
          emitProgress(win, sessionId, 'cues', musicIdx, musicTracks.length, track.filename, 'Guardando resultados...');

          if (settings.analyzeCues) {
            const cues = planCueSuggestions(track, analysis, { minConfidence: settings.minCueConfidence });

            for (const cue of cues) {
              db.prepare(`
              INSERT INTO suggested_cues (
                id, track_id, type, time_seconds, label, confidence, source, status, color,
                snap_quality, reason, analysis_quality
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              cue.id,
              cue.trackId,
              cue.type,
              cue.timeSeconds,
              cue.label,
              cue.confidence ?? null,
              cue.source,
              cue.status,
              cue.color ?? null,
              cue.snapQuality ?? null,
              cue.reason ?? null,
              cue.analysisQuality ?? null,
            );
            }
          }
        }

        musicIdx++;
        if (musicIdx % 5 === 0 || musicIdx === musicTracks.length) {
          emitProgress(win, sessionId, 'cues', musicIdx, musicTracks.length, undefined, 'Analizando estructura...');
        }
      }
    }
  }

  // ── Phase 5: Finalize ──
  emitProgress(win, sessionId, 'finalizing', total, total, undefined, 'Finalizando análisis...');

  // Calculate overall counts from DB
  const criticalCount = (db.prepare(`SELECT COUNT(*) as c FROM track_issues WHERE severity='critical' AND track_id IN (SELECT id FROM tracks WHERE session_id=?)`).get(sessionId) as any).c;
  const warningCount = (db.prepare(`SELECT COUNT(*) as c FROM track_issues WHERE severity='warning' AND track_id IN (SELECT id FROM tracks WHERE session_id=?)`).get(sessionId) as any).c;
  const infoCount = (db.prepare(`SELECT COUNT(*) as c FROM track_issues WHERE severity='info' AND track_id IN (SELECT id FROM tracks WHERE session_id=?)`).get(sessionId) as any).c;

  // Count unique tracks with each severity
  const criticalTracks = (db.prepare(`SELECT COUNT(DISTINCT track_id) as c FROM track_issues WHERE severity='critical' AND track_id IN (SELECT id FROM tracks WHERE session_id=?)`).get(sessionId) as any).c;

  const score = calculateScore(total, criticalTracks, 
    (db.prepare(`SELECT COUNT(DISTINCT track_id) as c FROM track_issues WHERE severity='warning' AND track_id IN (SELECT id FROM tracks WHERE session_id=?)`).get(sessionId) as any).c,
    (db.prepare(`SELECT COUNT(DISTINCT track_id) as c FROM track_issues WHERE severity='info' AND track_id IN (SELECT id FROM tracks WHERE session_id=?)`).get(sessionId) as any).c,
  );

  const durationMs = Date.now() - startTime;

  db.prepare(`
    UPDATE scan_sessions SET
      status='completed', updated_at=?, completed_files=?, failed_files=?,
      critical_count=?, warning_count=?, info_count=?,
      duplicate_exact_count=?, duplicate_probable_count=?,
      score=?, duration_ms=?
    WHERE id=?
  `).run(
    new Date().toISOString(), completed, failed,
    criticalCount, warningCount, infoCount,
    duplicateExactCount, duplicateProbableCount,
    score, durationMs, sessionId,
  );

  clearActiveScan(sessionId);
  safeEmit(win, 'scan:complete', { sessionId, score, total, criticalCount, warningCount });
}

async function analyzeFile(
  filePath: string,
  sessionId: string,
  settings: ScanSettings,
  db: any,
): Promise<Track | null> {
  const trackId = uuidv4();
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);
  const directory = path.dirname(filePath);

  try {
    // Check cache first
    const cached = checkCache(filePath, db);
    if (cached) {
      const cachedTrack = rehydrateCachedTrack(cached, trackId);
      storeTrack(cachedTrack, sessionId, db);
      storeIssues(cachedTrack.issues, db);
      return cachedTrack;
    }

    // Extract metadata
    const meta = await extractMetadata(filePath, {
      useFfprobeFallback: settings.validateWithFfprobe,
    });

    // Calculate hash if enabled
    let sha256: string | undefined;
    if (settings.calculateHashes) {
      try { sha256 = await calculateHash(filePath); } catch { /* ignore */ }
    }

    // Validate with ffprobe if enabled
    let ffprobeValid = true;
    if (settings.validateWithFfprobe) {
      if (meta.ffprobeValid !== undefined) {
        ffprobeValid = meta.ffprobeValid;
      } else {
        const ffResult = await validateWithFfprobe(filePath);
        ffprobeValid = ffResult.valid;
      }
    }

    const track: Track = {
      id: trackId,
      path: filePath,
      filename,
      extension: ext,
      directory,
      artist: meta.artist,
      title: meta.title,
      album: meta.album,
      genre: meta.genre,
      bpm: meta.bpm,
      key: meta.key,
      duration: meta.duration,
      bitrate: meta.bitrate,
      sampleRate: meta.sampleRate,
      channels: meta.channels,
      codec: meta.codec,
      container: meta.container,
      fileSize: meta.fileSize,
      modifiedAt: meta.modifiedAt,
      createdAt: meta.createdAt,
      sha256,
      hasArtwork: meta.hasArtwork,
      ffprobeValid,
      riskLevel: 'ok',
      issues: [],
      suggestedCues: [],
      approvedCues: [],
      analysisStatus: 'completed',
    };

    // Run audit rules
    const issues = auditTrack(track, { settings });
    track.riskLevel = calculateRiskLevel(issues);
    track.issues = issues;

    // Store in DB
    storeTrack(track, sessionId, db);
    storeIssues(issues, db);

    // Update cache
    updateCache(filePath, meta.fileSize, meta.modifiedAt, sha256, track, db);

    return track;
  } catch (error) {
    throw new Error(`${filename}: ${getErrorMessage(error)}`, { cause: error });
  }
}

function storeTrack(track: Track, sessionId: string, db: any): void {
  db.prepare(`
    INSERT OR REPLACE INTO tracks (
      id, session_id, path, filename, extension, directory,
      artist, title, album, genre, bpm, key_tag, duration, bitrate, sample_rate,
      channels, codec, container, file_size, modified_at, created_at,
      sha256, has_artwork, ffprobe_valid, risk_level, energy_score, energy_rating,
      energy_rating_profile, energy_rating_confidence, energy_rating_reason,
      analysis_status, error_message
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    track.id, sessionId,
    track.path, track.filename, track.extension, track.directory,
    track.artist ?? null, track.title ?? null, track.album ?? null, track.genre ?? null,
    track.bpm ?? null, track.key ?? null, track.duration ?? null, track.bitrate ?? null,
    track.sampleRate ?? null, track.channels ?? null, track.codec ?? null, track.container ?? null,
    track.fileSize, track.modifiedAt, track.createdAt ?? null,
    track.sha256 ?? null, track.hasArtwork ? 1 : 0, track.ffprobeValid ? 1 : 0,
    track.riskLevel,
    track.energyScore ?? null,
    track.energyRating ?? null,
    track.energyRatingProfile ?? null,
    track.energyRatingConfidence ?? null,
    track.energyRatingReason ?? null,
    track.analysisStatus,
    track.errorMessage ?? null,
  );
}

function createFailedTrack(filePath: string, errorMessage: string): Track {
  const trackId = uuidv4();
  return {
    id: trackId,
    path: filePath,
    filename: path.basename(filePath),
    extension: path.extname(filePath).toLowerCase(),
    directory: path.dirname(filePath),
    fileSize: 0,
    modifiedAt: new Date().toISOString(),
    hasArtwork: false,
    ffprobeValid: false,
    riskLevel: 'critical',
    issues: [{
      id: uuidv4(),
      trackId,
      type: 'file_processing_failed',
      severity: 'critical',
      message: 'Este archivo no pudo ser procesado.',
      recommendation: 'Verifica que el archivo exista, no este bloqueado y pueda reproducirse en otro software.',
      technicalDetails: errorMessage,
      canAutoFix: false,
    }],
    suggestedCues: [],
    approvedCues: [],
    analysisStatus: 'failed',
    errorMessage,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo procesar el archivo.';
}

function storeIssues(issues: TrackIssue[], db: any): void {
  for (const issue of issues) {
    db.prepare(`
      INSERT OR REPLACE INTO track_issues (id, track_id, type, severity, message, recommendation, technical_details, can_auto_fix)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      issue.id,
      issue.trackId,
      issue.type,
      issue.severity,
      issue.message,
      issue.recommendation ?? null,
      issue.technicalDetails ?? null,
      issue.canAutoFix ? 1 : 0,
    );
  }
}

function checkCache(filePath: string, db: any): Track | null {
  try {
    const stat = require('fs').statSync(filePath);
    const modifiedAt = stat.mtime.toISOString();
    const cached = db.prepare(`
      SELECT result_json FROM cache_entries
      WHERE path=? AND file_size=? AND modified_at=? AND analyzer_version=?
    `).get(filePath, stat.size, modifiedAt, TRACK_ANALYZER_VERSION) as any;
    if (cached) return JSON.parse(cached.result_json);
  } catch { /* cache miss */ }
  return null;
}

function rehydrateCachedTrack(cached: Track, trackId: string): Track {
  return {
    ...cached,
    id: trackId,
    issues: (cached.issues || []).map((issue) => ({
      ...issue,
      id: uuidv4(),
      trackId,
    })),
    duplicates: undefined,
    suggestedCues: [],
    approvedCues: [],
    analysisStatus: 'completed',
  };
}

function updateCache(filePath: string, fileSize: number, modifiedAt: string, sha256: string | undefined, track: Track, db: any): void {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO cache_entries (path, file_size, modified_at, sha256, analyzer_version, result_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(filePath, fileSize, modifiedAt, sha256 ?? null, TRACK_ANALYZER_VERSION, JSON.stringify(track), new Date().toISOString());
  } catch { /* ignore cache errors */ }
}

async function analyzeTrackMusic(
  track: Track,
  settings: ScanSettings,
  signal: AbortSignal,
  db: any,
): Promise<{ track: Track; analysis: MusicalAnalysis }> {
  const cached = checkAnalysisCache(track, settings, db);
  if (cached) return { track, analysis: cached };
  const analysis = await analyzeMusicalTrack(track, settings, signal);
  return { track, analysis };
}

function checkAnalysisCache(track: Track, settings: ScanSettings, db: any): MusicalAnalysis | null {
  try {
    const cached = db.prepare(`
      SELECT data_json FROM analysis_cache
      WHERE path=? AND file_size=? AND modified_at=? AND analyzer_version=? AND engine=?
    `).get(track.path, track.fileSize, track.modifiedAt, MUSICAL_ANALYZER_VERSION, settings.analysisEngine) as any;
    if (!cached) return null;
    const analysis = JSON.parse(cached.data_json) as MusicalAnalysis;
    return { ...analysis, trackId: track.id };
  } catch {
    return null;
  }
}

function updateAnalysisCache(track: Track, settings: ScanSettings, analysis: MusicalAnalysis, db: any): void {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO analysis_cache (
        path, file_size, modified_at, sha256, analyzer_version, engine, data_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      track.path,
      track.fileSize,
      track.modifiedAt,
      track.sha256 ?? null,
      MUSICAL_ANALYZER_VERSION,
      settings.analysisEngine,
      JSON.stringify(analysis),
      new Date().toISOString(),
    );
  } catch { /* cache failures should not stop a scan */ }
}

function storeMusicalAnalysis(trackId: string, analysis: MusicalAnalysis, db: any): void {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO musical_analysis (track_id, analyzer_version, engine, quality, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      trackId,
      analysis.diagnostics.analyzerVersion,
      analysis.engine,
      analysis.quality,
      JSON.stringify(analysis),
      new Date().toISOString(),
    );
  } catch { /* ignore analysis persistence errors */ }
}

function storeEnergyRating(trackId: string, rating: ReturnType<typeof calculateEnergyRating>, db: any): void {
  try {
    db.prepare(`
      UPDATE tracks SET
        energy_score=?,
        energy_rating=?,
        energy_rating_profile=?,
        energy_rating_confidence=?,
        energy_rating_reason=?
      WHERE id=?
    `).run(
      rating.score,
      rating.rating,
      rating.profile,
      rating.confidence,
      rating.reason,
      trackId,
    );
  } catch { /* rating failures should not stop a scan */ }
}

function storeDuplicateGroups(groups: any[], sessionId: string, db: any): void {
  for (const group of groups) {
    db.prepare(`INSERT OR IGNORE INTO duplicate_groups (id, session_id, type, confidence, recommendation) VALUES (?,?,?,?,?)`
    ).run(group.groupId, sessionId, group.type, group.confidence, group.recommendation ?? null);
    for (const trackId of group.trackIds) {
      db.prepare(`INSERT OR IGNORE INTO duplicate_members (group_id, track_id) VALUES (?,?)`).run(group.groupId, trackId);
    }
  }
}

function storeEnergyData(trackId: string, data: any, db: any): void {
  try {
    db.prepare(`INSERT OR REPLACE INTO energy_data (track_id, data_json) VALUES (?, ?)`)
      .run(trackId, JSON.stringify(data));
  } catch { /* ignore energy cache errors */ }
}

function emitProgress(win: BrowserWindow, sessionId: string, phase: ScanProgress['phase'], current: number, total: number, currentFile: string | undefined, message: string): void {
  safeEmit(win, 'scan:progress', { sessionId, phase, current, total, currentFile, message } as ScanProgress);
}

function safeEmit(win: BrowserWindow, channel: string, data: any): void {
  try {
    if (!win.isDestroyed()) win.webContents.send(channel, data);
  } catch { /* window may be closing */ }
}

function finalizeCancelled(sessionId: string, db: any): void {
  db.prepare(`UPDATE scan_sessions SET status='cancelled', updated_at=? WHERE id=?`).run(new Date().toISOString(), sessionId);
  clearActiveScan(sessionId);
}

function clearActiveScan(sessionId: string): void {
  if (activeScan.current?.sessionId === sessionId) {
    activeScan.current = null;
  }
}

export function cancelScan(sessionId: string): void {
  if (activeScan.current?.sessionId === sessionId) {
    activeScan.current.abortController.abort();
  }
}

function normalizeScanSettings(settings: ScanSettings): ScanSettings {
  const compatibilityProfile = settings.compatibilityProfile === 'rekordbox_cdj' ? 'rekordbox_cdj' : 'general';

  return {
    ...settings,
    mode: 'complete',
    includeSubfolders: true,
    calculateHashes: true,
    validateWithFfprobe: true,
    analyzeCues: true,
    analysisEngine: settings.analysisEngine || 'standard',
    compatibilityProfile,
    concurrency: Math.max(1, Math.min(16, settings.concurrency || 4)),
    advancedAnalysisConcurrency: Math.max(1, Math.min(4, settings.advancedAnalysisConcurrency || 2)),
    minCueConfidence: Math.max(0.1, Math.min(0.95, settings.minCueConfidence ?? 0.35)),
    energyRatingProfile: settings.energyRatingProfile || 'auto',
  };
}
