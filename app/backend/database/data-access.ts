import { getDatabase, runInTransaction } from '../database/database';
import * as path from 'path';
import type {
  Track,
  TrackIssue,
  SuggestedCue,
  ScanSession,
  DashboardSummary,
  MusicalAnalysis,
} from '../../src/types';

// ── Sessions ──

export function getSession(sessionId: string): ScanSession | null {
  const db = getDatabase();
  const row = db.prepare(`SELECT * FROM scan_sessions WHERE id=?`).get(sessionId) as any;
  if (!row) return null;
  return mapSession(row);
}

export function getSessions(): ScanSession[] {
  const db = getDatabase();
  const rows = db.prepare(`SELECT * FROM scan_sessions ORDER BY created_at DESC`).all() as any[];
  return rows.map(mapSession);
}

function mapSession(row: any): ScanSession {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rootPath: row.root_path,
    mode: row.mode,
    totalFiles: row.total_files,
    audioFiles: row.audio_files,
    completedFiles: row.completed_files,
    failedFiles: row.failed_files,
    criticalCount: row.critical_count,
    warningCount: row.warning_count,
    infoCount: row.info_count,
    duplicateExactCount: row.duplicate_exact_count,
    duplicateProbableCount: row.duplicate_probable_count,
    score: row.score,
    status: row.status,
    settings: row.settings_json ? JSON.parse(row.settings_json) : {},
    durationMs: row.duration_ms,
  };
}

// ── Tracks ──

export function getTracks(sessionId: string, options?: { riskLevel?: string; limit?: number; offset?: number }): Track[] {
  const db = getDatabase();
  let query = `SELECT t.* FROM tracks t WHERE t.session_id=?`;
  const params: any[] = [sessionId];

  if (options?.riskLevel) {
    query += ` AND t.risk_level=?`;
    params.push(options.riskLevel);
  }

  query += ` ORDER BY CASE t.risk_level
    WHEN 'critical' THEN 0
    WHEN 'warning' THEN 1
    WHEN 'info' THEN 2
    ELSE 3
  END, t.filename ASC`;

  if (options?.limit) {
    query += ` LIMIT ?`;
    params.push(options.limit);
    if (options?.offset) {
      query += ` OFFSET ?`;
      params.push(options.offset);
    }
  }

  const rows = db.prepare(query).all(...params) as any[];
  if (rows.length === 0) return [];

  const issues = db.prepare(`
    SELECT ti.* FROM track_issues ti
    JOIN tracks t ON ti.track_id = t.id
    WHERE t.session_id=?
  `).all(sessionId) as any[];
  const cues = db.prepare(`
    SELECT sc.* FROM suggested_cues sc
    JOIN tracks t ON sc.track_id = t.id
    WHERE t.session_id=?
  `).all(sessionId) as any[];

  const issuesByTrack = groupByTrackId(issues);
  const cuesByTrack = groupByTrackId(cues);
  return rows.map((row) => mapTrack(
    row,
    issuesByTrack.get(row.id) ?? [],
    cuesByTrack.get(row.id) ?? [],
  ));
}

export function getTrack(trackId: string): Track | null {
  const db = getDatabase();
  const row = db.prepare(`SELECT * FROM tracks WHERE id=?`).get(trackId) as any;
  if (!row) return null;
  const issues = db.prepare(`SELECT * FROM track_issues WHERE track_id=?`).all(row.id) as any[];
  const cues = db.prepare(`SELECT * FROM suggested_cues WHERE track_id=?`).all(row.id) as any[];
  return mapTrack(row, issues, cues);
}

function mapTrack(row: any, issues: any[], cues: any[]): Track {
  const suggestedCues: SuggestedCue[] = cues.filter((c: any) => c.status !== 'approved' && c.status !== 'discarded').map(mapCue);
  const approvedCues: SuggestedCue[] = cues.filter((c: any) => c.status === 'approved').map(mapCue);

  return {
    id: row.id,
    path: row.path,
    filename: row.filename,
    extension: row.extension,
    directory: row.directory,
    artist: row.artist ?? undefined,
    title: row.title ?? undefined,
    album: row.album ?? undefined,
    genre: row.genre ?? undefined,
    bpm: row.bpm ?? undefined,
    key: row.key_tag ?? undefined,
    duration: row.duration ?? undefined,
    bitrate: row.bitrate ?? undefined,
    sampleRate: row.sample_rate ?? undefined,
    channels: row.channels ?? undefined,
    codec: row.codec ?? undefined,
    container: row.container ?? undefined,
    fileSize: row.file_size,
    modifiedAt: row.modified_at,
    createdAt: row.created_at ?? undefined,
    sha256: row.sha256 ?? undefined,
    hasArtwork: row.has_artwork === 1,
    ffprobeValid: row.ffprobe_valid === 1,
    riskLevel: row.risk_level,
    issues: issues.map(mapIssue),
    suggestedCues,
    approvedCues,
    energyScore: row.energy_score ?? undefined,
    energyRating: row.energy_rating ?? undefined,
    energyRatingProfile: row.energy_rating_profile ?? undefined,
    energyRatingConfidence: row.energy_rating_confidence ?? undefined,
    energyRatingReason: row.energy_rating_reason ?? undefined,
    analysisStatus: row.analysis_status,
    errorMessage: row.error_message ?? undefined,
  };
}

