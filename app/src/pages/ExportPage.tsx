import React, { useState } from 'react';
import { useAppStore, useToastStore } from '../store';

export function ExportPage() {
  const setPage = useAppStore((s) => s.setPage);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const addToast = useToastStore((s) => s.addToast);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportedXmlPath, setExportedXmlPath] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    if (!activeSessionId) {
      addToast({ type: 'warning', message: 'Realiza un escaneo antes de exportar.' });
      return;
    }
    setExporting(type);
    try {
      let result = '';
      switch (type) {
        case 'm3u': result = await window.gigready.exportM3U(activeSessionId); break;
        case 'xml': result = await window.gigready.exportRekordboxXML(activeSessionId); break;
      }
      if (!result) {
        addToast({ type: 'info', message: 'Exportacion cancelada.' });
      } else {
        addToast({ type: 'success', message: 'Exportacion completada.' });
        if (type === 'xml') setExportedXmlPath(result);
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'No se pudo completar la exportacion.' });
    }
    setExporting(null);
  };

  const exports = [
    { id: 'm3u', label: 'Playlist M3U', desc: 'Playlist con archivos validos.' },
    { id: 'xml', label: 'Rekordbox XML', desc: 'Archivo para importar tracks, cues aprobados y estrellas.' },
  ];

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <h2>Exportar</h2>
        <button className="btn btn-ghost" onClick={() => setPage('dashboard')}>Dashboard</button>
      </div>

      <div className="grid-2 gap-4 mb-6">
        {exports.map((exp) => (
          <div key={exp.id} className="card">
            <div className="flex justify-between items-center">
              <div>
                <h4>{exp.label}</h4>
                <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>{exp.desc}</p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                disabled={exporting !== null || !activeSessionId}
                onClick={() => handleExport(exp.id)}
              >
                {exporting === exp.id ? 'Exportando...' : 'Exportar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="flex justify-between items-center">
          <div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Preparar carpeta limpia</h3>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>
              Copia archivos validos, revisa nombres y prepara archivos para Rekordbox en una carpeta nueva.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setPage('clean-folder')}>
            Abrir preparacion
          </button>
        </div>
      </section>

      <section className="card mt-4" style={{ borderLeft: '3px solid var(--color-info)' }}>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          En Rekordbox, importa primero los tracks desde la fuente rekordbox xml y despues la playlist. Revisa la importacion antes de exportar tu USB.
        </p>
      </section>

      {exportedXmlPath && (
        <section className="card mt-4" style={{ borderLeft: '3px solid var(--color-ok)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Siguiente paso en Rekordbox</h3>
              <p className="text-sm selectable">{exportedXmlPath}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => window.gigready.openPath(exportedXmlPath)}>
                Abrir ubicacion
              </button>
              <button className="btn btn-primary" onClick={() => setPage('help')}>
                Ver guia
              </button>
            </div>
          </div>
          <ol style={{ paddingLeft: 'var(--space-5)', color: 'var(--color-text-secondary)', lineHeight: 1.9 }}>
            <li>Abre Rekordbox y entra a Preferencias.</li>
            <li>Ve a Avanzado, Base de datos, rekordbox xml.</li>
            <li>En Examinar, selecciona el XML generado por GigReady.</li>
            <li>En el panel lateral, abre rekordbox xml.</li>
            <li>Importa primero los tracks a la coleccion.</li>
            <li>Despues importa la playlist de GigReady.</li>
            <li>Revisa estrellas y memory cues antes de exportar el USB.</li>
          </ol>
        </section>
      )}
    </div>
  );
}
