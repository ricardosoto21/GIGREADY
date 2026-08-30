import React, { useState } from 'react';
import { useAppStore, useScanStore, useToastStore } from '../store';
import type { CompatibilityProfile, EnergyRatingProfile } from '../types';

const ENERGY_PROFILES: Array<{ id: EnergyRatingProfile; label: string }> = [
  { id: 'auto', label: 'Automatico por genero' },
  { id: 'general', label: 'General DJ' },
  { id: 'house_tech_house', label: 'House / Tech House' },
  { id: 'techno', label: 'Techno' },
  { id: 'trance_melodic', label: 'Trance / Melodic' },
  { id: 'psytrance', label: 'Psytrance' },
  { id: 'minimal', label: 'Minimal / Minimal Techno' },
  { id: 'drum_bass', label: 'Drum & Bass' },
  { id: 'reggaeton_latin', label: 'Reggaeton / Latin' },
  { id: 'hip_hop_trap', label: 'Hip Hop / Trap' },
  { id: 'downtempo_warmup', label: 'Downtempo / Warm-up' },
];

const COMPATIBILITY_PROFILES: Array<{ id: CompatibilityProfile; label: string; desc: string }> = [
  { id: 'general', label: 'General DJ', desc: 'Revision amplia para librerias y carpetas de trabajo.' },
  { id: 'rekordbox_cdj', label: 'Rekordbox / CDJ', desc: 'Revision orientada a Rekordbox, CDJ y XDJ.' },
];

export function FolderSelectPage() {
  const setPage = useAppStore((s) => s.setPage);
  const { scanPath, setScanPath, scanSettings, updateSettings } = useScanStore();
  const addToast = useToastStore((s) => s.addToast);
  const [diskInfo, setDiskInfo] = useState<{ free: number; total: number } | null>(null);

  const selectedCompatibility: CompatibilityProfile =
    scanSettings.compatibilityProfile === 'rekordbox_cdj' ? 'rekordbox_cdj' : 'general';

  const handleSelectFolder = async () => {
    try {
      const path = await window.gigready.selectFolder();
      if (path) {
        setScanPath(path);
        try {
          const space = await window.gigready.getDiskSpace(path);
          if (space && !space.error) {
            setDiskInfo({ free: space.free, total: space.total });
          }
        } catch {
          setDiskInfo(null);
        }
      }
    } catch {
      addToast({ type: 'error', message: 'No se pudo seleccionar la carpeta.' });
    }
  };

  const handleStartScan = () => {
    if (!scanPath) {
      addToast({ type: 'warning', message: 'Selecciona una carpeta antes de iniciar.' });
      return;
    }

    updateSettings({
      mode: 'complete',
      includeSubfolders: true,
      calculateHashes: true,
      validateWithFfprobe: true,
      analyzeCues: true,
      compatibilityProfile: selectedCompatibility,
    });
    setPage('scanning');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="app-content">
      <div className="app-header" style={{ background: 'transparent', border: 'none', paddingLeft: 0 }}>
        <h2>Seleccionar carpeta</h2>
      </div>

      <div style={{ maxWidth: '840px' }}>
        <section className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-header">
            <span className="card-title">Ubicacion</span>
          </div>
          <div className="flex gap-3 items-center">
            <input
              className="input"
              type="text"
              value={scanPath || ''}
              readOnly
              placeholder="Selecciona una carpeta o unidad"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleSelectFolder}>
              Seleccionar
            </button>
          </div>
          {scanPath && (
            <div className="flex-col gap-2 mt-4" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              <span className="selectable">{scanPath}</span>
              {diskInfo && (
                <span>{formatBytes(diskInfo.free)} disponibles de {formatBytes(diskInfo.total)}</span>
              )}
            </div>
          )}
        </section>

        <section className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-header">
            <span className="card-title">Genero para energia</span>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Criterio de estrellas</label>
            <select
              className="input"
              value={scanSettings.energyRatingProfile}
              onChange={(event) => updateSettings({ energyRatingProfile: event.target.value as EnergyRatingProfile })}
            >
              {ENERGY_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>
              Este criterio se aplicara a todos los tracks de la carpeta durante el calculo de estrellas.
            </p>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <span className="card-title">Perfil de compatibilidad</span>
          </div>
          <div className="grid-2">
            {COMPATIBILITY_PROFILES.map(({ id, label, desc }) => (
              <button
                key={id}
                className={`option-panel ${selectedCompatibility === id ? 'selected' : ''}`}
                onClick={() => updateSettings({ compatibilityProfile: id })}
              >
                <h4>{label}</h4>
                <p>{desc}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="flex gap-3 justify-between">
          <button className="btn btn-ghost" onClick={() => setPage('home')}>
            Volver
          </button>
          <button className="btn btn-primary btn-lg" onClick={handleStartScan} disabled={!scanPath}>
            Iniciar escaneo
          </button>
        </div>

        <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
          No se modificaran archivos durante el escaneo. Se revisara la carpeta completa.
        </p>
      </div>
    </div>
  );
}
