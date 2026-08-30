import * as fs from 'fs/promises';
import type { Track, ScanSession, DashboardSummary } from '../../src/types';

/**
 * Export audit data to CSV format.
 */
export async function exportCSV(tracks: Track[], outputPath: string): Promise<void> {
  const headers = [
    'Archivo', 'Ruta', 'Formato', 'Codec', 'Duración (s)', 'Bitrate (kbps)',
    'Sample Rate', 'Canales', 'Artista', 'Título', 'Álbum', 'Género',
    'BPM', 'Key', 'Tamaño (MB)', 'Riesgo', 'Problemas', 'SHA256',
  ];

  const rows = tracks.map((t) => [
    escapeCsv(t.filename),
    escapeCsv(t.path),
    t.extension,
    t.codec || '',
    t.duration?.toFixed(1) || '',
    t.bitrate?.toString() || '',
    t.sampleRate?.toString() || '',
    t.channels?.toString() || '',
    escapeCsv(t.artist || ''),
    escapeCsv(t.title || ''),
    escapeCsv(t.album || ''),
    escapeCsv(t.genre || ''),
    t.bpm?.toString() || '',
    t.key || '',
    (t.fileSize / (1024 * 1024)).toFixed(2),
    t.riskLevel,
    escapeCsv(t.issues.map((i) => `[${i.severity}] ${i.message}`).join('; ')),
    t.sha256 || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  await fs.writeFile(outputPath, '\uFEFF' + csv, 'utf-8'); // BOM for Excel
}

/**
 * Export cues to CSV format.
 */
export async function exportCuesCSV(tracks: Track[], outputPath: string): Promise<void> {
  const headers = ['Archivo', 'Artista', 'Título', 'Tipo de Cue', 'Tiempo (s)', 'Etiqueta', 'Confianza', 'Estado'];
  const rows: string[][] = [];

  for (const t of tracks) {
    const cues = [...t.suggestedCues, ...t.approvedCues];
    for (const cue of cues) {
      rows.push([
        escapeCsv(t.filename),
        escapeCsv(t.artist || ''),
        escapeCsv(t.title || ''),
        cue.type,
        cue.timeSeconds.toFixed(3),
        escapeCsv(cue.label),
        cue.confidence ? (cue.confidence * 100).toFixed(0) + '%' : '',
        cue.status,
      ]);
    }
  }

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  await fs.writeFile(outputPath, '\uFEFF' + csv, 'utf-8');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export audit report to HTML format.
 */
export async function exportHTML(
  tracks: Track[],
  session: ScanSession,
  dashboard: DashboardSummary,
  outputPath: string,
): Promise<void> {
  const scoreColor = dashboard.score >= 90 ? '#3ec97a' : dashboard.score >= 70 ? '#e8a838' : '#e85454';
  const criticalTracks = tracks.filter((t) => t.riskLevel === 'critical');
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GigReady - Reporte de Auditoría</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; color: #333; padding: 40px; }
  .container { max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 18px; margin: 24px 0 12px; border-bottom: 2px solid #eee; padding-bottom: 6px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
  .score { display: inline-block; width: 60px; height: 60px; line-height: 60px; text-align: center; border-radius: 50%; font-size: 22px; font-weight: bold; color: white; background: ${scoreColor}; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .stat { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
  .stat-value { font-size: 24px; font-weight: bold; }
  .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; background: white; }
  th { background: #f0f0f0; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #ddd; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; }
  tr:hover td { background: #f8f8f8; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
  .badge-critical { background: #fee2e2; color: #dc2626; }
  .badge-warning { background: #fef3c7; color: #d97706; }
  .badge-info { background: #dbeafe; color: #2563eb; }
  .badge-ok { background: #dcfce7; color: #16a34a; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
  .note { background: #f0f9ff; border-left: 3px solid #3b82f6; padding: 12px 16px; margin: 16px 0; font-size: 13px; }
</style>
</head>
<body>
<div class="container">
  <h1>GigReady - Reporte de Auditoría</h1>
  <p class="subtitle">
    ${session.rootPath} · ${new Date(session.createdAt).toLocaleString()} · ${tracks.length} tracks analizados
  </p>

  <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
    <div class="score">${dashboard.score}</div>
    <div>
      <div style="font-weight:600;font-size:16px">${dashboard.scoreLabel}</div>
      <div style="font-size:13px;color:#666">Score general de preparación</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-value">${dashboard.totalTracks}</div><div class="stat-label">Tracks</div></div>
    <div class="stat" style="border-left:3px solid #dc2626"><div class="stat-value">${dashboard.criticalCount}</div><div class="stat-label">Críticos</div></div>
    <div class="stat" style="border-left:3px solid #d97706"><div class="stat-value">${dashboard.warningCount}</div><div class="stat-label">Advertencias</div></div>
    <div class="stat" style="border-left:3px solid #2563eb"><div class="stat-value">${dashboard.infoCount}</div><div class="stat-label">Informativos</div></div>
  </div>

  ${criticalTracks.length > 0 ? `
  <h2>Archivos con problemas críticos (${criticalTracks.length})</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Riesgo</th><th>Problemas</th></tr></thead>
    <tbody>
    ${criticalTracks.map((t) => `
      <tr>
        <td>${escapeHtml(t.filename)}</td>
        <td><span class="badge badge-critical">Crítico</span></td>
        <td>${t.issues.map((i) => `<span class="badge badge-${i.severity}">${escapeHtml(i.message)}</span> `).join('')}</td>
      </tr>
    `).join('')}
    </tbody>
  </table>` : ''}

  <h2>Todos los tracks (${tracks.length})</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Formato</th><th>Bitrate</th><th>Duración</th><th>Riesgo</th></tr></thead>
    <tbody>
    ${tracks.map((t) => `
      <tr>
        <td title="${escapeHtml(t.path)}">${escapeHtml(t.filename)}</td>
        <td>${t.extension}</td>
        <td>${t.bitrate ? t.bitrate + ' kbps' : '-'}</td>
        <td>${t.duration ? Math.floor(t.duration / 60) + ':' + String(Math.floor(t.duration % 60)).padStart(2, '0') : '-'}</td>
        <td><span class="badge badge-${t.riskLevel}">${t.riskLevel}</span></td>
      </tr>
    `).join('')}
    </tbody>
  </table>

  <div class="note">No se realizaron cambios en los archivos originales durante este análisis.</div>

  <div class="footer">
    Generado por GigReady v1.2.0-beta.1 - ${new Date().toLocaleString()}
  </div>
</div>
</body>
</html>`;

  await fs.writeFile(outputPath, html, 'utf-8');
}

/**
 * Export audit report to PDF format.
 */
export async function exportPDF(
  tracks: Track[],
  session: ScanSession,
  dashboard: DashboardSummary,
  outputPath: string,
): Promise<void> {
  const problemTracks = tracks.filter((track) => track.riskLevel !== 'ok').slice(0, 120);
  const lines = [
    'GigReady - Reporte de Auditoria',
    session.rootPath,
    new Date(session.createdAt).toLocaleString(),
    '',
    `Score general: ${dashboard.score} - ${dashboard.scoreLabel}`,
    `Tracks analizados: ${dashboard.totalTracks}`,
    `Problemas criticos: ${dashboard.criticalCount}`,
    `Advertencias: ${dashboard.warningCount}`,
    `Informativos: ${dashboard.infoCount}`,
    `Duplicados exactos: ${dashboard.duplicateExactCount}`,
    `Duplicados probables: ${dashboard.duplicateProbableCount}`,
    '',
    'Archivos que requieren revision',
    '',
  ];

  if (problemTracks.length === 0) {
    lines.push('No se encontraron problemas criticos ni advertencias.');
  } else {
    for (const track of problemTracks) {
      lines.push(`${track.filename}  ${track.riskLevel}`);
      const issueSummary = track.issues
        .filter((issue) => issue.severity !== 'info')
        .map((issue) => issue.message)
        .join('; ');
      if (issueSummary) {
        lines.push(`  ${issueSummary}`);
      }
      lines.push('');
    }
  }

  lines.push('');
  lines.push('No se realizaron cambios en los archivos originales durante este analisis.');
  lines.push('Revisa cualquier archivo exportado en Rekordbox antes de preparar tu USB.');

  await fs.writeFile(outputPath, buildSimplePdf(lines));
}

function buildSimplePdf(lines: string[]): Buffer {
  const wrappedLines = lines.flatMap((line) => wrapPdfLine(line, 92));
  const pages = chunkLines(wrappedLines, 46);
  const objects = new Map<number, string>();
  const pageRefs: string[] = [];
  let nextObject = 4;

  for (const pageLines of pages) {
    const pageObject = nextObject++;
    const contentObject = nextObject++;
    const stream = buildPdfPageStream(pageLines);

    pageRefs.push(`${pageObject} 0 R`);
    objects.set(
      pageObject,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`,
    );
    objects.set(contentObject, `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
  }

  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objects.set(2, `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pages.length} >>`);
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  const objectCount = nextObject - 1;

  for (let objectNumber = 1; objectNumber <= objectCount; objectNumber++) {
    offsets[objectNumber] = Buffer.byteLength(pdf, 'ascii');
    pdf += `${objectNumber} 0 obj\n${objects.get(objectNumber) ?? ''}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objectCount + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let objectNumber = 1; objectNumber <= objectCount; objectNumber++) {
    pdf += `${String(offsets[objectNumber]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'ascii');
}

function buildPdfPageStream(lines: string[]): string {
  const commands = ['BT', '/F1 10 Tf', '14 TL', '48 790 Td'];
  for (const line of lines) {
    commands.push(`(${escapePdfText(line)}) Tj`);
    commands.push('T*');
  }
  commands.push('ET');
  return commands.join('\n');
}

function wrapPdfLine(line: string, maxLength: number): string[] {
  if (!line) return [''];
  const normalized = normalizePdfText(line);
  const chunks: string[] = [];
  let remaining = normalized;
  while (remaining.length > maxLength) {
    const breakpoint = remaining.lastIndexOf(' ', maxLength);
    const splitAt = breakpoint > 20 ? breakpoint : maxLength;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  chunks.push(remaining);
  return chunks;
}

function chunkLines(lines: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < lines.length; index += size) {
    chunks.push(lines.slice(index, index + size));
  }
  return chunks.length ? chunks : [['']];
}

function escapePdfText(value: string): string {
  return normalizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function normalizePdfText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Export playlist in M3U8 format.
 */
export async function exportM3U(tracks: Track[], outputPath: string): Promise<void> {
  const lines: string[] = ['#EXTM3U'];
  
  for (const track of tracks) {
    if (track.riskLevel === 'critical') continue; // Skip critical tracks
    
    const duration = Math.round(track.duration || 0);
    const display = track.artist && track.title
      ? `${track.artist} - ${track.title}`
      : track.filename;
    
    lines.push(`#EXTINF:${duration},${display}`);
    lines.push(track.path);
  }

  // Use BOM for UTF-8 M3U8 compatibility
  await fs.writeFile(outputPath, '\uFEFF' + lines.join('\n'), 'utf-8');
}

/**
 * Export full technical data as JSON.
 */
export async function exportJSON(tracks: Track[], session: ScanSession, outputPath: string): Promise<void> {
  const data = {
    generatedAt: new Date().toISOString(),
    generator: 'GigReady v1.2.0-beta.1',
    session,
    tracks,
  };
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}