function groupByTrackId(rows: any[]): Map<string, any[]> {
  const grouped = new Map<string, any[]>();
  for (const row of rows) {
    const current = grouped.get(row.track_id) ?? [];
    current.push(row);
    grouped.set(row.track_id, current);
  }
  return grouped;
}

export interface TrackPathUpdate {
  trackId: string;
  originalPath: string;
  targetPath: string;
}

export function updateTrackPaths(updates: TrackPathUpdate[]): void {
  const db = getDatabase();
  const update = db.prepare(`
    UPDATE tracks SET path=?, filename=?, extension=?, directory=?
    WHERE id=? AND path=?
  `);
  runInTransaction(db, () => {
    for (const item of updates) {
      const result = update.run(
        item.targetPath,
        path.basename(item.targetPath),
        path.extname(item.targetPath).toLowerCase(),
        path.dirname(item.targetPath),
        item.trackId,
        item.originalPath,
      );
      if (Number(result.changes) !== 1) {
        throw new Error(`No se pudo actualizar la ruta del track ${item.trackId}.`);
      }
    }
  });
}

function mapIssue(row: any): TrackIssue {
  return {
    id: row.id,
    trackId: row.track_id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    recommendation: row.recommendation ?? undefined,
    technicalDetails: row.technical_details ?? undefined,
    canAutoFix: row.can_auto_fix === 1,
  };
}

function mapCue(row: any): SuggestedCue {
  return {
    id: row.id,
    trackId: row.track_id,
    type: row.type,
    timeSeconds: row.time_seconds,
    label: row.label,
    confidence: row.confidence ?? undefined,
    source: row.source,
    status: row.status,
    color: row.color ?? undefined,
    snapQuality: row.snap_quality ?? undefined,
    reason: row.reason ?? undefined,
    analysisQuality: row.analysis_quality ?? undefined,
  };
}

// ── Dashboard ──

export function getDashboard(sessionId: string): DashboardSummary | null {
  const db = getDatabase();
  const session = db.prepare(`SELECT * FROM scan_sessions WHERE id=?`).get(sessionId) as any;
  if (!session) return null;

  const suggestedCuesCount = (db.prepare(`
    SELECT COUNT(*) as c FROM suggested_cues sc
    JOIN tracks t ON sc.track_id = t.id
    WHERE t.session_id=? AND sc.status='suggested'
  `).get(sessionId) as any).c;

  const approvedCuesCount = (db.prepare(`
    SELECT COUNT(*) as c FROM suggested_cues sc
    JOIN tracks t ON sc.track_id = t.id
    WHERE t.session_id=? AND sc.status='approved'
  `).get(sessionId) as any).c;

  const lowQualityCount = (db.prepare(`
    SELECT COUNT(*) as c FROM tracks WHERE session_id=? AND bitrate IS NOT NULL AND bitrate < 192 AND extension='.mp3'
  `).get(sessionId) as any).c;

  const unreadableCount = (db.prepare(`
    SELECT COUNT(*) as c FROM tracks WHERE session_id=? AND analysis_status='failed'
  `).get(sessionId) as any).c;

  const score = session.score ?? 0;
  const scoreLabel =
    score >= 90 ? 'Listo' :
    score >= 70 ? 'Revisión menor' :
    score >= 50 ? 'Requiere revisión' :
    'Riesgo alto';

  return {
    score,
    scoreLabel,
    totalTracks: session.audio_files ?? 0,
    criticalCount: session.critical_count ?? 0,
    warningCount: session.warning_count ?? 0,
    infoCount: session.info_count ?? 0,
    duplicateExactCount: session.duplicate_exact_count ?? 0,
    duplicateProbableCount: session.duplicate_probable_count ?? 0,
    lowQualityCount,
    unreadableCount,
    suggestedCuesCount,
    approvedCuesCount,
    scanDurationMs: session.duration_ms ?? 0,
  };
}

