import React, { useEffect, useState } from 'react';
import { useAppStore, useToastStore } from '../store';
import type { DashboardSummary, ScanSession } from '../types';

export function HistoryPage() {
  const setPage = useAppStore((s) => s.setPage);
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId);
  const addToast = useToastStore((s) => s.addToast);
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [dashboards, setDashboards] = useState<Record<string, DashboardSummary>>({});

  useEffect(() => {
    window.gigready.getSessions()
      .then(async (nextSessions) => {
        setSessions(nextSessions);
        const entries = await Promise.all(
          nextSessions.map(async (session) => {
            try {
              return [session.id, await window.gigready.getDashboard(session.id)] as const;
            } catch {
              return [session.id, null] as const;
            }
          }),
        );
        setDashboards(Object.fromEntries(entries.filter((entry): entry is [string, DashboardSummary] => Boolean(entry[1]))));
      })
      .catch(() => {
        addToast({ type: 'error', message: 'No se pudo cargar el historial.' });
      });
  }, [addToast]);

  const handleOpen = (session: ScanSession) => {
    setActiveSessionId(session.id);
    setPage('dashboard');
  };

  const getScoreClass = (score: number) => {
    if (score >= 90) return 'badge-ok';
    if (score >= 70) return 'badge-warning';
    return 'badge-critical';
  };

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <h2>Historial de escaneos</h2>
        <button className="btn btn-primary" onClick={() => setPage('folder-select')}>Nuevo escaneo</button>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <h3>Sin historial</h3>
          <p>Los escaneos realizados apareceran aqui.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ruta</th>
                <th>Tracks</th>
                <th>Cues sugeridos</th>
                <th>Cues aprobados</th>
                <th>Criticos</th>
                <th>Advertencias</th>
                <th>Score</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const dashboard = dashboards[session.id];
                return (
                  <tr key={session.id}>
                    <td className="text-sm">{new Date(session.createdAt).toLocaleString()}</td>
                    <td className="truncate selectable" style={{ maxWidth: '240px' }}>{session.rootPath}</td>
                    <td>{session.audioFiles}</td>
                    <td>{dashboard?.suggestedCuesCount ?? 0}</td>
                    <td>{dashboard?.approvedCuesCount ?? 0}</td>
                    <td>{session.criticalCount}</td>
                    <td>{session.warningCount}</td>
                    <td><span className={`badge ${getScoreClass(session.score)}`}>{session.score}</span></td>
                    <td><span className={`badge ${session.status === 'completed' ? 'badge-ok' : 'badge-info'}`}>{session.status === 'completed' ? 'Completado' : session.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(session)}>Abrir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
