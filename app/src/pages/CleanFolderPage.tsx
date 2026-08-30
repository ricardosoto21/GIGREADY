import React, { useCallback, useEffect, useState } from 'react';
import { useAppStore, useToastStore } from '../store';
import type { CleanFolderOptions, CleanFolderPreview, CleanFolderResult, RenamePreview } from '../types';

const defaultOptions: CleanFolderOptions = {
  folderName: 'GigReady Clean',
  safeRename: true,
  organization: 'preserve',
  includeWarnings: true,
  excludeExactDuplicates: true,
  includeCsv: false,
  includeHtml: false,
  includeM3u: true,
  includeRekordboxXml: false,
  includeSupportData: false,
};

export function CleanFolderPage() {
  const setPage = useAppStore((s) => s.setPage);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const addToast = useToastStore((s) => s.addToast);
  const [options, setOptions] = useState<CleanFolderOptions>(defaultOptions);
  const [preview, setPreview] = useState<CleanFolderPreview | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [result, setResult] = useState<CleanFolderResult | null>(null);
  const [renamePreview, setRenamePreview] = useState<RenamePreview[]>([]);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameApplying, setRenameApplying] = useState(false);
  const [renameConfirmed, setRenameConfirmed] = useState(false);

  const updateOptions = (partial: Partial<CleanFolderOptions>) => {
    setOptions((current) => ({ ...current, ...partial }));
  };

  const loadPreview = useCallback(async () => {
    if (!activeSessionId) return;
    setPreviewLoading(true);
    try {
      const nextPreview = await window.gigready.previewCleanFolder(activeSessionId, options);
      setPreview(nextPreview);
    } catch {
      addToast({ type: 'error', message: 'No se pudo preparar la vista previa.' });
    }
    setPreviewLoading(false);
  }, [activeSessionId, addToast, options]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const handleCreate = async () => {
    if (!activeSessionId) {
      addToast({ type: 'warning', message: 'Realiza un escaneo antes de crear una carpeta limpia.' });
      return;
    }
    setCreating(true);
    try {
      const cleanResult = await window.gigready.exportCleanFolder(activeSessionId, options);
      if (!cleanResult) {
        addToast({ type: 'info', message: 'Creacion cancelada.' });
      } else {
        setResult(cleanResult);
        addToast({ type: 'success', message: 'La carpeta limpia fue creada correctamente.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'No se pudo crear la carpeta limpia.' });
    }
    setCreating(false);
  };

  const loadRenamePreview = async () => {
    if (!activeSessionId) return;
    setRenameLoading(true);
    try {
      const nextPreview = await window.gigready.previewRename(activeSessionId);
      setRenamePreview(nextPreview);
      addToast({
        type: nextPreview.length > 0 ? 'info' : 'success',
        message: nextPreview.length > 0 ? 'Vista previa lista.' : 'No hay nombres que requieran cambios.',
      });
    } catch {
      addToast({ type: 'error', message: 'No se pudo preparar la vista previa.' });
    }
    setRenameLoading(false);
  };

  const applyRenameToOriginals = async () => {
    if (!activeSessionId || !renameConfirmed || renamePreview.length === 0) return;
    setRenameApplying(true);
    try {
      const applyResult = await window.gigready.applyRename(activeSessionId, renamePreview, true);
      addToast({ type: 'success', message: `Renombrado aplicado. Respaldo creado en ${applyResult.backupPath}.` });
      setRenamePreview([]);
      setRenameConfirmed(false);
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'No se pudo aplicar el renombrado.' });
    }
    setRenameApplying(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (!activeSessionId) {
    return (
      <div className="app-content empty-state">
        <h3>Sin escaneo activo</h3>
        <p>Realiza un escaneo antes de crear una carpeta limpia.</p>
        <button className="btn btn-primary mt-4" onClick={() => setPage('folder-select')}>Escanear carpeta</button>
      </div>
    );
  }

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <h2>Carpeta limpia</h2>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={() => setPage('dashboard')}>Dashboard</button>
          <button className="btn btn-secondary" onClick={() => setPage('export')}>Exportar</button>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <SummaryCard label="Incluidos" value={preview?.includedTracks ?? 0} />
        <SummaryCard label="Criticos excluidos" value={preview?.excludedCritical ?? 0} />
        <SummaryCard label="Duplicados excluidos" value={preview?.excludedDuplicates ?? 0} />
        <SummaryCard label="Tamano estimado" value={preview ? formatBytes(preview.totalSizeBytes) : '-'} />
      </div>

      <div className="grid-2 gap-6">
        <section className="card">
          <div className="card-header">
            <span className="card-title">Opciones</span>
          </div>

          <div className="form-group">
            <label className="label">Nombre de carpeta</label>
            <input
              className="input"
              value={options.folderName}
              onChange={(event) => updateOptions({ folderName: event.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="label">Organizacion</label>
            <select
              className="input"
              value={options.organization}
              onChange={(event) => updateOptions({ organization: event.target.value as CleanFolderOptions['organization'] })}
            >
              <option value="preserve">Mantener estructura</option>
              <option value="flat">Estructura plana</option>
              <option value="artist">Carpetas por artista</option>
              <option value="genre">Carpetas por genero</option>
            </select>
          </div>

          <div className="flex-col gap-3">
            <CheckRow label="Normalizar nombres en la copia" checked={options.safeRename} onChange={(safeRename) => updateOptions({ safeRename })} />
            <CheckRow label="Incluir tracks con advertencias" checked={options.includeWarnings} onChange={(includeWarnings) => updateOptions({ includeWarnings })} />
            <CheckRow label="Excluir duplicados exactos" checked={options.excludeExactDuplicates} onChange={(excludeExactDuplicates) => updateOptions({ excludeExactDuplicates })} />
            <CheckRow label="Incluir playlist M3U" checked={options.includeM3u} onChange={(includeM3u) => updateOptions({ includeM3u })} />
            <CheckRow label="Incluir Rekordbox XML" checked={options.includeRekordboxXml} onChange={(includeRekordboxXml) => updateOptions({ includeRekordboxXml })} />
          </div>

          <div className="flex gap-3 mt-6">
            <button className="btn btn-secondary" disabled={previewLoading} onClick={loadPreview}>
              {previewLoading ? 'Revisando...' : 'Actualizar vista previa'}
            </button>
            <button className="btn btn-primary" disabled={creating || !preview || preview.includedTracks === 0} onClick={handleCreate}>
              {creating ? 'Creando...' : 'Crear carpeta limpia'}
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="card-title">Vista previa</span>
          </div>

          {preview ? (
            <div className="flex-col gap-3">
              <PreviewLine label="Tracks revisados" value={preview.totalTracks.toString()} />
              <PreviewLine label="Tracks que se copiaran" value={preview.includedTracks.toString()} />
              <PreviewLine label="Advertencias excluidas" value={preview.excludedWarnings.toString()} />
              <PreviewLine label="Nombres ajustados" value={preview.renameCount.toString()} />
              <PreviewLine label="Tamano estimado" value={formatBytes(preview.totalSizeBytes)} />
            </div>
          ) : (
            <p>La vista previa aparecera aqui.</p>
          )}

          {preview && preview.sampleRenames.length > 0 && (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <h4 style={{ marginBottom: 'var(--space-3)' }}>Ejemplos de Safe Rename</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Antes</th><th>Despues</th></tr>
                  </thead>
                  <tbody>
                    {preview.sampleRenames.slice(0, 8).map((item) => (
                      <tr key={item.originalPath}>
                        <td className="truncate" style={{ maxWidth: '180px' }}>{item.originalName}</td>
                        <td className="truncate" style={{ maxWidth: '180px' }}>{item.newName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {result && (
        <section className="card mt-6" style={{ borderLeft: '3px solid var(--color-ok)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Carpeta creada</h3>
              <p className="selectable" style={{ fontSize: 'var(--font-size-sm)' }}>{result.outputPath}</p>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>{result.copied} archivos copiados. {result.failed} errores. {result.reports.length} archivos adicionales incluidos.</p>
            </div>
            <button className="btn btn-secondary" onClick={() => window.gigready.openPath(result.outputPath)}>
              Abrir carpeta
            </button>
          </div>
        </section>
      )}

      <section className="card mt-6" style={{ borderLeft: '3px solid var(--color-critical)' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 style={{ marginBottom: 'var(--space-1)' }}>Safe Rename sobre originales</h3>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>
              Recomendado solo cuando ya revisaste la vista previa. GigReady crea un respaldo antes de aplicar cambios.
            </p>
          </div>
          <button className="btn btn-secondary" disabled={renameLoading} onClick={loadRenamePreview}>
            {renameLoading ? 'Revisando...' : 'Vista previa'}
          </button>
        </div>

        {renamePreview.length > 0 && (
          <>
            <div className="table-container mb-4">
              <table>
                <thead>
                  <tr><th>Antes</th><th>Despues</th><th>Cambios</th></tr>
                </thead>
                <tbody>
                  {renamePreview.slice(0, 25).map((item) => (
                    <tr key={item.originalPath}>
                      <td className="truncate" style={{ maxWidth: '220px' }}>{item.originalName}</td>
                      <td className="truncate" style={{ maxWidth: '220px' }}>{item.newName}</td>
                      <td>{item.changes.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <input className="checkbox" type="checkbox" checked={renameConfirmed} onChange={(event) => setRenameConfirmed(event.target.checked)} />
              <span>Confirmo que quiero aplicar estos cambios sobre archivos originales y crear un respaldo antes.</span>
            </label>

            <button className="btn btn-primary" disabled={!renameConfirmed || renameApplying} onClick={applyRenameToOriginals}>
              {renameApplying ? 'Aplicando...' : 'Aplicar con respaldo'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <div className="card-subtitle">{label}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
      <input className="checkbox" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    </label>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
