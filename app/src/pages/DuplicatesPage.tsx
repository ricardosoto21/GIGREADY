import React, { useEffect, useState } from 'react';
import { useAppStore, useToastStore } from '../store';

interface DuplicateGroup {
  groupId: string;
  type: 'exact' | 'probable';
  tracks: any[];
}

export function DuplicatesPage() {
  const setPage = useAppStore((s) => s.setPage);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const addToast = useToastStore((s) => s.addToast);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [filter, setFilter] = useState<'all' | 'exact' | 'probable'>('all');

  useEffect(() => {
    if (!activeSessionId) return;
    window.gigready.getDuplicates(activeSessionId).then(setGroups).catch(() => {
      addToast({ type: 'error', message: 'No se pudieron cargar los duplicados.' });
    });
  }, [activeSessionId, addToast]);

  const filtered = filter === 'all' ? groups : groups.filter((g) => g.type === filter);

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <h2>Duplicados</h2>
        <button className="btn btn-ghost" onClick={() => setPage('dashboard')}>Dashboard</button>
      </div>

      <div className="tabs mb-4">
        {(['all', 'exact', 'probable'] as const).map((f) => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todos' : f === 'exact' ? 'Exactos' : 'Probables'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>Sin duplicados</h3>
          <p>No se detectaron archivos duplicados con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {filtered.map((group) => (
            <div key={group.groupId} className="card">
              <div className="flex justify-between items-center mb-4">
                <span className={`badge ${group.type === 'exact' ? 'badge-warning' : 'badge-info'}`}>
                  {group.type === 'exact' ? 'Duplicado exacto' : 'Duplicado probable'}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {group.tracks?.length || 0} archivos
                </span>
              </div>
              {group.tracks && group.tracks.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Archivo</th><th>Bitrate</th><th>Duración</th><th>Tamaño</th><th>Modificado</th></tr>
                    </thead>
                    <tbody>
                      {group.tracks.map((t: any, i: number) => (
                        <tr key={i}>
                          <td className="truncate" style={{ maxWidth: '300px' }}>{t.filename || t.path}</td>
                          <td>{t.bitrate ? `${t.bitrate} kbps` : '-'}</td>
                          <td>{t.duration ? `${Math.floor(t.duration / 60)}:${String(Math.floor(t.duration % 60)).padStart(2, '0')}` : '-'}</td>
                          <td>{t.fileSize ? `${(t.fileSize / (1024 * 1024)).toFixed(1)} MB` : '-'}</td>
                          <td className="text-sm">{t.modifiedAt ? new Date(t.modifiedAt).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
