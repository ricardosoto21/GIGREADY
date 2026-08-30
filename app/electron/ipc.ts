import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import type { IpcMainInvokeEvent } from 'electron';
import { z } from 'zod';
import { ensureDatabase } from '../backend/database/database';
import {
  getSession, getSessions, getTracks, getTrack,
  getDashboard, getDuplicateGroups,
  approveCue, discardCue, approveAllCues, updateCue, approveAllSessionCues,
  getEnergyData, storeEnergyData, getMusicalAnalysis, storeMusicalAnalysis,
  updateTrackPaths,
} from '../backend/database/data-access';
import { startScan, cancelScan } from '../backend/scanner/scan-orchestrator';
import { exportCSV, exportHTML, exportM3U, exportJSON, exportPDF } from '../backend/exporters/export-engine';
import { generateRekordboxXML } from '../backend/rekordbox/rekordbox-xml';
import { createBackup, createCleanFolder, type CleanFolderFile } from '../backend/backup/backup-engine';
import { sanitizeFilename } from '../backend/scanner/filename-sanitizer';
import { analyzeEnergyData } from '../backend/audio/energy-analyzer';
import { analyzeMusicalTrack } from '../backend/audio/musical-analysis-engine';
import { energyDataFromMusicalAnalysis } from '../backend/audio/standard-analyzer';
import { buildConversionPlan, cancelConversion, startConversionPlan } from '../backend/converter/audio-converter';
import { createPreviewClip } from '../backend/audio/audio-preview';
import { logger } from '../backend/logger';
import type {
  CleanFolderOptions,
  CleanFolderPreview,
  CleanFolderResult,
  ConversionPlan,
  ConversionSource,
  ConversionTargetFormat,
  ScanSettings,
  Track,
} from '../src/types';

let dbInitialized = false;

const approvedScanRoots = new Set<string>();
const approvedConversionFiles = new Set<string>();
const approvedConversionFolders = new Set<string>();
const approvedConversionOutputs = new Set<string>();
const approvedOpenPaths = new Set<string>();
const preparedConversionPlans = new Map<string, ConversionPlan>();

type TrustedIpcHandler = (event: IpcMainInvokeEvent, ...args: any[]) => any;

const absolutePathSchema = z.string().trim().min(1).max(32_767).refine(
  (value) => path.isAbsolute(value),
  'Se requiere una ruta absoluta.',
);
const identifierSchema = z.string().trim().min(1).max(200);
const conversionTargetSchema = z.enum(['mp3', 'wav', 'aiff']);

function handleIpc(channel: string, listener: TrustedIpcHandler): void {
  ipcMain.handle(channel, async (event, ...args) => {
    assertTrustedSender(event);
    return listener(event, ...args);
  });
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  const senderUrl = event.senderFrame?.url || event.sender.getURL();
  let parsed: URL;
  try {
    parsed = new URL(senderUrl);
  } catch {
    throw new Error('Origen IPC no valido.');
  }

  let trusted = parsed.origin === 'http://localhost:5173' && !app.isPackaged;
  if (parsed.protocol === 'file:') {
    try {
      const expectedRenderer = path.resolve(__dirname, '../renderer/index.html').toLowerCase();
      trusted = path.resolve(fileURLToPath(parsed)).toLowerCase() === expectedRenderer;
    } catch {
      trusted = false;
    }
  }
  if (!trusted) {
    logger.warn('Blocked IPC request from untrusted sender', { senderUrl });
    throw new Error('Origen IPC no autorizado.');
  }
}

function ensureDb(): void {
  if (!dbInitialized) {
    const dbPath = path.join(app.getPath('userData'), 'gigready.db');
    ensureDatabase(dbPath);
    dbInitialized = true;
  }
}

