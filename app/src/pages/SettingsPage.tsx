import React from 'react';
import { useScanStore, useToastStore } from '../store';

export function SettingsPage() {
  const { scanSettings, updateSettings, resetSettings } = useScanStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleSave = async () => {
    try {
      await window.gigready.saveSettings(scanSettings);
      addToast({ type: 'success', message: 'Configuracion guardada.' });
    } catch {
      addToast({ type: 'error', message: 'No se pudo guardar la configuracion.' });
    }
  };

  const handleReset = () => {
    resetSettings();
    addToast({ type: 'info', message: 'Configuracion restablecida.' });
  };

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <h2>Configuracion</h2>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={handleReset}>Restablecer</button>
          <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
        </div>
      </div>

      <div style={{ maxWidth: '720px' }}>
        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Reglas</h3>
          <div className="form-group">
            <label className="label">Bitrate minimo para MP3</label>
            <input className="input" type="number" value={scanSettings.minMp3Bitrate}
              onChange={(event) => updateSettings({ minMp3Bitrate: Number(event.target.value) })} />
          </div>
          <div className="form-group">
            <label className="label">Duracion minima</label>
            <input className="input" type="number" value={scanSettings.minDurationSeconds}
              onChange={(event) => updateSettings({ minDurationSeconds: Number(event.target.value) })} />
          </div>
          <div className="form-group">
            <label className="label">Longitud maxima de ruta</label>
            <input className="input" type="number" value={scanSettings.maxPathLength}
              onChange={(event) => updateSettings({ maxPathLength: Number(event.target.value) })} />
          </div>
          <div className="form-group">
            <label className="label">Caracteres a evitar</label>
            <input className="input font-mono" type="text" value={scanSettings.problematicChars}
              onChange={(event) => updateSettings({ problematicChars: event.target.value })} />
          </div>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Rendimiento</h3>
          <div className="form-group">
            <label className="label">Archivos revisados en paralelo</label>
            <input className="input" type="number" min={1} max={16} value={scanSettings.concurrency}
              onChange={(event) => updateSettings({ concurrency: Math.min(16, Math.max(1, Number(event.target.value))) })} />
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
              Un valor mayor puede acelerar el escaneo, con mas uso de recursos. Recomendado: 4.
            </p>
          </div>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Analisis</h3>
          <div className="form-group">
            <label className="label">Motor de analisis</label>
            <select
              className="input"
              value={scanSettings.analysisEngine}
              onChange={(event) => updateSettings({ analysisEngine: event.target.value as typeof scanSettings.analysisEngine })}
            >
              <option value="standard">Estandar</option>
            </select>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
              El analisis incluido revisa estructura, energia y cues sugeridos de forma local.
            </p>
          </div>

          <div className="grid-2 gap-4">
            <div className="form-group">
              <label className="label">Analisis avanzado en paralelo</label>
              <input
                className="input"
                type="number"
                min={1}
                max={4}
                value={scanSettings.advancedAnalysisConcurrency}
                onChange={(event) => updateSettings({ advancedAnalysisConcurrency: Math.min(4, Math.max(1, Number(event.target.value))) })}
              />
            </div>
            <div className="form-group">
              <label className="label">Confianza minima de cues</label>
              <input
                className="input"
                type="number"
                min={0.1}
                max={0.95}
                step={0.05}
                value={scanSettings.minCueConfidence}
                onChange={(event) => updateSettings({ minCueConfidence: Math.min(0.95, Math.max(0.1, Number(event.target.value))) })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Perfil de energia</label>
            <select
              className="input"
              value={scanSettings.energyRatingProfile}
              onChange={(event) => updateSettings({ energyRatingProfile: event.target.value as typeof scanSettings.energyRatingProfile })}
            >
              <option value="auto">Automatico por genero</option>
              <option value="general">General DJ</option>
              <option value="house_tech_house">House / Tech House</option>
              <option value="techno">Techno</option>
              <option value="trance_melodic">Trance / Melodic</option>
              <option value="psytrance">Psytrance</option>
              <option value="minimal">Minimal / Minimal Techno</option>
              <option value="drum_bass">Drum & Bass</option>
              <option value="reggaeton_latin">Reggaeton / Latin</option>
              <option value="hip_hop_trap">Hip Hop / Trap</option>
              <option value="downtempo_warmup">Downtempo / Warm-up</option>
            </select>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
              Define como se calculan las estrellas de energia exportables a Rekordbox.
            </p>
          </div>
        </section>

        <section className="card mb-4">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Formatos aceptados</h3>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {['.mp3', '.wav', '.aiff', '.aif', '.flac', '.m4a', '.aac', '.ogg'].map((ext) => (
              <label key={ext} className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="checkbox" className="checkbox"
                  checked={scanSettings.acceptedFormats.includes(ext)}
                  onChange={(event) => {
                    if (event.target.checked) updateSettings({ acceptedFormats: [...scanSettings.acceptedFormats, ext] });
                    else updateSettings({ acceptedFormats: scanSettings.acceptedFormats.filter((format) => format !== ext) });
                  }} />
                <span className="font-mono" style={{ fontSize: 'var(--font-size-sm)' }}>{ext}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
