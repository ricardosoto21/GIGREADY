import { contextBridge, ipcRenderer } from 'electron';

/**
 * GigReady Preload API
 * Exposes a safe, typed API to the renderer process via contextBridge.
 * All communication goes through IPC channels.
 */
export const gigreadyAPI = {
  // ── Dialog ──
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-folder'),

  // ── Scan ──
  startScan: (rootPath: string, settings: any): Promise<string> =>
    ipcRenderer.invoke('scan:start', rootPath, settings),
  cancelScan: (sessionId: string): Promise<void> =>
    ipcRenderer.invoke('scan:cancel', sessionId),
  onScanProgress: (callback: (progress: any) => void) => {
    const handler = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('scan:progress', handler);
    return () => ipcRenderer.removeListener('scan:progress', handler);
  },
  onScanComplete: (callback: (result: any) => void) => {
    const handler = (_event: any, result: any) => callback(result);
    ipcRenderer.on('scan:complete', handler);
    return () => ipcRenderer.removeListener('scan:complete', handler);
  },
  onScanError: (callback: (error: any) => void) => {
    const handler = (_event: any, error: any) => callback(error);
    ipcRenderer.on('scan:error', handler);
    return () => ipcRenderer.removeListener('scan:error', handler);
  },

  // ── Data ──
  getTracks: (sessionId: string, options?: any): Promise<any[]> =>
    ipcRenderer.invoke('data:get-tracks', sessionId, options),
  getTrack: (trackId: string): Promise<any> =>
    ipcRenderer.invoke('data:get-track', trackId),
  getSession: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('data:get-session', sessionId),
  getSessions: (): Promise<any[]> =>
    ipcRenderer.invoke('data:get-sessions'),
  getDashboard: (sessionId: string): Promise<any> =>
    ipcRenderer.invoke('data:get-dashboard', sessionId),
  getDuplicates: (sessionId: string): Promise<any[]> =>
    ipcRenderer.invoke('data:get-duplicates', sessionId),
  previewCleanFolder: (sessionId: string, options: any): Promise<any> =>
    ipcRenderer.invoke('clean-folder:preview', sessionId, options),
  getEnergyData: (trackId: string): Promise<any> =>
    ipcRenderer.invoke('data:get-energy', trackId),
  getMusicalAnalysis: (trackId: string): Promise<any> =>
    ipcRenderer.invoke('data:get-musical-analysis', trackId),
  getPlaybackUrl: (trackId: string): Promise<string> =>
    ipcRenderer.invoke('audio:get-playback-url', trackId),
  createPreviewClip: (trackId: string, startTimeSeconds: number, durationSeconds?: number): Promise<string> =>
    ipcRenderer.invoke('audio:create-preview-clip', trackId, startTimeSeconds, durationSeconds),

  // ── Cues ──
  updateCue: (cue: any): Promise<void> =>
    ipcRenderer.invoke('cues:update', cue),
  approveCue: (cueId: string): Promise<void> =>
    ipcRenderer.invoke('cues:approve', cueId),
  discardCue: (cueId: string): Promise<void> =>
    ipcRenderer.invoke('cues:discard', cueId),
  approveAllCues: (trackId: string): Promise<void> =>
    ipcRenderer.invoke('cues:approve-all', trackId),
  approveAllSessionCues: (sessionId: string): Promise<void> =>
    ipcRenderer.invoke('cues:approve-session-all', sessionId),

  // ── Export ──
  exportCSV: (sessionId: string, outputPath?: string): Promise<string> =>
    ipcRenderer.invoke('export:csv', sessionId, outputPath),
  exportHTML: (sessionId: string, outputPath?: string): Promise<string> =>
    ipcRenderer.invoke('export:html', sessionId, outputPath),
  exportPDF: (sessionId: string, outputPath?: string): Promise<string> =>
    ipcRenderer.invoke('export:pdf', sessionId, outputPath),
  exportM3U: (sessionId: string, outputPath?: string): Promise<string> =>
    ipcRenderer.invoke('export:m3u', sessionId, outputPath),
  exportRekordboxXML: (sessionId: string, outputPath?: string): Promise<string> =>
    ipcRenderer.invoke('export:rekordbox-xml', sessionId, outputPath),
  exportJSON: (sessionId: string, outputPath?: string): Promise<string> =>
    ipcRenderer.invoke('export:json', sessionId, outputPath),
  exportCleanFolder: (sessionId: string, options: any): Promise<any> =>
    ipcRenderer.invoke('export:clean-folder', sessionId, options),

  // ── Backup ──
  // ── Safe Rename ──
  previewRename: (sessionId: string): Promise<any[]> =>
    ipcRenderer.invoke('rename:preview', sessionId),
  applyRename: (sessionId: string, renames: any[], createBackup: boolean): Promise<any> =>
    ipcRenderer.invoke('rename:apply', sessionId, renames, createBackup),

  // ── Converter ──
  selectConversionFiles: (): Promise<string[]> =>
    ipcRenderer.invoke('converter:select-files'),
  selectConversionFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('converter:select-folder'),
  selectConversionOutputFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('converter:select-output-folder'),
  previewConversion: (source: any, targetFormat: string, outputDirectory: string): Promise<any> =>
    ipcRenderer.invoke('converter:preview', source, targetFormat, outputDirectory),
  startConversion: (plan: any): Promise<any> =>
    ipcRenderer.invoke('converter:start', plan),
  cancelConversion: (jobId: string): Promise<void> =>
    ipcRenderer.invoke('converter:cancel', jobId),
  onConversionProgress: (callback: (progress: any) => void) => {
    const handler = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('converter:progress', handler);
    return () => {
      ipcRenderer.removeListener('converter:progress', handler);
    };
  },

  // ── Settings ──
  getSettings: (): Promise<any> =>
    ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: any): Promise<void> =>
    ipcRenderer.invoke('settings:save', settings),

  // ── Logs ──
  getLogs: (count?: number): Promise<string[]> =>
    ipcRenderer.invoke('logs:get', count),

  // ── System ──
  getDrives: (): Promise<any[]> =>
    ipcRenderer.invoke('system:get-drives'),
  getDiskSpace: (drivePath: string): Promise<any> =>
    ipcRenderer.invoke('system:get-disk-space', drivePath),
  openPath: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('system:open-path', filePath),
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('system:get-version'),
};

// Expose to renderer
contextBridge.exposeInMainWorld('gigready', gigreadyAPI);
