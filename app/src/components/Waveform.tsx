import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { EnergyData, SuggestedCue } from '../types';

interface WaveformProps {
  energyData: EnergyData;
  cues: SuggestedCue[];
  duration: number;
  playbackTime?: number;
  selectedCueId?: string | null;
  onCueClick?: (cueId: string) => void;
  onCueMove?: (cue: SuggestedCue, timeSeconds: number) => void;
  onTimelineClick?: (time: number) => void;
}

const ZOOM_LEVELS = [1, 2, 4, 8];

export function timeToX(time: number, viewStart: number, visibleDuration: number, width: number): number {
  if (visibleDuration <= 0 || width <= 0) return 0;
  return ((time - viewStart) / visibleDuration) * width;
}

export function xToTime(x: number, viewStart: number, visibleDuration: number, width: number): number {
  if (visibleDuration <= 0 || width <= 0) return viewStart;
  return viewStart + (x / width) * visibleDuration;
}

export function clampTime(time: number, duration: number): number {
  return Math.max(0, Math.min(duration || 0, time));
}

export function Waveform({
  energyData,
  cues,
  duration,
  playbackTime,
  selectedCueId,
  onCueClick,
  onCueMove,
  onTimelineClick,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const suppressClickRef = useRef(false);
  const [zoom, setZoom] = useState(1);
  const [viewStart, setViewStart] = useState(0);
  const [draggingCueId, setDraggingCueId] = useState<string | null>(null);
  const [dragPreviewTime, setDragPreviewTime] = useState<number | null>(null);

  const safeDuration = Math.max(0, duration || 0);
  const visibleDuration = useMemo(
    () => Math.max(1, safeDuration > 0 ? safeDuration / zoom : 1),
    [safeDuration, zoom],
  );
  const maxViewStart = Math.max(0, safeDuration - visibleDuration);

  useEffect(() => {
    setViewStart((current) => Math.min(current, maxViewStart));
  }, [maxViewStart]);

  useEffect(() => {
    drawWaveform();
    // La rutina de canvas usa exactamente los datos visuales enumerados aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [energyData, cues, duration, playbackTime, selectedCueId, zoom, viewStart, draggingCueId, dragPreviewTime]);

  const cuesForRender = useMemo(() => {
    if (!draggingCueId || dragPreviewTime === null) return cues;
    return cues.map((cue) => (
      cue.id === draggingCueId ? { ...cue, timeSeconds: dragPreviewTime } : cue
    ));
  }, [cues, draggingCueId, dragPreviewTime]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f7f7f5';
    ctx.fillRect(0, 0, width, height);

    const viewEnd = viewStart + visibleDuration;

    energyData.segments?.forEach((segment, index) => {
      if (segment.endTime < viewStart || segment.startTime > viewEnd) return;
      const x = timeToX(Math.max(segment.startTime, viewStart), viewStart, visibleDuration, width);
      const segmentEndX = timeToX(Math.min(segment.endTime, viewEnd), viewStart, visibleDuration, width);
      const w = Math.max(1, segmentEndX - x);
      ctx.fillStyle = index % 2 === 0 ? '#ececea' : '#ffffff';
      ctx.fillRect(x, 0, w, height);
      if (w > 54 && segment.label) {
        ctx.font = '500 10px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#7c7c75';
        ctx.fillText(segment.label, x + 6, height - 8);
      }
    });

    drawEnergyBars(ctx, width, height, viewEnd);
    drawLowEnergy(ctx, width, height, viewEnd);
    drawPlaybackMarker(ctx, width, height, viewEnd);
    drawCueMarkers(ctx, width, height, viewEnd);
  };

  const drawEnergyBars = (ctx: CanvasRenderingContext2D, width: number, height: number, viewEnd: number) => {
    const data = energyData.rmsEnergy || [];
    if (data.length === 0) return;
    const times = energyData.times;
    const timeStep = safeDuration > 0 ? safeDuration / data.length : 1;
    const barWidth = Math.max(1, width / Math.max(24, data.length / zoom));

    ctx.fillStyle = '#b5b5ad';
    data.forEach((value, index) => {
      const time = times?.[index] ?? index * timeStep;
      if (time < viewStart || time > viewEnd) return;
      const x = timeToX(time, viewStart, visibleDuration, width);
      const h = Math.max(1, value * height * 0.78);
      const y = (height - h) / 2;
      ctx.fillRect(x, y, Math.max(1, Math.min(barWidth, 6)), h);
    });
  };

  const drawLowEnergy = (ctx: CanvasRenderingContext2D, width: number, height: number, viewEnd: number) => {
    const lowData = energyData.lowEnergy || [];
    if (lowData.length === 0) return;
    const times = energyData.times;
    const timeStep = safeDuration > 0 ? safeDuration / lowData.length : 1;

    ctx.strokeStyle = '#4f4f49';
    ctx.lineWidth = 1;
    ctx.beginPath();
    let hasPoint = false;

    lowData.forEach((value, index) => {
      const time = times?.[index] ?? index * timeStep;
      if (time < viewStart || time > viewEnd) return;
      const x = timeToX(time, viewStart, visibleDuration, width);
      const y = height - (value * height * 0.55) - 12;
      if (!hasPoint) {
        ctx.moveTo(x, y);
        hasPoint = true;
      } else {
        ctx.lineTo(x, y);
      }
    });

    if (hasPoint) ctx.stroke();
  };

  const drawPlaybackMarker = (ctx: CanvasRenderingContext2D, width: number, height: number, viewEnd: number) => {
    if (playbackTime === undefined || playbackTime < viewStart || playbackTime > viewEnd) return;
    const x = timeToX(playbackTime, viewStart, visibleDuration, width);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  };

  const drawCueMarkers = (ctx: CanvasRenderingContext2D, width: number, height: number, viewEnd: number) => {
    let lastLabelX = -Infinity;
    cuesForRender
      .filter((cue) => cue.timeSeconds >= viewStart && cue.timeSeconds <= viewEnd)
      .sort((a, b) => a.timeSeconds - b.timeSeconds)
      .forEach((cue) => {
        const x = timeToX(cue.timeSeconds, viewStart, visibleDuration, width);
        const selected = cue.id === selectedCueId || cue.id === draggingCueId;
        ctx.strokeStyle = cue.color || '#111111';
        ctx.lineWidth = selected ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        if (zoom > 1 || x - lastLabelX > 72 || selected) {
          const text = cue.label || cue.type;
          ctx.font = selected ? '700 10px Inter, system-ui, sans-serif' : '600 10px Inter, system-ui, sans-serif';
          const metrics = ctx.measureText(text);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.fillRect(x + 3, 3, Math.min(metrics.width + 8, 120), 16);
          ctx.fillStyle = cue.color || '#111111';
          ctx.fillText(text.slice(0, 18), x + 7, 15);
          lastLabelX = x;
        }
      });
  };

  const getCanvasPosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = event.clientX - rect.left;
    const time = clampTime(xToTime(x, viewStart, visibleDuration, rect.width), safeDuration);
    return { x, time, width: rect.width };
  };

  const findCueAtX = (x: number, width: number) => {
    let nearest: SuggestedCue | null = null;
    let nearestDistance = Infinity;

    for (const cue of cuesForRender) {
      if (cue.timeSeconds < viewStart || cue.timeSeconds > viewStart + visibleDuration) continue;
      const cueX = timeToX(cue.timeSeconds, viewStart, visibleDuration, width);
      const distance = Math.abs(cueX - x);
      if (distance < nearestDistance) {
        nearest = cue;
        nearestDistance = distance;
      }
    }

    return nearestDistance <= 9 ? nearest : null;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const position = getCanvasPosition(event);
    if (!position) return;
    const cue = findCueAtX(position.x, position.width);
    if (!cue) return;

    setDraggingCueId(cue.id);
    setDragPreviewTime(cue.timeSeconds);
    onCueClick?.(cue.id);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingCueId) return;
    const position = getCanvasPosition(event);
    if (!position) return;
    suppressClickRef.current = true;
    setDragPreviewTime(position.time);
  };

  const handleMouseUp = () => {
    if (!draggingCueId) return;
    const cue = cues.find((item) => item.id === draggingCueId);
    if (cue && dragPreviewTime !== null) {
      onCueMove?.(cue, dragPreviewTime);
    }
    setDraggingCueId(null);
    setDragPreviewTime(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const position = getCanvasPosition(event);
    if (!position) return;
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const cue = findCueAtX(position.x, position.width);
    if (cue) {
      onCueClick?.(cue.id);
      return;
    }

    onTimelineClick?.(position.time);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {ZOOM_LEVELS.map((level) => (
            <button
              key={level}
              className={`btn btn-sm ${zoom === level ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setZoom(level)}
            >
              {level}x
            </button>
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Arrastra un marcador para ajustar su posicion
        </span>
      </div>

      <div
        className="waveform-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          height: '144px',
          cursor: draggingCueId ? 'grabbing' : 'crosshair',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--color-bg-secondary)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onMouseUp={handleMouseUp}
        />
      </div>

      {zoom > 1 && (
        <input
          className="input mt-4"
          type="range"
          min={0}
          max={maxViewStart}
          step={0.1}
          value={viewStart}
          onChange={(event) => setViewStart(Number(event.target.value))}
        />
      )}
    </div>
  );
}
