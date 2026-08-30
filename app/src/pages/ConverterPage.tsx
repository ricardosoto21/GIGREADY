import React, { useEffect, useMemo, useState } from 'react';
import { useToastStore } from '../store';
import type {
  ConversionPlan,
  ConversionProgress,
  ConversionResult,
  ConversionSource,
  ConversionTargetFormat,
} from '../types';

const targetOptions: Array<{ value: ConversionTargetFormat; label: string; detail: string }> = [
  { value: 'mp3', label: 'MP3', detail: '320 kbps CBR' },
  { value: 'wav', label: 'WAV', detail: 'PCM sin compresion' },
  { value: 'aiff', label: 'AIFF', detail: 'PCM sin compresion' },
];

const statusLabels: Record<string, string> = {
  ready: 'Listo',
  converting: 'Convirtiendo',
  completed: 'Completado',
  failed: 'No completado',
  skipped: 'Omitido',
};

export function ConverterPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [source, setSource] = useState<ConversionSource | null>(null);
  const [targetFormat, setTargetFormat] = useState<ConversionTargetFormat>('mp3');
  const [outputDirectory, setOutputDirectory] = useState('');
  const [plan, setPlan] = useState<ConversionPlan | null>(null);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    return window.gigready.onConversionProgress((nextProgress) => {
      setProgress(nextProgress);
    });
  }, []);

  const selectedTarget = useMemo(
    () => targetOptions.find((option) => option.value === targetFormat),
    [targetFormat],
  );

  const chooseFiles = async () => {
    const paths = await window.gigready.selectConversionFiles();
    if (paths.length === 0) return;
    setSource({ type: 'files', paths });
    setPlan(null);
    setResult(null);
  };

  const chooseFolder = async () => {
    const folderPath = await window.gigready.selectConversionFolder();
    if (!folderPath) return;
    setSource({ type: 'folder', paths: [folderPath], rootPath: folderPath });
    setPlan(null);
    setResult(null);
  };

  const chooseOutput = async () => {
    const folderPath = await window.gigready.selectConversionOutputFolder();
    if (!folderPath) return;
    setOutputDirectory(folderPath);
    setPlan(null);
    setResult(null);
  };

  const preparePreview = async () => {
    if (!source || !outputDirectory) {
      addToast({ type: 'warning', message: 'Selecciona origen y carpeta destino antes de revisar.' });
      return;
    }

    setLoadingPreview(true);
    try {
      const nextPlan = await window.gigready.previewConversion(source, targetFormat, outputDirectory);
      setPlan(nextPlan);
      setResult(null);
      setProgress(null);
      addToast({
        type: nextPlan.totalFiles > 0 ? 'success' : 'info',
        message: nextPlan.totalFiles > 0 ? 'Vista previa lista.' : 'No se encontraron archivos compatibles.',
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'No se pudo preparar la vista previa.' });
    }
    setLoadingPreview(false);
  };

  const startConversion = async () => {
    if (!plan || plan.totalFiles === 0) return;
    setConverting(true);
    setResult(null);
    try {
      const conversionResult = await window.gigready.startConversion(plan);
      setResult(conversionResult);
      setPlan({ ...plan, items: conversionResult.items });
      addToast({
        type: conversionResult.cancelled ? 'info' : 'success',
        message: conversionResult.cancelled ? 'Conversion cancelada.' : 'Conversion finalizada.',
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'No se pudo completar la conversion.' });
    }
    setConverting(false);
  };

  const cancelConversion = async () => {
    if (!plan) return;
    await window.gigready.cancelConversion(plan.id);
  };

  const openOutput = () => {
    const targetPath = result?.outputDirectory || outputDirectory;
    if (targetPath) window.gigready.openPath(targetPath);
  };

  const sourceLabel = source
    ? source.type === 'folder'
      ? source.rootPath || source.paths[0]
      : `${source.paths.length} archivo${source.paths.length === 1 ? '' : 's'} seleccionado${source.paths.length === 1 ? '' : 's'}`
    : 'Sin origen seleccionado';

  const progressPercent = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Convertir</h2>
          <p>Convierte archivos de audio a formatos preparados para uso DJ.</p>
        </div>
        <button className="btn btn-secondary" disabled={!outputDirectory} onClick={openOutput}>Abrir destino</button>
      </div>

      <div className="grid-2 gap-6 mb-6">
        <section className="card">
          <div className="card-header">
            <span className="card-title">Origen</span>
          </div>
          <div className="flex gap-3 mb-4">
            <button className="btn btn-secondary" disabled={converting} onClick={chooseFiles}>Cargar archivo</button>
            <button className="btn btn-secondary" disabled={converting} onClick={chooseFolder}>Cargar carpeta</button>
          </div>
          <p className="selectable text-sm truncate">{sourceLabel}</p>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="card-title">Salida</span>
          </div>
          <div className="grid-3 mb-4">
            {targetOptions.map((option) => (
              <button
                key={option.value}
                className={`option-panel ${targetFormat === option.value ? 'selected' : ''}`}
                disabled={converting}
                onClick={() => {
                  setTargetFormat(option.value);
                  setPlan(null);
                  setResult(null);
                }}
              >
                <h4>{option.label}</h4>
                <p>{option.detail}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <button className="btn btn-secondary" disabled={converting} onClick={chooseOutput}>Elegir carpeta destino</button>
            <span className="text-sm selectable truncate" style={{ color: 'var(--color-text-tertiary)' }}>
              {outputDirectory || 'Sin destino seleccionado'}
            </span>
          </div>
        </section>
      </div>

      <section className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 style={{ marginBottom: 'var(--space-1)' }}>Vista previa</h3>
            <p className="text-sm">
              Formato de salida: {selectedTarget?.label} / {selectedTarget?.detail}. Los archivos originales no se modifican.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary" disabled={loadingPreview || converting} onClick={preparePreview}>
              {loadingPreview ? 'Revisando...' : 'Preparar vista previa'}
            </button>
            {converting ? (
              <button className="btn btn-secondary" onClick={cancelConversion}>Cancelar</button>
            ) : (
              <button className="btn btn-primary" disabled={!plan || plan.totalFiles === 0} onClick={startConversion}>
                Convertir
              </button>
            )}
          </div>
        </div>

        {progress && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-4">
              <span>{progress.message}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}
      </section>

      {result && (
        <section className="card mb-6" style={{ borderLeft: `3px solid var(--color-${result.failed > 0 ? 'warning' : 'ok'})` }}>
          <div className="flex justify-between items-center">
            <div>
              <h3 style={{ marginBottom: 'var(--space-1)' }}>Resultado</h3>
              <p className="text-sm">{result.converted} convertidos. {result.failed} no completados.</p>
            </div>
            <button className="btn btn-secondary" onClick={openOutput}>Abrir carpeta</button>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <span className="card-title">Archivos {plan ? `(${plan.totalFiles})` : ''}</span>
        </div>
        {plan && plan.items.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Origen</th>
                  <th>Duracion</th>
                  <th>Bitrate</th>
                  <th>Salida</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {plan.items.map((item) => (
                  <tr key={item.id}>
                    <td className="truncate" style={{ maxWidth: '220px' }}>{item.filename}</td>
                    <td>{item.extension.replace('.', '').toUpperCase()}</td>
                    <td className="font-mono">{formatDuration(item.duration)}</td>
                    <td>{item.bitrate ? `${item.bitrate} kbps` : '-'}</td>
                    <td className="truncate selectable" style={{ maxWidth: '320px' }}>{item.outputPath}</td>
                    <td>
                      <span className={`badge badge-${item.status === 'failed' ? 'warning' : item.status === 'completed' ? 'ok' : 'info'}`}>
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>La lista aparecera despues de preparar la vista previa.</p>
        )}
      </section>
    </div>
  );
}

function formatDuration(seconds?: number) {
  if (!seconds) return '-';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}
