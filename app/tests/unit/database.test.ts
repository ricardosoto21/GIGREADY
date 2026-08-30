import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, initDatabase } from '../../backend/database/database';
import { updateTrackPaths } from '../../backend/database/data-access';

afterEach(() => {
  closeDatabase();
});

describe('database', () => {
  it('creates the schema with the SQLite runtime bundled in Node', () => {
    const db = initDatabase(':memory:');
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all() as Array<{ name: string }>;

    expect(tables.map((table) => table.name)).toContain('scan_sessions');
    expect(tables.map((table) => table.name)).toContain('tracks');
  });

  it('rolls back every path update if one track no longer matches', () => {
    const db = initDatabase(':memory:');
    db.prepare(`
      INSERT INTO scan_sessions (id, created_at, updated_at, root_path, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('session-1', 'now', 'now', 'C:\\Music', 'complete');
    const insertTrack = db.prepare(`
      INSERT INTO tracks (
        id, session_id, path, filename, extension, directory,
        file_size, modified_at, risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTrack.run('track-1', 'session-1', 'C:\\Music\\one.mp3', 'one.mp3', '.mp3', 'C:\\Music', 1, 'now', 'ok');
    insertTrack.run('track-2', 'session-1', 'C:\\Music\\two.mp3', 'two.mp3', '.mp3', 'C:\\Music', 1, 'now', 'ok');

    expect(() => updateTrackPaths([
      {
        trackId: 'track-1',
        originalPath: 'C:\\Music\\one.mp3',
        targetPath: 'C:\\Music\\ONE.mp3',
      },
      {
        trackId: 'track-2',
        originalPath: 'C:\\Music\\stale.mp3',
        targetPath: 'C:\\Music\\TWO.mp3',
      },
    ])).toThrow(/track-2/);

    const row = db.prepare('SELECT path FROM tracks WHERE id=?').get('track-1') as { path: string };
    expect(row.path).toBe('C:\\Music\\one.mp3');
  });
});
