import React, { useState } from 'react';
import type { SuggestedCue, CueType } from '../types';

interface CueEditorProps {
  cue: SuggestedCue;
  onSave: (cue: SuggestedCue) => void;
  onDiscard: (cueId: string) => void;
  onCancel: () => void;
}

const CUE_TYPES: CueType[] = [
  'INTRO', 'FIRST_BEAT', 'MIX_IN', 'GROOVE_START', 'BASS_IN', 'BREAK', 'BUILD_UP', 'DROP', 'MIX_OUT', 'OUTRO'
];

export function CueEditor({ cue, onSave, onDiscard, onCancel }: CueEditorProps) {
  const [label, setLabel] = useState(cue.label);
  const [time, setTime] = useState(cue.timeSeconds.toString());
  const [type, setType] = useState<CueType>(cue.type);

  const handleSave = () => {
    const timeVal = parseFloat(time);
    if (isNaN(timeVal)) return;
    
    onSave({
      ...cue,
      label,
      timeSeconds: timeVal,
      type,
      status: 'approved'
    });
  };

  return (
    <div className="card" style={{ border: '1px solid var(--color-surface-border)', background: 'var(--color-bg-secondary)', boxShadow: 'none' }}>
      <div className="flex justify-between items-center mb-4">
        <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Editar marcador</span>
        <button className="btn btn-ghost btn-sm" onClick={() => onDiscard(cue.id)} style={{ color: 'var(--color-critical)' }}>Descartar</button>
      </div>

      <div className="grid-2 gap-4">
        <div className="form-group">
          <label className="label">Tipo</label>
          <select 
            className="input" 
            value={type} 
            onChange={(e) => setType(e.target.value as CueType)}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            {CUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label">Tiempo (s)</label>
          <input 
            className="input font-mono" 
            type="number" 
            step="0.001" 
            value={time} 
            onChange={(e) => setTime(e.target.value)}
            style={{ fontSize: 'var(--font-size-sm)' }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Etiqueta</label>
        <input 
          className="input" 
          value={label} 
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nombre del marcador"
          style={{ fontSize: 'var(--font-size-sm)' }}
        />
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>Guardar y Aprobar</button>
      </div>
    </div>
  );
}
