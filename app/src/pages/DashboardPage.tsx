import React, { useEffect } from 'react';
import { useAppStore, useDataStore, useToastStore } from '../store';

function ScoreDisplay({ score }: { score: number }) {
  const getClass = () => {
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  };
  const getLabel = () => {
    if (score >= 90) return 'Listo';
    if (score >= 70) return 'Revision menor';
    if (score >= 50) return 'Requiere revision';
    return 'Riesgo alto';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div className={`score-badge ${getClass()}`}>{score}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>{getLabel()}</div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>Estado de preparacion</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, severity, onClick }: { label: string; value: number; severity?: string; onClick?: () => void }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : undefined,
        borderLeft: severity ? `3px solid var(--color-${severity})` : undefined,
      }}
    >
      <div className="card-subtitle">{label}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}

export function DashboardPage() {
  const setPage = useAppStore((s) => s.setPage);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const { dashboard, setDashboard, session, setSession } = useDataStore();
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (!activeSessionId) return;

    const load = async () => {
      try {
        const [dash, sess] = await Promise.all([
          window.gigready.getDashboard(activeSessionId),
          window.gigready.getSession(activeSessionId),
        ]);
        setDashboard(dash);
        setSession(sess);
      } catch {
        addToast({ type: 'error', message: 'No se pudo cargar el dashboard.' });
      }
    };
    void load();
  }, [activeSessionId, addToast, setDashboard, setSession]);

  if (!dashboard) {
    return (
      <div className="app-content empty-state">
        <h3>Sin datos</h3>
        <p>Realiza un escaneo para ver el dashboard.</p>
        <button className="btn btn-primary mt-4" onClick={() => setPage('folder-select')}>
          Escanear carpeta
        </button>
      </div>
    );
  }

  const d = dashboard;

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <h2>Dashboard</h2>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setPage('export')}>Exportar</button>
          <button className="btn btn-primary" onClick={() => setPage('folder-select')}>Nuevo escaneo</button>
        </div>
      </div>

      {session && (
        <p className="mb-4 selectable" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
          {session.rootPath} / {new Date(session.createdAt).toLocaleString()} / {((d.scanDurationMs || 0) / 1000).toFixed(1)}s
        </p>
      )}

      <div className="mb-6">
        <ScoreDisplay score={d.score} />
      </div>

      <div className="grid-4 mb-6">
        <StatCard label="Tracks analizados" value={d.totalTracks} />
        <StatCard label="Problemas criticos" value={d.criticalCount} severity="critical" onClick={() => setPage('issues')} />
        <StatCard label="Advertencias" value={d.warningCount} severity="warning" onClick={() => setPage('issues')} />
        <StatCard label="Informativos" value={d.infoCount} severity="info" onClick={() => setPage('issues')} />
      </div>

      <div className="grid-4 mb-6">
        <StatCard label="Duplicados exactos" value={d.duplicateExactCount} onClick={() => setPage('duplicates')} />
        <StatCard label="Duplicados probables" value={d.duplicateProbableCount} onClick={() => setPage('duplicates')} />
        <StatCard label="Cues sugeridos" value={d.suggestedCuesCount} onClick={() => setPage('cue-assistant')} />
        <StatCard label="Cues aprobados" value={d.approvedCuesCount} onClick={() => setPage('cue-assistant')} />
      </div>

      {d.criticalCount > 0 && (
        <div className="card" style={{ borderLeft: '3px solid var(--color-critical)', marginBottom: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>
            Se encontraron {d.criticalCount} archivo(s) con problemas criticos. Revisa estos archivos antes de preparar el USB.
          </p>
          <button className="btn btn-secondary btn-sm mt-4" onClick={() => setPage('issues')}>
            Ver problemas
          </button>
        </div>
      )}

      {d.criticalCount === 0 && d.warningCount === 0 && (
        <div className="card" style={{ borderLeft: '3px solid var(--color-ok)' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>
            El estado general es adecuado. No se encontraron problemas criticos.
          </p>
        </div>
      )}
    </div>
  );
}
