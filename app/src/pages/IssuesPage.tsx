import React, { useEffect, useState } from 'react';
import { useAppStore, useDataStore, useToastStore } from '../store';
import type { Severity, TrackIssue } from '../types';

const severityLabels: Record<Severity, string> = {
  critical: 'Criticos',
  warning: 'Advertencias',
  info: 'Informativos',
};

const metadataIssueTypes = new Set(['no_artist', 'no_title', 'no_genre', 'no_artwork', 'no_bpm', 'no_key']);

export function IssuesPage() {
  const setPage = useAppStore((s) => s.setPage);
  const setSelectedTrackId = useAppStore((s) => s.setSelectedTrackId);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const { tracks, setTracks } = useDataStore();
  const addToast = useToastStore((s) => s.addToast);
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  useEffect(() => {
    if (!activeSessionId) return;
    window.gigready.getTracks(activeSessionId).then(setTracks).catch(() => {
      addToast({ type: 'error', message: 'No se pudieron cargar los tracks.' });
    });
  }, [activeSessionId, addToast, setTracks]);

  const tracksWithIssues = tracks.filter((track) => track.issues && track.issues.length > 0);
  const filtered = filter === 'all'
    ? tracksWithIssues
    : tracksWithIssues.filter((track) => track.issues.some((issue) => issue.severity === filter));

  const openTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
    setPage('track-detail');
  };

  const severityBadge = (severity: Severity) => (
    <span className={`badge badge-${severity}`}>
      {severity === 'critical' ? 'Critico' : severity === 'warning' ? 'Advertencia' : 'Informativo'}
    </span>
  );

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Problemas encontrados</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Los datos de metadata faltante se agrupan para que puedas concentrarte en lo importante.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => setPage('dashboard')}>Dashboard</button>
      </div>

      <div className="tabs mb-4">
        {(['all', 'critical', 'warning', 'info'] as const).map((nextFilter) => (
          <button key={nextFilter} className={`tab ${filter === nextFilter ? 'active' : ''}`} onClick={() => setFilter(nextFilter)}>
            {nextFilter === 'all' ? 'Todos' : severityLabels[nextFilter]}
            {nextFilter !== 'all' && ` (${tracksWithIssues.filter((track) => track.issues.some((issue) => issue.severity === nextFilter)).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>Sin problemas</h3>
          <p>No se encontraron problemas con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Carpeta</th>
                <th>Problemas</th>
                <th>Riesgo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((track) => (
                <tr key={track.id}>
                  <td className="truncate" style={{ maxWidth: '250px' }}>{track.filename}</td>
                  <td className="truncate text-sm" style={{ maxWidth: '200px', color: 'var(--color-text-tertiary)' }}>{track.directory}</td>
                  <td>
                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      {summarizeIssues(track.issues).map((issue) => (
                        <span key={issue.id} className={`badge badge-${issue.severity}`} title={issue.message}>
                          {issue.message.length > 40 ? `${issue.message.slice(0, 40)}...` : issue.message}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{severityBadge(track.riskLevel === 'ok' ? 'info' : track.riskLevel as Severity)}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openTrack(track.id)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function summarizeIssues(issues: TrackIssue[]): TrackIssue[] {
  const metadataIssues = issues.filter((issue) => issue.severity === 'info' && metadataIssueTypes.has(issue.type));
  if (metadataIssues.length === 0) return issues;

  const otherIssues = issues.filter((issue) => !metadataIssues.includes(issue));
  return [
    ...otherIssues,
    {
      id: 'metadata-summary',
      trackId: metadataIssues[0].trackId,
      type: 'metadata_summary',
      severity: 'info',
      message: `Metadata incompleta (${metadataIssues.length})`,
      canAutoFix: false,
    },
  ];
}
