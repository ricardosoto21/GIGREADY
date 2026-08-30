import { DatabaseSync } from 'node:sqlite';
import * as path from 'path';
import * as fs from 'fs';

export type AppDatabase = DatabaseSync;

let db: AppDatabase | null = null;

/**
 * Initialize the SQLite database with all required tables.
 */
export function initDatabase(dbPath: string): AppDatabase {
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  createTables(db);
  return db;
}

export function ensureDatabase(dbPath: string): AppDatabase {
  return db ?? initDatabase(dbPath);
}

export function getDatabase(): AppDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase first.');
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function runInTransaction<T>(database: AppDatabase, action: () => T): T {
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = action();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      database.exec('ROLLBACK');
    } catch (rollbackError) {
      throw new AggregateError(
        [error],
        'La transaccion fallo y tampoco pudo revertirse.',
        { cause: rollbackError },
      );
    }
    throw error;
  }
}

function createTables(db: AppDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scan_sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      root_path TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'normal',
      total_files INTEGER DEFAULT 0,
      audio_files INTEGER DEFAULT 0,
      completed_files INTEGER DEFAULT 0,
      failed_files INTEGER DEFAULT 0,
      critical_count INTEGER DEFAULT 0,
      warning_count INTEGER DEFAULT 0,
      info_count INTEGER DEFAULT 0,
      duplicate_exact_count INTEGER DEFAULT 0,
      duplicate_probable_count INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      settings_json TEXT,
      duration_ms INTEGER
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      path TEXT NOT NULL,
      filename TEXT NOT NULL,
      extension TEXT NOT NULL,
      directory TEXT NOT NULL,
      artist TEXT,
      title TEXT,
      album TEXT,
      genre TEXT,
      bpm REAL,
      key_tag TEXT,
      duration REAL,
      bitrate INTEGER,
      sample_rate INTEGER,
      channels INTEGER,
      codec TEXT,
      container TEXT,
      file_size INTEGER NOT NULL,
      modified_at TEXT NOT NULL,
      created_at TEXT,
      sha256 TEXT,
      has_artwork INTEGER DEFAULT 0,
      ffprobe_valid INTEGER DEFAULT 0,
      risk_level TEXT NOT NULL DEFAULT 'ok',
      energy_score REAL,
      energy_rating INTEGER,
      energy_rating_profile TEXT,
      energy_rating_confidence REAL,
      energy_rating_reason TEXT,
      analysis_status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      FOREIGN KEY (session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS track_issues (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      recommendation TEXT,
      technical_details TEXT,
      can_auto_fix INTEGER DEFAULT 0,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS suggested_cues (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      type TEXT NOT NULL,
      time_seconds REAL NOT NULL,
      label TEXT NOT NULL,
      confidence REAL,
      source TEXT NOT NULL DEFAULT 'rule',
      status TEXT NOT NULL DEFAULT 'suggested',
      color TEXT,
      snap_quality TEXT,
      reason TEXT,
      analysis_quality TEXT,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS duplicate_groups (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      recommendation TEXT,
      FOREIGN KEY (session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS duplicate_members (
      group_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      PRIMARY KEY (group_id, track_id),
      FOREIGN KEY (group_id) REFERENCES duplicate_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cache_entries (
      path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      modified_at TEXT NOT NULL,
      sha256 TEXT,
      analyzer_version TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (path, file_size, modified_at)
    );

    CREATE TABLE IF NOT EXISTS energy_data (
      track_id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS musical_analysis (
      track_id TEXT PRIMARY KEY,
      analyzer_version TEXT NOT NULL,
      engine TEXT NOT NULL,
      quality TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analysis_cache (
      path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      modified_at TEXT NOT NULL,
      sha256 TEXT,
      analyzer_version TEXT NOT NULL,
      engine TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (path, file_size, modified_at, analyzer_version, engine)
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_session ON tracks(session_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_sha256 ON tracks(sha256);
    CREATE INDEX IF NOT EXISTS idx_issues_track ON track_issues(track_id);
    CREATE INDEX IF NOT EXISTS idx_issues_severity ON track_issues(severity);
    CREATE INDEX IF NOT EXISTS idx_cues_track ON suggested_cues(track_id);
    CREATE INDEX IF NOT EXISTS idx_cache_path ON cache_entries(path);
    CREATE INDEX IF NOT EXISTS idx_analysis_cache_path ON analysis_cache(path);
  `);

  addColumnIfMissing(db, 'suggested_cues', 'snap_quality', 'TEXT');
  addColumnIfMissing(db, 'suggested_cues', 'reason', 'TEXT');
  addColumnIfMissing(db, 'suggested_cues', 'analysis_quality', 'TEXT');
  addColumnIfMissing(db, 'tracks', 'energy_score', 'REAL');
  addColumnIfMissing(db, 'tracks', 'energy_rating', 'INTEGER');
  addColumnIfMissing(db, 'tracks', 'energy_rating_profile', 'TEXT');
  addColumnIfMissing(db, 'tracks', 'energy_rating_confidence', 'REAL');
  addColumnIfMissing(db, 'tracks', 'energy_rating_reason', 'TEXT');
}

function addColumnIfMissing(db: AppDatabase, tableName: string, columnName: string, columnType: string): void {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (columns.some((column) => column.name === columnName)) return;
  db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`).run();
}
