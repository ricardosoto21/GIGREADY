import { v4 as uuidv4 } from 'uuid';
import type { Track, TrackIssue, ScanSettings, Severity, RiskLevel } from '../../src/types';

interface AuditContext {
  settings: ScanSettings;
}

/**
 * Run all audit rules against a track and return issues found.
 */
export function auditTrack(track: Partial<Track>, ctx: AuditContext): TrackIssue[] {
  const issues: TrackIssue[] = [];
  const s = ctx.settings;

  // ── CRITICAL Rules ──

  // Rule 1: File cannot be validated by the audio validator
  if (track.ffprobeValid === false) {
    issues.push(createIssue(track.id!, 'ffprobe_invalid', 'critical',
      'El archivo no pudo validarse correctamente.',
      'Verifica que el archivo no esté corrupto. Intenta reproducirlo en otro software.',
    ));
  }

  // Rule 2: Duration is 0 or missing
  if (track.duration === undefined || track.duration === null || track.duration <= 0) {
    issues.push(createIssue(track.id!, 'duration_invalid', 'critical',
      'Duración no disponible o igual a cero.',
      'El archivo puede estar corrupto o no contener audio válido.',
    ));
  }

  // ── WARNING Rules ──

  // Rule 3: MP3 with low bitrate (≤ 128kbps)
  if (track.extension === '.mp3' && track.bitrate && track.bitrate <= 128) {
    issues.push(createIssue(track.id!, 'bitrate_very_low', 'warning',
      `Bitrate muy bajo: ${track.bitrate} kbps.`,
      'Se recomienda usar archivos de al menos 192 kbps para presentaciones.',
    ));
  }

  // Rule 4: MP3 below minimum configured bitrate
  if (track.extension === '.mp3' && track.bitrate && track.bitrate < s.minMp3Bitrate && track.bitrate > 128) {
    issues.push(createIssue(track.id!, 'bitrate_low', 'warning',
      `Bitrate por debajo del mínimo configurado: ${track.bitrate} kbps (mínimo: ${s.minMp3Bitrate} kbps).`,
      `Considera usar archivos con bitrate de al menos ${s.minMp3Bitrate} kbps.`,
    ));
  }

  // Rule 5: Filename with emoji
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (track.filename && emojiRegex.test(track.filename)) {
    issues.push(createIssue(track.id!, 'filename_emoji', 'warning',
      'El nombre de archivo contiene emojis.',
      'Algunos reproductores y sistemas CDJ no manejan bien los emojis en nombres de archivo.',
      true,
    ));
  }

  // Rule 6: Filename with problematic characters
  if (track.filename && s.problematicChars) {
    const problematic = [...s.problematicChars].filter((c) => track.filename!.includes(c));
    if (problematic.length > 0) {
      issues.push(createIssue(track.id!, 'filename_problematic_chars', 'warning',
        `El nombre de archivo contiene caracteres potencialmente problemáticos: ${problematic.join(' ')}`,
        'Considera renombrar el archivo para mayor compatibilidad.',
        true,
      ));
    }
  }

  // Rule 7: Path too long
  if (track.path && track.path.length > s.maxPathLength) {
    issues.push(createIssue(track.id!, 'path_too_long', 'warning',
      `La ruta excede el límite de ${s.maxPathLength} caracteres (${track.path.length} caracteres).`,
      'Acorta la ruta moviendo el archivo a una carpeta con nombre más corto.',
      true,
    ));
  }

  // Rule 8: Duration too short
  if (track.duration && track.duration < s.minDurationSeconds) {
    issues.push(createIssue(track.id!, 'duration_short', 'warning',
      `Duración muy corta: ${track.duration.toFixed(1)} segundos.`,
      'Verifica que el archivo sea un track completo y no un fragmento.',
    ));
  }

  // Rule 9: Duration extremely long (over 30 minutes)
  if (track.duration && track.duration > 1800) {
    issues.push(createIssue(track.id!, 'duration_long', 'warning',
      `Duración inusualmente larga: ${Math.floor(track.duration / 60)} minutos.`,
      'Verifica que el archivo no sea un mix o grabación en vivo.',
    ));
  }

  // Rule 10: Unusual sample rate
  const normalSampleRates = [44100, 48000, 88200, 96000];
  if (track.sampleRate && !normalSampleRates.includes(track.sampleRate)) {
    issues.push(createIssue(track.id!, 'sample_rate_unusual', 'warning',
      `Sample rate inusual: ${track.sampleRate} Hz.`,
      'El sample rate estándar es 44100 Hz o 48000 Hz.',
    ));
  }

  // Rule 11: Format not recommended for profile
  if (s.compatibilityProfile === 'rekordbox_cdj') {
    const rekordboxFormats = ['.mp3', '.wav', '.aiff', '.aif', '.flac', '.m4a', '.aac'];
    if (track.extension && !rekordboxFormats.includes(track.extension.toLowerCase())) {
      issues.push(createIssue(track.id!, 'format_not_recommended', 'warning',
        `El formato ${track.extension} puede no ser compatible con CDJ/XDJ.`,
        'Considera convertir a MP3, WAV, AIFF o FLAC.',
      ));
    }
  }

  // ── INFO Rules ──

  if (!track.artist) {
    issues.push(createIssue(track.id!, 'no_artist', 'info', 'Sin artista disponible.'));
  }
  if (!track.title) {
    issues.push(createIssue(track.id!, 'no_title', 'info', 'Sin título disponible.'));
  }
  if (!track.genre) {
    issues.push(createIssue(track.id!, 'no_genre', 'info', 'Sin género disponible.'));
  }
  if (!track.hasArtwork) {
    issues.push(createIssue(track.id!, 'no_artwork', 'info', 'Sin carátula.'));
  }
  if (!track.bpm) {
    issues.push(createIssue(track.id!, 'no_bpm', 'info', 'BPM no disponible en el archivo.'));
  }
  if (!track.key) {
    issues.push(createIssue(track.id!, 'no_key', 'info', 'Tonalidad no disponible en el archivo.'));
  }

  return issues;
}

/**
 * Calculate the overall risk level from a list of issues.
 */
export function calculateRiskLevel(issues: TrackIssue[]): RiskLevel {
  if (issues.some((i) => i.severity === 'critical')) return 'critical';
  if (issues.some((i) => i.severity === 'warning')) return 'warning';
  if (issues.some((i) => i.severity === 'info')) return 'info';
  return 'ok';
}

/**
 * Calculate the preparation score for a scan session.
 * Score: 0-100 based on the distribution of issues.
 */
export function calculateScore(
  totalTracks: number,
  criticalCount: number,
  warningCount: number,
  infoCount: number,
): number {
  if (totalTracks === 0) return 100;

  // Weight: critical=10, warning=3, info=0.05
  const maxPenalty = totalTracks * 10;
  const penalty = (criticalCount * 10) + (warningCount * 3) + (infoCount * 0.05);
  const rawScore = Math.max(0, 100 - (penalty / maxPenalty) * 100);

  // If any critical, cap at 49
  if (criticalCount > 0 && rawScore > 49) return 49;

  return Math.round(rawScore);
}

function createIssue(
  trackId: string,
  type: string,
  severity: Severity,
  message: string,
  recommendation?: string,
  canAutoFix: boolean = false,
): TrackIssue {
  return {
    id: uuidv4(),
    trackId,
    type,
    severity,
    message,
    recommendation,
    canAutoFix,
  };
}
