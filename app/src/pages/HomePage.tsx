import React from 'react';
import { useAppStore } from '../store';

export function HomePage() {
  const setPage = useAppStore((s) => s.setPage);

  return (
    <div className="app-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', maxWidth: '620px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)', letterSpacing: 0 }}>
          GigReady
        </h1>
        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>
          Revisa tu música antes de tocar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}>
          <button className="btn btn-primary btn-lg" style={{ width: '280px' }} onClick={() => setPage('folder-select')}>
            Escanear carpeta
          </button>
          <button className="btn btn-secondary btn-lg" style={{ width: '280px' }} onClick={() => setPage('folder-select')}>
            Escanear USB
          </button>
          <button className="btn btn-ghost btn-lg" style={{ width: '280px' }} onClick={() => setPage('history')}>
            Ver historial
          </button>
        </div>

        <div style={{ marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
            Selecciona una carpeta o unidad para iniciar la revisión.
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
            No se modificarán archivos durante el escaneo.
          </p>
        </div>
      </div>
    </div>
  );
}