// ── Duplicates ──

export function getDuplicateGroups(sessionId: string): any[] {
  const db = getDatabase();
  const groups = db.prepare(`SELECT * FROM duplicate_groups WHERE session_id=? ORDER BY type, id`).all(sessionId) as any[];

  return groups.map((group) => {
    const members = db.prepare(`
      SELECT t.* FROM duplicate_members dm
      JOIN tracks t ON dm.track_id = t.id
      WHERE dm.group_id=?
    `).all(group.id) as any[];

    return {
      groupId: group.id,
      type: group.type,
      confidence: group.confidence,
      recommendation: group.recommendation,
      tracks: members.map((m) => ({
        id: m.id,
        filename: m.filename,
        path: m.path,
        bitrate: m.bitrate,
        duration: m.duration,
        fileSize: m.file_size,
        modifiedAt: m.modified_at,
      })),
    };
  });
}

// ── Cues ──

export function approveCue(cueId: string): void {
  const db = getDatabase();
  db.prepare(`UPDATE suggested_cues SET status='approved' WHERE id=?`).run(cueId);
}

export function discardCue(cueId: string): void {
  const db = getDatabase();
  db.prepare(`UPDATE suggested_cues SET status='discarded' WHERE id=?`).run(cueId);
}

export function approveAllCues(trackId: string): void {
  const db = getDatabase();
  db.prepare(`UPDATE suggested_cues SET status='approved' WHERE track_id=? AND status IN ('suggested', 'edited')`).run(trackId);
}

export function updateCue(cue: Partial<SuggestedCue> & { id: string }): void {
  const db = getDatabase();
  const existing = db.prepare(`SELECT id FROM suggested_cues WHERE id=?`).get(cue.id);

  if (!existing) {
    if (!cue.trackId || cue.timeSeconds === undefined || !cue.type || !cue.label) return;
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
      cue.source ?? 'manual',
      cue.status ?? 'edited',
      cue.color ?? null,
      cue.snapQuality ?? null,
      cue.reason ?? null,
      cue.analysisQuality ?? null,
    );
    return;
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (cue.timeSeconds !== undefined) { updates.push('time_seconds=?'); values.push(cue.timeSeconds); }
  if (cue.label !== undefined) { updates.push('label=?'); values.push(cue.label); }
  if (cue.type !== undefined) { updates.push('type=?'); values.push(cue.type); }
  if (cue.status !== undefined) { updates.push('status=?'); values.push(cue.status); }
  if (cue.snapQuality !== undefined) { updates.push('snap_quality=?'); values.push(cue.snapQuality); }
  if (cue.reason !== undefined) { updates.push('reason=?'); values.push(cue.reason); }
  if (cue.analysisQuality !== undefined) { updates.push('analysis_quality=?'); values.push(cue.analysisQuality); }

  if (updates.length > 0) {
    values.push(cue.id);
    db.prepare(`UPDATE suggested_cues SET ${updates.join(', ')} WHERE id=?`).run(...values);
  }
}

export function approveAllSessionCues(sessionId: string): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE suggested_cues 
    SET status='approved' 
    WHERE status IN ('suggested', 'edited') 
    AND track_id IN (SELECT id FROM tracks WHERE session_id=?)
  `).run(sessionId);
}

// ── Energy ──

export function getEnergyData(trackId: string): any | null {
  const db = getDatabase();
  const row = db.prepare(`SELECT data_json FROM energy_data WHERE track_id=?`).get(trackId) as any;
  if (!row) return null;
  return JSON.parse(row.data_json);
}

export function storeEnergyData(trackId: string, data: any): void {
  const db = getDatabase();
  db.prepare(`INSERT OR REPLACE INTO energy_data (track_id, data_json) VALUES (?, ?)`).run(trackId, JSON.stringify(data));
}

export function getMusicalAnalysis(trackId: string): MusicalAnalysis | null {
  const db = getDatabase();
  const row = db.prepare(`SELECT data_json FROM musical_analysis WHERE track_id=?`).get(trackId) as any;
  if (!row) return null;
  return JSON.parse(row.data_json) as MusicalAnalysis;
}

export function storeMusicalAnalysis(trackId: string, analysis: MusicalAnalysis): void {
  const db = getDatabase();
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
}
