import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore, useToastStore } from '../store';
import type { AnalysisStatus, CueStatus, Severity, Track, SuggestedCue, EnergyData, MusicalAnalysis } from '../types';
import { CueEditor } from '../components/CueEditor';
import { Waveform } from '../components/Waveform';
import { v4 as uuidv4 } from 'uuid';

const statusLabels: Record<AnalysisStatus, string> = {
  pending: 'Pendiente',
  processing: 'En revision',
  completed: 'Completado',
  failed: 'No completado',
  skipped: 'Omitido',
};

const severityLabels: Record<Severity, string> = {
  critical: 'Critico',
  warning: 'Advertencia',
  info: 'Informativo',
};

const cueStatusLabels: Record<CueStatus, string> = {
  suggested: 'Sugerido',
  approved: 'Aprobado',
  edited: 'Editado',
  discarded: 'Descartado',
};

const snapLabels: Record<string, string> = {
  phrase: 'Frase',
  downbeat: 'Compas',
  beat: 'Beat',
  unsnapped: 'Libre',
};

export function TrackDetailPage() {
  const setPage = useAppStore((s) => s.setPage);
  const trackId = useAppStore((s) => s.selectedTrackId);
  const setSelectedTrackId = useAppStore((s) => s.setSelectedTrackId);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const addToast = useToastStore((s) => s.addToast);
  const [track, setTrack] = useState<Track | null>(null);
  const [cueTracks, setCueTracks] = useState<Track[]>([]);
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [musicalAnalysis, setMusicalAnalysis] = useState<MusicalAnalysis | null>(null);
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackOffset, setPlaybackOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopCuePreview, setLoopCuePreview] = useState(false);
  const [directPlaybackFailed, setDirectPlaybackFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadTrack = useCallback(() => {
    if (!trackId) return;
    window.gigready.getTrack(trackId).then((nextTrack) => {
      setTrack(nextTrack);
      if (nextTrack) {
        window.gigready.getEnergyData(nextTrack.id).then(setEnergyData).catch(() => {});
        window.gigready.getMusicalAnalysis(nextTrack.id).then(setMusicalAnalysis).catch(() => setMusicalAnalysis(null));
        window.gigready.getPlaybackUrl(nextTrack.id)
          .then((url) => {
            setPlaybackUrl(url);
            setDirectPlaybackFailed(false);
          })
          .catch(() => setPlaybackUrl(null));
      }
    }).catch(() => {
      addToast({ type: 'error', message: 'No se pudo cargar el detalle del track.' });
    });
  }, [addToast, trackId]);

  const loadCueTracks = useCallback(() => {
    if (!activeSessionId) return;
    window.gigready.getTracks(activeSessionId)
      .then((sessionTracks) => {
        setCueTracks(sessionTracks.filter((item) => (item.suggestedCues?.length || item.approvedCues?.length) > 0));
      })
      .catch(() => {});
  }, [activeSessionId]);

  useEffect(() => {
    loadTrack();
    loadCueTracks();
  }, [loadCueTracks, loadTrack]);

  const handleApproveCue = async (cueId: string) => {
    try {
      await window.gigready.approveCue(cueId);
      addToast({ type: 'success', message: 'Cue aprobado.' });
      loadTrack();
      loadCueTracks();
    } catch {
      addToast({ type: 'error', message: 'No se pudo aprobar el cue.' });
    }
  };

  const handleDiscardCue = async (cueId: string) => {
    try {
      await window.gigready.discardCue(cueId);
      addToast({ type: 'success', message: 'Cue descartado.' });
      setEditingCueId(null);
      loadTrack();
      loadCueTracks();
    } catch {
      addToast({ type: 'error', message: 'No se pudo descartar el cue.' });
    }
  };

  const handleUpdateCue = async (cue: SuggestedCue) => {
    try {
      await window.gigready.updateCue(cue);
      addToast({ type: 'success', message: cue.status === 'approved' ? 'Cue guardado.' : 'Cue actualizado.' });
      setEditingCueId(null);
      loadTrack();
      loadCueTracks();
    } catch {
      addToast({ type: 'error', message: 'No se pudo actualizar el cue.' });
    }
  };

  const handleMoveCue = async (cue: SuggestedCue, timeSeconds: number) => {
    await handleUpdateCue({
      ...cue,
      timeSeconds,
      status: 'edited',
      source: 'manual',
      snapQuality: 'unsnapped',
      reason: 'Ajustado manualmente',
    });
    setSelectedCueId(cue.id);
  };

  const handleAddCue = (time?: number) => {
    if (!track) return;
    const newCue: SuggestedCue = {
      id: uuidv4(),
      trackId: track.id,
      type: 'MIX_IN',
      timeSeconds: time || 0,
      label: 'Nuevo marcador',
      source: 'manual',
      status: 'suggested',
      color: '#111111',
    };
    setTrack({
      ...track,
      suggestedCues: [...track.suggestedCues, newCue],
    });
    setEditingCueId(newCue.id);
    setSelectedCueId(newCue.id);
  };

  const currentCueIndex = trackId ? cueTracks.findIndex((item) => item.id === trackId) : -1;
  const previousTrack = currentCueIndex > 0 ? cueTracks[currentCueIndex - 1] : null;
  const nextTrack = currentCueIndex >= 0 && currentCueIndex < cueTracks.length - 1 ? cueTracks[currentCueIndex + 1] : null;

  const navigateToTrack = (nextTrackId: string) => {
    setEditingCueId(null);
    setSelectedCueId(null);
    setPlaybackTime(0);
    setIsPlaying(false);
    audioRef.current?.pause();
    setSelectedTrackId(nextTrackId);
  };

  if (!track) {
    return (
      <div className="app-content empty-state">
        <h3>Sin track seleccionado</h3>
        <button className="btn btn-ghost mt-4" onClick={() => setPage('issues')}>Volver</button>
      </div>
    );
  }

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '-';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };
  const formatConfidence = (value?: number) => value === undefined ? '-' : `${Math.round(value * 100)}%`;
  const allCues = [...track.suggestedCues, ...track.approvedCues].sort((a, b) => a.timeSeconds - b.timeSeconds);
  const selectedCue = allCues.find((cue) => cue.id === selectedCueId) || null;

  const playSourceAt = async (url: string, timeSeconds: number, offsetSeconds = 0) => {
    const audio = audioRef.current;
    if (!audio) return;

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onReady);
        audio.removeEventListener('canplay', onReady);
        audio.removeEventListener('error', onError);
      };
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('No se pudo reproducir el archivo.'));
      };

      audio.addEventListener('loadedmetadata', onReady);
      audio.addEventListener('canplay', onReady);
      audio.addEventListener('error', onError);
      audio.src = url;
      audio.load();
    });

    if (Number.isFinite(timeSeconds)) {
      audio.currentTime = Math.max(0, timeSeconds);
    }
    setPlaybackOffset(offsetSeconds);
    await audio.play();
    setIsPlaying(true);
  };

  const playFromTime = async (timeSeconds: number) => {
    if (!track) return;
    try {
      if (!playbackUrl || directPlaybackFailed) throw new Error('Se requiere vista previa compatible.');
      await playSourceAt(playbackUrl, timeSeconds, 0);
    } catch {
      try {
        const clipUrl = await window.gigready.createPreviewClip(track.id, timeSeconds, 18);
        await playSourceAt(clipUrl, 0, Math.max(0, timeSeconds - 4));
        setDirectPlaybackFailed(true);
      } catch {
        addToast({ type: 'error', message: 'No se pudo preparar la vista previa de audio.' });
      }
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    await playFromTime(playbackTime || selectedCue?.timeSeconds || 0);
  };

  const playSelectedCue = async () => {
    if (!selectedCue) return;
    await playFromTime(selectedCue.timeSeconds);
  };

  const playCue = async (cue: SuggestedCue) => {
    setSelectedCueId(cue.id);
    await playFromTime(cue.timeSeconds);
  };

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const absoluteTime = playbackOffset + audio.currentTime;
    setPlaybackTime(absoluteTime);

    if (loopCuePreview && selectedCue) {
      const loopStart = Math.max(0, selectedCue.timeSeconds - 4);
      const loopEnd = selectedCue.timeSeconds + 12;
      if (absoluteTime > loopEnd) {
        audio.currentTime = Math.max(0, loopStart - playbackOffset);
      }
    }
  };

  const info = [
    ['Archivo', track.filename],
    ['Ruta', track.path],
    ['Formato', `${track.extension} / ${track.codec || '-'}`],
    ['Duracion', formatDuration(track.duration)],
    ['Bitrate', track.bitrate ? `${track.bitrate} kbps` : '-'],
    ['Frecuencia', track.sampleRate ? `${track.sampleRate} Hz` : '-'],
    ['Canales', track.channels?.toString() || '-'],
    ['Tamano', `${(track.fileSize / (1024 * 1024)).toFixed(2)} MB`],
    ['Artista', track.artist || '-'],
    ['Titulo', track.title || '-'],
    ['Album', track.album || '-'],
    ['Genero', track.genre || '-'],
    ['BPM', track.bpm?.toString() || '-'],
    ['Key', track.key || '-'],
    ['Energia', track.energyRating ? `${track.energyRating} estrellas` : '-'],
    ['Perfil energia', track.energyRatingProfile || '-'],
    ['Confianza energia', track.energyRatingConfidence !== undefined ? `${Math.round(track.energyRatingConfidence * 100)}%` : '-'],
    ['Criterio energia', track.energyRatingReason || '-'],
    ['Identificador de archivo', track.sha256 || 'No calculado'],
    ['Validacion de archivo', track.ffprobeValid ? 'Correcta' : 'Requiere revision'],
    ['Modificado', new Date(track.modifiedAt).toLocaleString()],
  ];

  const riskLabel =
    track.riskLevel === 'ok' ? 'Sin problemas' :
    track.riskLevel === 'critical' ? 'Critico' :
    track.riskLevel === 'warning' ? 'Advertencia' :
    'Informativo';

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
          <h2 className="truncate" style={{ maxWidth: '520px' }}>{track.filename}</h2>
          {cueTracks.length > 0 && (
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm" disabled={!previousTrack} onClick={() => previousTrack && navigateToTrack(previousTrack.id)}>
                Anterior
              </button>
              <button className="btn btn-ghost btn-sm" disabled={!nextTrack} onClick={() => nextTrack && navigateToTrack(nextTrack.id)}>
                Siguiente
              </button>
            </div>
          )}
        </div>
        <button className="btn btn-ghost" onClick={() => setPage(cueTracks.length > 0 ? 'cue-assistant' : 'issues')}>Volver</button>
      </div>

      <div className="flex gap-2 mb-6">
        <span className={`badge badge-${track.riskLevel === 'ok' ? 'ok' : track.riskLevel}`}>
          {riskLabel}
        </span>
        <span className="badge badge-info">{statusLabels[track.analysisStatus]}</span>
      </div>

      {musicalAnalysis?.diagnostics.warnings.length ? (
        <section className="card mb-6" style={{ borderLeft: '3px solid var(--color-warning)' }}>
          <div className="card-header">
            <span className="card-title">Revision musical sugerida</span>
          </div>
          <div className="flex-col gap-2">
            {musicalAnalysis.diagnostics.warnings.map((warning) => (
              <p key={warning} className="text-sm">{warning}</p>
            ))}
          </div>
        </section>
      ) : null}

      {energyData && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Mapa de energia</span>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Haz clic para crear un marcador. Arrastra para ajustar.</span>
          </div>
          <Waveform
            energyData={energyData}
            cues={allCues}
            duration={track.duration || 0}
            playbackTime={playbackTime}
            selectedCueId={selectedCueId}
            onCueClick={setSelectedCueId}
            onCueMove={handleMoveCue}
            onTimelineClick={(time) => handleAddCue(time)}
          />
        </div>
      )}

      <section className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="card-title">Vista previa de audio</span>
            <p className="text-sm">
              {selectedCue ? `${selectedCue.label} / ${formatDuration(selectedCue.timeSeconds)}` : 'Selecciona un marcador para escucharlo desde su posicion.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={togglePlayback}>{isPlaying ? 'Pausar' : 'Reproducir'}</button>
            <button className="btn btn-secondary" disabled={!selectedCue} onClick={playSelectedCue}>Desde marcador</button>
            <button
              className={`btn ${loopCuePreview ? 'btn-primary' : 'btn-secondary'}`}
              disabled={!selectedCue}
              onClick={() => setLoopCuePreview((current) => !current)}
            >
              Repetir tramo
            </button>
          </div>
        </div>
        <audio
          ref={audioRef}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={() => setDirectPlaybackFailed(true)}
        />
      </section>

      <div className="grid-2 gap-6">
        <div className="card">
          <div className="card-header"><span className="card-title">Informacion del track</span></div>
          <div className="flex-col gap-2">
            {info.map(([label, value]) => (
              <div key={label} className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
                <span className="selectable truncate" style={{ maxWidth: '300px', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-col gap-4">
          {track.issues.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Problemas ({track.issues.length})</span></div>
              <div className="flex-col gap-3">
                {track.issues.map((issue) => (
                  <div key={issue.id} style={{ borderLeft: `3px solid var(--color-${issue.severity})`, paddingLeft: 'var(--space-3)' }}>
                    <div className="flex gap-2 items-center mb-1">
                      <span className={`badge badge-${issue.severity}`}>{severityLabels[issue.severity]}</span>
                      <span style={{ fontWeight: 500 }}>{issue.message}</span>
                    </div>
                    {issue.recommendation && (
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>{issue.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(track.suggestedCues.length > 0 || track.approvedCues.length > 0) && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Marcadores ({track.suggestedCues.length + track.approvedCues.length})</span>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAddCue()}>Agregar manual</button>
              </div>

              <div className="flex-col gap-4">
                {allCues.map((cue) => (
                  <div key={cue.id}>
                    {editingCueId === cue.id ? (
                      <CueEditor
                        cue={cue}
                        onSave={handleUpdateCue}
                        onDiscard={handleDiscardCue}
                        onCancel={() => setEditingCueId(null)}
                      />
                    ) : (
                      <div
                        className="flex justify-between items-center p-3"
                        style={{
                          border: `1px solid ${cue.id === selectedCueId ? 'var(--color-accent)' : 'var(--color-surface-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          background: cue.status === 'approved' ? 'var(--color-ok-bg)' : 'transparent',
                        }}
                        onClick={() => setSelectedCueId(cue.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cue.color || 'var(--color-text-tertiary)' }}></div>
                          <div className="flex-col">
                            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{cue.label}</span>
                            <span className="font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{cue.type} / {formatDuration(cue.timeSeconds)}</span>
                            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              {cueStatusLabels[cue.status]} / Confianza {formatConfidence(cue.confidence)} / Ajuste {snapLabels[cue.snapQuality || ''] || '-'}
                              {cue.reason ? ` / ${cue.reason}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={(event) => { event.stopPropagation(); playCue(cue); }}>Escuchar</button>
                          {cue.status !== 'approved' && (
                            <button className="btn btn-ghost btn-sm" onClick={(event) => { event.stopPropagation(); handleApproveCue(cue.id); }}>Aprobar</button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={(event) => { event.stopPropagation(); setEditingCueId(cue.id); }}>Editar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
