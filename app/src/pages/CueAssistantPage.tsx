import React, { useCallback, useEffect } from 'react';
import { useAppStore, useDataStore, useToastStore } from '../store';

export function CueAssistantPage() {
  const setPage = useAppStore((s) => s.setPage);
  const setSelectedTrackId = useAppStore((s) => s.setSelectedTrackId);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const { tracks, setTracks } = useDataStore();
  const addToast = useToastStore((s) => s.addToast);

  const loadTracks = useCallback(() => {
    if (!activeSessionId) return;
    window.gigready.getTracks(activeSessionId).then(setTracks).catch(() => {});
  }, [activeSessionId, setTracks]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const tracksWithCues = tracks.filter((track) => (track.suggestedCues?.length || track.approvedCues?.length) > 0);

  const handleApproveSessionAll = async () => {
    if (!activeSessionId) return;
    try {
      await window.gigready.approveAllSessionCues(activeSessionId);
      addToast({ type: 'success', message: 'Todos los cues de la sesion han sido aprobados.' });
      loadTracks();
    } catch {
      addToast({ type: 'error', message: 'No se pudieron aprobar los cues.' });
    }
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const formatConfidence = (value?: number) => value === undefined ? '-' : `${Math.round(value * 100)}%`;
  const snapLabel = (value?: string) => {
    if (value === 'phrase') return 'Frase';
    if (value === 'downbeat') return 'Compas';
    if (value === 'beat') return 'Beat';
    if (value === 'unsnapped') return 'Libre';
    return '-';
  };

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-col">
          <h2>Asistente de Cues</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Revisa y aprueba los marcadores sugeridos antes de exportar a Rekordbox.
          </p>
        </div>
        <div className="flex gap-2">
          {tracksWithCues.length > 0 && (
            <button className="btn btn-secondary" onClick={handleApproveSessionAll}>Aprobar todos los tracks</button>
          )}
          <button className="btn btn-ghost" onClick={() => setPage('dashboard')}>Volver</button>
        </div>
      </div>

      {tracksWithCues.length === 0 ? (
        <div className="empty-state">
          <h3>Sin cues sugeridos</h3>
          <p>Ejecuta un escaneo para ver sugerencias.</p>
        </div>
      ) : (
        <>
          <section className="card mb-4" style={{ borderLeft: '3px solid var(--color-info)' }}>
            <div className="grid-3">
              <CriteriaItem title="Cues sugeridos" text="Se ubican usando inicio, frases, cambios de energia y secciones detectadas." />
              <CriteriaItem title="Confianza" text="Resume que tan clara fue la estructura encontrada para ese track." />
              <CriteriaItem title="Ajuste" text="Indica si el marcador calzo con frase, compas, beat o quedo libre." />
            </div>
          </section>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Track</th>
                  <th>Intro</th>
                  <th>Mix In</th>
                  <th>Break</th>
                  <th>Drop</th>
                  <th>Mix Out</th>
                  <th>Confianza</th>
                  <th>Ajuste</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tracksWithCues.map((track) => {
                const allCues = [...track.suggestedCues, ...track.approvedCues];
                const getCue = (type: string) => allCues.find((cue) => cue.type === type);
                const confidenceValues = allCues
                  .map((cue) => cue.confidence)
                  .filter((value): value is number => typeof value === 'number');
                const avgConfidence = confidenceValues.length
                  ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
                  : undefined;
                const primarySnap = allCues.find((cue) => cue.snapQuality === 'phrase')?.snapQuality
                  ?? allCues.find((cue) => cue.snapQuality === 'downbeat')?.snapQuality
                  ?? allCues[0]?.snapQuality;
                const allApproved = allCues.length > 0 && allCues.every((cue) => cue.status === 'approved');
                const openDetail = () => {
                  setSelectedTrackId(track.id);
                  setPage('track-detail');
                };
                return (
                  <tr key={track.id} style={{ cursor: 'pointer' }} onDoubleClick={openDetail}>
                    <td className="truncate" style={{ maxWidth: '220px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'flex-start', maxWidth: '100%', paddingLeft: 0 }}
                        onClick={openDetail}
                      >
                        <span className="truncate">
                          {track.artist ? `${track.artist} - ${track.title || track.filename}` : track.filename}
                        </span>
                      </button>
                    </td>
                    <td className="text-sm font-mono">{getCue('INTRO') ? formatTime(getCue('INTRO')!.timeSeconds) : '-'}</td>
                    <td className="text-sm font-mono">{getCue('MIX_IN') ? formatTime(getCue('MIX_IN')!.timeSeconds) : '-'}</td>
                    <td className="text-sm font-mono">{getCue('BREAK') ? formatTime(getCue('BREAK')!.timeSeconds) : '-'}</td>
                    <td className="text-sm font-mono">{getCue('DROP') ? formatTime(getCue('DROP')!.timeSeconds) : '-'}</td>
                    <td className="text-sm font-mono">{getCue('MIX_OUT') ? formatTime(getCue('MIX_OUT')!.timeSeconds) : '-'}</td>
                    <td className="text-sm">{formatConfidence(avgConfidence)}</td>
                    <td className="text-sm">{snapLabel(primarySnap)}</td>
                    <td>
                      <span className={`badge ${allApproved ? 'badge-ok' : 'badge-info'}`}>
                        {allApproved ? 'Aprobado' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={openDetail}
                      >
                        Revisar cues
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function CriteriaItem({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 style={{ marginBottom: 'var(--space-1)' }}>{title}</h4>
      <p className="text-sm">{text}</p>
    </div>
  );
}
