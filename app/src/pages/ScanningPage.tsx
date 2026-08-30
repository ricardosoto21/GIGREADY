import React, { useEffect } from 'react';
import { useAppStore, useScanStore, useToastStore } from '../store';

export function ScanningPage() {
  const setPage = useAppStore((s) => s.setPage);
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId);
  const { scanPath, scanSettings, progress, setProgress, setScanning } = useScanStore();
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (!scanPath) {
      setPage('folder-select');
      return;
    }

    let cancelled = false;
    let currentSessionId: string | null = null;
    let unsubProgress = () => {};
    let unsubComplete = () => {};
    let unsubError = () => {};
    const cleanupListeners = () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
    setScanning(true);

    unsubProgress = window.gigready.onScanProgress((nextProgress) => {
      if (!cancelled && (!currentSessionId || nextProgress.sessionId === currentSessionId)) {
        setProgress(nextProgress);
      }
    });

    unsubComplete = window.gigready.onScanComplete((result) => {
      if (cancelled || (currentSessionId && result.sessionId !== currentSessionId)) return;
      setScanning(false);
      setProgress(null);
      addToast({ type: 'success', message: 'El escaneo finalizo correctamente.' });
      cleanupListeners();
      setPage('dashboard');
    });

    unsubError = window.gigready.onScanError((error) => {
      if (cancelled || (currentSessionId && error?.sessionId && error.sessionId !== currentSessionId)) return;
      setScanning(false);
      addToast({ type: 'error', message: error?.message || 'Ocurrio un error durante el escaneo.' });
      cleanupListeners();
    });

    const startScan = async () => {
      try {
        const sessionId = await window.gigready.startScan(scanPath, scanSettings);
        if (cancelled) return;
        currentSessionId = sessionId;
        setActiveSessionId(sessionId);
      } catch (err: any) {
        if (!cancelled) {
          setScanning(false);
          addToast({ type: 'error', message: err?.message || 'No se pudo iniciar el escaneo.' });
          cleanupListeners();
          setPage('folder-select');
        }
      }
    };

    // Deferring one tick prevents React StrictMode's development-only effect
    // replay from starting and immediately cancelling a duplicate scan.
    const startTimer = window.setTimeout(() => void startScan(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      cleanupListeners();
    };
  }, [addToast, scanPath, scanSettings, setActiveSessionId, setPage, setProgress, setScanning]);

  const handleCancel = async () => {
    const sessionId = useAppStore.getState().activeSessionId;
    if (sessionId) {
      try {
        await window.gigready.cancelScan(sessionId);
      } catch {
        // The scan may have already completed.
      }
    }
    setScanning(false);
    setProgress(null);
    addToast({ type: 'info', message: 'El escaneo fue cancelado.' });
    setPage('folder-select');
  };

  const percent = progress ? Math.round((progress.current / Math.max(progress.total, 1)) * 100) : 0;
  const phaseLabels: Record<string, string> = {
    discovering: 'Descubriendo archivos',
    analyzing: 'Revisando tracks',
    duplicates: 'Detectando duplicados',
    cues: 'Analizando estructura',
    finalizing: 'Finalizando',
  };

  return (
    <div className="app-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto var(--space-6)' }} />

        <h2 style={{ marginBottom: 'var(--space-2)' }}>Escaneando</h2>
        <p style={{ marginBottom: 'var(--space-6)' }}>
          {progress ? phaseLabels[progress.phase] || progress.message : 'Iniciando escaneo'}
        </p>

        <div className="progress-bar" style={{ height: '8px', marginBottom: 'var(--space-3)' }}>
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>

        <div className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-6)' }}>
          <span>{progress ? `${progress.current} / ${progress.total}` : '...'}</span>
          <span>{percent}%</span>
        </div>

        {progress?.currentFile && (
          <p className="truncate font-mono" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-6)' }}>
            {progress.currentFile}
          </p>
        )}

        <button className="btn btn-ghost" onClick={handleCancel}>
          Cancelar escaneo
        </button>
      </div>
    </div>
  );
}