export function registerIpcHandlers(): void {
  // Dialog
  handleIpc('dialog:select-folder', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;
    const result = await dialog.showOpenDialog(window, {
      title: 'Seleccionar carpeta de musica',
      properties: ['openDirectory'],
      buttonLabel: 'Seleccionar',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const selectedPath = path.resolve(result.filePaths[0]);
    approvedScanRoots.add(normalizePathKey(selectedPath));
    return selectedPath;
  });

  handleIpc('converter:select-files', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return [];
    const result = await dialog.showOpenDialog(window, {
      title: 'Seleccionar archivos de audio',
      properties: ['openFile', 'multiSelections'],
      buttonLabel: 'Seleccionar',
      filters: [
        { name: 'Audio', extensions: ['mp3', 'wav', 'aiff', 'aif', 'flac', 'm4a', 'aac', 'ogg'] },
      ],
    });
    if (result.canceled) return [];
    const selectedPaths = result.filePaths.map((filePath) => path.resolve(filePath));
    selectedPaths.forEach((filePath) => approvedConversionFiles.add(normalizePathKey(filePath)));
    return selectedPaths;
  });

  handleIpc('converter:select-folder', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;
    const result = await dialog.showOpenDialog(window, {
      title: 'Seleccionar carpeta de audio',
      properties: ['openDirectory'],
      buttonLabel: 'Seleccionar',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const selectedPath = path.resolve(result.filePaths[0]);
    approvedConversionFolders.add(normalizePathKey(selectedPath));
    return selectedPath;
  });

  handleIpc('converter:select-output-folder', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;
    const result = await dialog.showOpenDialog(window, {
      title: 'Seleccionar carpeta destino',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Usar carpeta',
      defaultPath: path.join(app.getPath('documents'), 'GigReady Converted'),
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const selectedPath = path.resolve(result.filePaths[0]);
    approvedConversionOutputs.add(normalizePathKey(selectedPath));
    approvedOpenPaths.add(normalizePathKey(selectedPath));
    return selectedPath;
  });

  // System
  handleIpc('system:get-version', () => app.getVersion());

  handleIpc('system:open-path', async (_e, filePath: string) => {
    const safePath = path.resolve(absolutePathSchema.parse(filePath));
    if (!approvedOpenPaths.has(normalizePathKey(safePath))) {
      throw new Error('La ruta no fue creada o seleccionada por GigReady en esta sesion.');
    }
    await fs.access(safePath);
    const error = await shell.openPath(safePath);
    if (error) throw new Error(error);
  });

  handleIpc('system:get-drives', async () => {
    if (process.platform !== 'win32') return [];
    const drives: Array<{ letter: string; path: string }> = [];
    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i);
      const drivePath = `${letter}:\\`;
      try {
        await fs.access(drivePath);
        approvedScanRoots.add(normalizePathKey(drivePath));
        drives.push({ letter, path: drivePath });
      } catch { /* skip */ }
    }
    return drives;
  });

  handleIpc('system:get-disk-space', async (_e, drivePath: string) => {
    const safePath = absolutePathSchema.parse(drivePath);
    try {
      const stats = await fs.statfs(safePath);
      return { path: safePath, total: stats.bsize * stats.blocks, free: stats.bsize * stats.bfree };
    } catch (error) {
      return { path: safePath, error: getErrorMessage(error) };
    }
  });

  // Settings
  handleIpc('settings:get', async () => {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    try { return { ...getDefaultSettings(), ...JSON.parse(await fs.readFile(settingsPath, 'utf-8')) }; }
    catch { return getDefaultSettings(); }
  });

  handleIpc('settings:save', async (_e, settings: any) => {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const normalizedSettings = normalizeSettingsInput(settings);
    await fs.writeFile(settingsPath, JSON.stringify(normalizedSettings, null, 2), 'utf-8');
  });

  // Logs
  handleIpc('logs:get', async (_e, count?: number) => {
    const logPath = path.join(app.getPath('userData'), 'logs', 'gigready.log');
    try {
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      return count ? lines.slice(-count) : lines;
    } catch { return []; }
  });

  // Scan
  handleIpc('scan:start', async (event, rootPath: string, settings: any) => {
    ensureDb();
    const win = BrowserWindow.fromWebContents(event.sender)!;
    const safeRootPath = path.resolve(absolutePathSchema.parse(rootPath));
    if (!approvedScanRoots.has(normalizePathKey(safeRootPath))) {
      throw new Error('Selecciona primero la carpeta o unidad que deseas escanear.');
    }
    const normalizedSettings = normalizeSettingsInput(settings);
    return startScan(safeRootPath, normalizedSettings, win);
  });

  handleIpc('scan:cancel', async (_e, sessionId: string) => {
    cancelScan(identifierSchema.parse(sessionId));
  });

  // Data
  handleIpc('data:get-tracks', async (_e, sessionId: string, options?: any) => {
    ensureDb();
    return getTracks(sessionId, options);
  });

  handleIpc('data:get-track', async (_e, trackId: string) => {
    ensureDb();
    return getTrack(trackId);
  });

  handleIpc('data:get-session', async (_e, sessionId: string) => {
    ensureDb();
    return getSession(sessionId);
  });

  handleIpc('data:get-sessions', async () => {
    ensureDb();
    return getSessions();
  });

  handleIpc('data:get-dashboard', async (_e, sessionId: string) => {
    ensureDb();
    return getDashboard(sessionId);
  });

  handleIpc('data:get-duplicates', async (_e, sessionId: string) => {
    ensureDb();
    return getDuplicateGroups(sessionId);
  });
  
  handleIpc('data:get-energy', async (_e, trackId: string) => {
    ensureDb();
    let energy = getEnergyData(trackId);
    if (!energy) {
      const analysis = getMusicalAnalysis(trackId);
      if (analysis) {
        energy = energyDataFromMusicalAnalysis(analysis);
        storeEnergyData(trackId, energy);
      }
    }
    if (!energy) {
      const track = getTrack(trackId);
      if (track) {
        energy = await analyzeEnergyData(track);
        storeEnergyData(trackId, energy);
      }
    }
    return energy;
  });

  handleIpc('data:get-musical-analysis', async (_e, trackId: string) => {
    ensureDb();
    let analysis = getMusicalAnalysis(trackId);
    if (!analysis) {
      const track = getTrack(trackId);
      if (track) {
        analysis = await analyzeMusicalTrack(track, { analysisEngine: 'standard' });
        storeMusicalAnalysis(trackId, analysis);
      }
    }
    return analysis;
  });

  handleIpc('audio:get-playback-url', async (_e, trackId: string) => {
    ensureDb();
    const track = getTrack(trackId);
    if (!track) throw new Error('No se encontro el track.');
    return `gigready-media://track/${encodeURIComponent(trackId)}`;
  });

  handleIpc('audio:create-preview-clip', async (_e, trackId: string, startTimeSeconds: number, durationSeconds?: number) => {
    ensureDb();
    const track = getTrack(trackId);
    if (!track) throw new Error('No se encontro el track.');
    return createPreviewClip(track, app.getPath('temp'), startTimeSeconds, durationSeconds);
  });

  handleIpc('clean-folder:preview', async (_e, sessionId: string, options: CleanFolderOptions) => {
    ensureDb();
    const tracks = getTracks(sessionId);
    const duplicateGroups = getDuplicateGroups(sessionId);
    return buildCleanFolderPlan(tracks, duplicateGroups, options).preview;
  });

  // Cues
  handleIpc('cues:update', async (_e, cue: any) => { ensureDb(); updateCue(cue); });
  handleIpc('cues:approve', async (_e, cueId: string) => { ensureDb(); approveCue(cueId); });
  handleIpc('cues:discard', async (_e, cueId: string) => { ensureDb(); discardCue(cueId); });
  handleIpc('cues:approve-all', async (_e, trackId: string) => { ensureDb(); approveAllCues(trackId); });
  handleIpc('cues:approve-session-all', async (_e, sessionId: string) => { ensureDb(); approveAllSessionCues(sessionId); });

  // Export
  handleIpc('export:csv', async (event, sessionId: string, outputPath?: string) => {
    ensureDb();
    rejectDirectExportPath(outputPath);
    const win = BrowserWindow.fromWebContents(event.sender)!;
    const tracks = getTracks(identifierSchema.parse(sessionId));
    const out = await pickSaveFile(win, 'GigReady_Auditoria.csv', [{ name: 'CSV', extensions: ['csv'] }]);
    if (!out) return '';
    await exportCSV(tracks, out);
    grantOpenPath(out);
    return out;
  });

  handleIpc('export:html', async (event, sessionId: string, outputPath?: string) => {
    ensureDb();
    rejectDirectExportPath(outputPath);
    const win = BrowserWindow.fromWebContents(event.sender)!;
    const safeSessionId = identifierSchema.parse(sessionId);
    const tracks = getTracks(safeSessionId);
    const session = getSession(safeSessionId)!;
    const dashboard = getDashboard(safeSessionId)!;
    const out = await pickSaveFile(win, 'GigReady_Reporte.html', [{ name: 'HTML', extensions: ['html'] }]);
    if (!out) return '';
    await exportHTML(tracks, session, dashboard, out);
    grantOpenPath(out);
    return out;
  });

  handleIpc('export:pdf', async (event, sessionId: string, outputPath?: string) => {
    ensureDb();
    rejectDirectExportPath(outputPath);
    const win = BrowserWindow.fromWebContents(event.sender)!;
    const safeSessionId = identifierSchema.parse(sessionId);
    const tracks = getTracks(safeSessionId);
    const session = getSession(safeSessionId)!;
    const dashboard = getDashboard(safeSessionId)!;
    const out = await pickSaveFile(win, 'GigReady_Reporte.pdf', [{ name: 'PDF', extensions: ['pdf'] }]);
    if (!out) return '';
    await exportPDF(tracks, session, dashboard, out);
    grantOpenPath(out);
    return out;
  });

  handleIpc('export:m3u', async (event, sessionId: string, outputPath?: string) => {
    ensureDb();
    rejectDirectExportPath(outputPath);
    const win = BrowserWindow.fromWebContents(event.sender)!;
    const tracks = getTracks(identifierSchema.parse(sessionId));
    const out = await pickSaveFile(win, 'GigReady_Playlist.m3u8', [{ name: 'M3U8', extensions: ['m3u8', 'm3u'] }]);
    if (!out) return '';
    await exportM3U(tracks, out);
    grantOpenPath(out);
    return out;
  });

  handleIpc('export:rekordbox-xml', async (event, sessionId: string, outputPath?: string) => {
    ensureDb();
    rejectDirectExportPath(outputPath);
    const win = BrowserWindow.fromWebContents(event.sender)!;
    const safeSessionId = identifierSchema.parse(sessionId);
    const tracks = getTracks(safeSessionId);
    const session = getSession(safeSessionId);
    const out = await pickSaveFile(win, 'GigReady_Rekordbox.xml', [{ name: 'XML', extensions: ['xml'] }]);
    if (!out) return '';
    await generateRekordboxXML(tracks, out, session?.rootPath ? `GigReady - ${path.basename(session.rootPath)}` : 'GigReady');
    grantOpenPath(out);
    return out;
  });

  handleIpc('export:json', async (event, sessionId: string, outputPath?: string) => {
    ensureDb();
    rejectDirectExportPath(outputPath);
    const win = BrowserWindow.fromWebContents(event.sender)!;
    const safeSessionId = identifierSchema.parse(sessionId);
    const tracks = getTracks(safeSessionId);
    const session = getSession(safeSessionId)!;
    const out = await pickSaveFile(win, 'GigReady_Data.json', [{ name: 'JSON', extensions: ['json'] }]);
    if (!out) return '';
    await exportJSON(tracks, session, out);
    grantOpenPath(out);
    return out;
  });

  handleIpc('export:clean-folder', async (event, sessionId: string, options: any) => {
    ensureDb();
    const win = BrowserWindow.fromWebContents(event.sender)!;
    const tracks = getTracks(sessionId);
    const session = getSession(sessionId);
    const duplicateGroups = getDuplicateGroups(sessionId);
    const result = await dialog.showOpenDialog(win, {
      title: 'Seleccionar carpeta destino para carpeta limpia',
      properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return '';

    const cleanOptions = normalizeCleanFolderOptions(options);
    const outputDir = path.join(result.filePaths[0], sanitizePathSegment(cleanOptions.folderName || 'GigReady Clean'));
    const plan = buildCleanFolderPlan(tracks, duplicateGroups, cleanOptions);
    const copyResult = await createCleanFolder(
      plan.files,
      outputDir,
      cleanOptions.organization === 'flat',
      session?.rootPath,
    );
    const copiedTracks = rebaseTracksToCopiedFiles(plan.tracks, copyResult.copiedFiles);

    const reports: string[] = [];

    if (cleanOptions.includeCsv) {
      const reportPath = path.join(outputDir, 'GigReady_Auditoria.csv');
      await exportCSV(copiedTracks, reportPath);
      reports.push(reportPath);
    }
    if (cleanOptions.includeHtml && session) {
      const dashboard = getDashboard(sessionId);
      if (dashboard) {
        const reportPath = path.join(outputDir, 'GigReady_Reporte.html');
        await exportHTML(copiedTracks, session, dashboard, reportPath);
        reports.push(reportPath);
      }
    }
    if (cleanOptions.includeM3u) {
      const reportPath = path.join(outputDir, 'GigReady_Playlist.m3u8');
      await exportM3U(copiedTracks, reportPath);
      reports.push(reportPath);
    }
    if (cleanOptions.includeRekordboxXml && session) {
      const reportPath = path.join(outputDir, 'GigReady_Rekordbox.xml');
      await generateRekordboxXML(copiedTracks, reportPath, `GigReady - ${path.basename(session.rootPath)}`);
      reports.push(reportPath);
    }
    if (cleanOptions.includeSupportData && session) {
      const reportPath = path.join(outputDir, 'GigReady_Soporte.json');
      await exportJSON(copiedTracks, session, reportPath);
      reports.push(reportPath);
    }

    const cleanResult: CleanFolderResult = {
      ...plan.preview,
      outputPath: outputDir,
      copied: copyResult.copied,
      failed: copyResult.failed,
      errors: copyResult.errors,
      reports,
    };
    grantOpenPath(outputDir);

    logger.info('Clean folder created', {
      sessionId,
      outputDir,
      copied: cleanResult.copied,
      failed: cleanResult.failed,
      reports: reports.length,
    });

    return cleanResult;
  });

  handleIpc('rename:preview', async (_e, sessionId: string) => {
    ensureDb();
    return getTracks(sessionId)
      .map((track) => ({ ...sanitizeFilename(track.filename), originalPath: track.path }))
      .filter((preview) => preview.hasChanges);
  });

  handleIpc('rename:apply', async (_e, sessionId: string, renames: any[], shouldCreateBackup: boolean) => {
    ensureDb();
    if (!shouldCreateBackup) {
      throw new Error('Se requiere crear un respaldo antes de aplicar cambios sobre archivos originales.');
    }

    const safeSessionId = identifierSchema.parse(sessionId);
    const tracks = getTracks(safeSessionId);
    const tracksByPath = new Map(tracks.map((track) => [normalizePathKey(track.path), track]));
    const requestedRenames = parseRenameRequests(renames, tracks);
    const toApply = requestedRenames.map((request) => {
      const track = tracksByPath.get(normalizePathKey(request.originalPath));
      if (!track) {
        throw new Error('El archivo solicitado no pertenece a la sesion activa.');
      }

      const sanitized = sanitizeFilename(track.filename);
      if (!sanitized.hasChanges || request.newName !== sanitized.newName) {
        throw new Error(`El nombre propuesto para ${track.filename} no es valido.`);
      }

      const originalPath = path.resolve(track.path);
      const targetPath = path.join(path.dirname(originalPath), sanitized.newName);
      assertSameParentDirectory(originalPath, targetPath);
      return { trackId: track.id, originalPath, targetPath };
    });

    if (toApply.length === 0) return { applied: 0, backupPath: '' };

    await assertRenameTargetsAvailable(toApply);
    const backupPath = await createBackup(
      toApply.map((item) => item.originalPath),
      getBackupRoot(),
    );
    const applied: typeof toApply = [];
    try {
      for (const item of toApply) {
        await fs.rename(item.originalPath, item.targetPath);
        applied.push(item);
      }
      updateTrackPaths(toApply);
    } catch (error) {
      const rollbackErrors = await rollbackRenames(applied);
      if (rollbackErrors.length > 0) {
        logger.error('Safe rename rollback failed', { sessionId: safeSessionId, rollbackErrors });
      }
      throw new Error(`No se pudo completar el renombrado. ${getErrorMessage(error)}`, { cause: error });
    }
    logger.info('Safe rename applied', { sessionId: safeSessionId, applied: applied.length, backupPath });
    return { applied: applied.length, backupPath };
  });

  handleIpc(
    'converter:preview',
    async (_e, source: ConversionSource, targetFormat: ConversionTargetFormat, outputDirectory: string) => {
      const safeSource = await normalizeConversionSource(source);
      const safeTarget = conversionTargetSchema.parse(targetFormat);
      const safeOutput = await normalizeConversionOutput(outputDirectory);
      const plan = await buildConversionPlan(safeSource, safeTarget, safeOutput);
      rememberConversionPlan(plan);
      return plan;
    },
  );

  handleIpc('converter:start', async (event, plan: ConversionPlan) => {
    const planId = z.string().uuid().parse(plan?.id);
    const trustedPlan = preparedConversionPlans.get(planId);
    if (!trustedPlan) throw new Error('La vista previa ya no es valida. Preparala nuevamente.');
    preparedConversionPlans.delete(planId);
    const win = BrowserWindow.fromWebContents(event.sender);
    return startConversionPlan(trustedPlan, (progress) => {
      win?.webContents.send('converter:progress', progress);
    });
  });

  handleIpc('converter:cancel', async (_e, jobId: string) => {
    cancelConversion(z.string().uuid().parse(jobId));
  });
}

interface SafeRenameRequest {
  originalPath: string;
  newName: string;
}

interface SafeRenameOperation {
  trackId: string;
  originalPath: string;
  targetPath: string;
}

function parseRenameRequests(value: unknown, tracks: Track[]): SafeRenameRequest[] {
  if (!Array.isArray(value) || value.length === 0) {
    return tracks
      .map((track) => ({ ...sanitizeFilename(track.filename), originalPath: track.path }))
      .filter((preview) => preview.hasChanges)
      .map((preview) => ({ originalPath: preview.originalPath, newName: preview.newName }));
  }

  return z.array(z.object({
    originalPath: absolutePathSchema,
    newName: z.string().trim().min(1).max(255).refine(
      (name) => name === path.basename(name),
      'El nombre nuevo no puede contener carpetas.',
    ),
  })).max(100_000).parse(value);
}

function assertSameParentDirectory(originalPath: string, targetPath: string): void {
  if (normalizePathKey(path.dirname(originalPath)) !== normalizePathKey(path.dirname(targetPath))) {
    throw new Error('El renombrado no puede mover archivos a otra carpeta.');
  }
}

async function assertRenameTargetsAvailable(operations: SafeRenameOperation[]): Promise<void> {
  const targets = new Set<string>();
  for (const operation of operations) {
    const targetKey = normalizePathKey(operation.targetPath);
    if (targets.has(targetKey)) {
      throw new Error(`Mas de un archivo produciria ${path.basename(operation.targetPath)}.`);
    }
    targets.add(targetKey);

    if (targetKey !== normalizePathKey(operation.originalPath) && await pathExists(operation.targetPath)) {
      throw new Error(`Ya existe ${operation.targetPath}.`);
    }
  }
}

async function rollbackRenames(operations: SafeRenameOperation[]): Promise<string[]> {
  const errors: string[] = [];
  for (const operation of [...operations].reverse()) {
    try {
      await fs.rename(operation.targetPath, operation.originalPath);
    } catch (error) {
      errors.push(`${operation.targetPath}: ${getErrorMessage(error)}`);
    }
  }
  return errors;
}

async function normalizeConversionSource(value: unknown): Promise<ConversionSource> {
  const parsed = z.object({
    type: z.enum(['files', 'folder']),
    paths: z.array(absolutePathSchema).min(1).max(100_000),
    rootPath: absolutePathSchema.optional(),
  }).parse(value);

  if (parsed.type === 'files') {
    const paths = parsed.paths.map((filePath) => path.resolve(filePath));
    for (const filePath of paths) {
      if (!approvedConversionFiles.has(normalizePathKey(filePath))) {
        throw new Error('Uno de los archivos no fue seleccionado mediante GigReady.');
      }
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) throw new Error(`${path.basename(filePath)} no es un archivo.`);
    }
    return { type: 'files', paths };
  }

  const rootPath = path.resolve(parsed.rootPath || parsed.paths[0]);
  if (!approvedConversionFolders.has(normalizePathKey(rootPath))) {
    throw new Error('La carpeta de origen no fue seleccionada mediante GigReady.');
  }
  const stats = await fs.stat(rootPath);
  if (!stats.isDirectory()) throw new Error('El origen de conversion no es una carpeta.');
  return { type: 'folder', paths: [rootPath], rootPath };
}

async function normalizeConversionOutput(value: unknown): Promise<string> {
  const outputDirectory = path.resolve(absolutePathSchema.parse(value));
  if (!approvedConversionOutputs.has(normalizePathKey(outputDirectory))) {
    throw new Error('La carpeta de salida no fue seleccionada mediante GigReady.');
  }
  const stats = await fs.stat(outputDirectory);
  if (!stats.isDirectory()) throw new Error('La salida de conversion no es una carpeta.');
  return outputDirectory;
}

function rememberConversionPlan(plan: ConversionPlan): void {
  preparedConversionPlans.set(plan.id, plan);
  while (preparedConversionPlans.size > 20) {
    const oldestPlanId = preparedConversionPlans.keys().next().value;
    if (!oldestPlanId) break;
    preparedConversionPlans.delete(oldestPlanId);
  }
}

function grantOpenPath(filePath: string): void {
  approvedOpenPaths.add(normalizePathKey(filePath));
}

function getBackupRoot(): string {
  return path.join(app.getPath('documents'), 'GigReady Backups');
}

function normalizePathKey(filePath: string): string {
  const normalized = path.resolve(filePath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido.';
}

function normalizeSettingsInput(value: unknown): ScanSettings {
  const defaults = getDefaultSettings();
  const parsed = z.object({
    analysisEngine: z.enum(['standard', 'advanced_internal']).optional(),
    compatibilityProfile: z.enum(['general', 'rekordbox_cdj']).optional(),
    minMp3Bitrate: z.number().finite().min(32).max(1_536).optional(),
    minDurationSeconds: z.number().finite().min(0).max(86_400).optional(),
    maxPathLength: z.number().finite().int().min(32).max(32_767).optional(),
    concurrency: z.number().finite().int().min(1).max(16).optional(),
    advancedAnalysisConcurrency: z.number().finite().int().min(1).max(4).optional(),
    minCueConfidence: z.number().finite().min(0.1).max(0.95).optional(),
    energyRatingProfile: z.enum([
      'auto', 'general', 'house_tech_house', 'techno', 'trance_melodic',
      'psytrance', 'minimal', 'drum_bass', 'reggaeton_latin', 'hip_hop_trap',
      'downtempo_warmup',
    ]).optional(),
    acceptedFormats: z.array(z.enum(['.mp3', '.wav', '.aiff', '.aif', '.flac', '.m4a', '.aac', '.ogg']))
      .min(1).max(8).optional(),
    problematicChars: z.string().max(100).optional(),
  }).parse(value ?? {});

  return {
    ...defaults,
    ...parsed,
    mode: 'complete',
    includeSubfolders: true,
    calculateHashes: true,
    validateWithFfprobe: true,
    analyzeCues: true,
  };
}

function normalizeCleanFolderOptions(options: Partial<CleanFolderOptions> = {}): CleanFolderOptions {
  return {
    folderName: options.folderName || 'GigReady Clean',
    safeRename: options.safeRename !== false,
    organization: options.organization || 'preserve',
    includeWarnings: options.includeWarnings !== false,
    excludeExactDuplicates: options.excludeExactDuplicates !== false,
    includeCsv: Boolean(options.includeCsv),
    includeHtml: Boolean(options.includeHtml),
    includeM3u: options.includeM3u !== false,
    includeRekordboxXml: Boolean(options.includeRekordboxXml),
    includeSupportData: Boolean(options.includeSupportData),
  };
}

function buildCleanFolderPlan(
  tracks: Track[],
  duplicateGroups: any[],
  optionsInput: Partial<CleanFolderOptions>,
): { preview: CleanFolderPreview; tracks: Track[]; files: CleanFolderFile[] } {
  const options = normalizeCleanFolderOptions(optionsInput);
  const excludedDuplicateIds = getExactDuplicateExclusions(duplicateGroups, options.excludeExactDuplicates);
  const sampleRenames = tracks
    .map((track) => ({ ...sanitizeFilename(track.filename), originalPath: track.path }))
    .filter((preview) => preview.hasChanges)
    .slice(0, 25);

  const includedTracks = tracks.filter((track) => {
    if (track.analysisStatus !== 'completed') return false;
    if (track.riskLevel === 'critical') return false;
    if (!options.includeWarnings && track.riskLevel === 'warning') return false;
    if (excludedDuplicateIds.has(track.id)) return false;
    return true;
  });

  const files = includedTracks.map((track) => {
    const rename = options.safeRename ? sanitizeFilename(track.filename) : null;
    const filename = rename?.hasChanges ? rename.newName : track.filename;
    const relativePath = buildRelativePath(track, filename, options.organization);
    return {
      sourcePath: track.path,
      newFilename: filename,
      relativePath,
    };
  });

  const preview: CleanFolderPreview = {
    totalTracks: tracks.length,
    includedTracks: includedTracks.length,
    excludedCritical: tracks.filter((track) => track.riskLevel === 'critical' || track.analysisStatus !== 'completed').length,
    excludedWarnings: options.includeWarnings ? 0 : tracks.filter((track) => track.riskLevel === 'warning').length,
    excludedDuplicates: excludedDuplicateIds.size,
    renameCount: tracks.filter((track) => sanitizeFilename(track.filename).hasChanges).length,
    totalSizeBytes: includedTracks.reduce((sum, track) => sum + track.fileSize, 0),
    sampleRenames,
  };

  return { preview, tracks: includedTracks, files };
}

function rebaseTracksToCopiedFiles(
  tracks: Track[],
  copiedFiles: Array<{ sourcePath: string; destPath: string }>,
): Track[] {
  const copiedBySourcePath = new Map(copiedFiles.map((file) => [file.sourcePath, file.destPath]));

  return tracks
    .map((track) => {
      const copiedPath = copiedBySourcePath.get(track.path);
      if (!copiedPath) return null;
      return {
        ...track,
        path: copiedPath,
        filename: path.basename(copiedPath),
        extension: path.extname(copiedPath).toLowerCase(),
        directory: path.dirname(copiedPath),
      };
    })
    .filter((track): track is Track => track !== null);
}

function getExactDuplicateExclusions(duplicateGroups: any[], excludeExactDuplicates: boolean): Set<string> {
  const excluded = new Set<string>();
  if (!excludeExactDuplicates) return excluded;

  for (const group of duplicateGroups) {
    if (group.type !== 'exact' || !Array.isArray(group.tracks) || group.tracks.length < 2) continue;
    const sorted = [...group.tracks].sort((a, b) => {
      const bitrateDiff = (b.bitrate || 0) - (a.bitrate || 0);
      if (bitrateDiff !== 0) return bitrateDiff;
      return (b.fileSize || 0) - (a.fileSize || 0);
    });
    for (const duplicate of sorted.slice(1)) {
      if (duplicate.id) excluded.add(duplicate.id);
    }
  }

  return excluded;
}

function buildRelativePath(track: Track, filename: string, organization: CleanFolderOptions['organization']): string | undefined {
  if (organization === 'preserve') return undefined;
  if (organization === 'flat') return filename;
  if (organization === 'artist') return path.join(sanitizePathSegment(track.artist || 'Sin artista'), filename);
  if (organization === 'genre') return path.join(sanitizePathSegment(track.genre || 'Sin genero'), filename);
  return undefined;
}

function sanitizePathSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
    .slice(0, 80) || 'Sin nombre';
}

async function pickSaveFile(win: BrowserWindow, defaultName: string, filters: any[]): Promise<string | null> {
  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters,
  });
  return result.canceled ? null : result.filePath || null;
}

function rejectDirectExportPath(outputPath: unknown): void {
  if (outputPath !== undefined && outputPath !== '') {
    throw new Error('Por seguridad, selecciona el destino desde el dialogo de GigReady.');
  }
}

function getDefaultSettings(): ScanSettings {
  return {
    mode: 'complete',
    includeSubfolders: true,
    calculateHashes: true,
    validateWithFfprobe: true,
    analyzeCues: true,
    analysisEngine: 'standard',
    compatibilityProfile: 'general',
    minMp3Bitrate: 192,
    minDurationSeconds: 45,
    maxPathLength: 250,
    concurrency: 4,
    advancedAnalysisConcurrency: 2,
    minCueConfidence: 0.35,
    energyRatingProfile: 'auto',
    acceptedFormats: ['.mp3', '.wav', '.aiff', '.aif', '.flac', '.m4a', '.aac', '.ogg'],
    problematicChars: '<>:"/\\|?*',
  };
}
