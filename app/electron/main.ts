import { app, BrowserWindow, protocol } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { net, session } from 'electron';
import { pathToFileURL } from 'url';
import { registerIpcHandlers } from './ipc';
import { closeDatabase, ensureDatabase } from '../backend/database/database';
import { getTrack } from '../backend/database/data-access';
import { getPreviewFile } from '../backend/audio/media-preview-registry';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'gigready-media',
    privileges: {
      standard: true,
      secure: true,
      stream: true,
      supportFetchAPI: true,
    },
  },
]);

app.enableSandbox();

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'GigReady',
    backgroundColor: '#0a0a0f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const currentUrl = mainWindow?.webContents.getURL();
    if (!currentUrl || navigationUrl !== currentUrl) event.preventDefault();
  });
  mainWindow.webContents.on('will-attach-webview', (event) => event.preventDefault());

  // Show window when ready to avoid flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register IPC handlers
registerIpcHandlers();

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  registerMediaProtocol();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

export { mainWindow };

function registerMediaProtocol(): void {
  protocol.handle('gigready-media', async (request) => {
    try {
      const url = new URL(request.url);
      let filePath: string | undefined;

      if (url.hostname === 'track') {
        const trackId = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
        if (!trackId) throw new Error('Track no valido.');
        ensureDatabase(path.join(app.getPath('userData'), 'gigready.db'));
        filePath = getTrack(trackId)?.path;
      }

      if (url.hostname === 'preview') {
        const token = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
        filePath = token ? getPreviewFile(token) : undefined;
      }

      if (!filePath || !fs.existsSync(filePath)) {
        return new Response('Archivo no encontrado.', { status: 404 });
      }

      const headers = new Headers();
      const range = request.headers.get('range');
      if (range) headers.set('range', range);
      return net.fetch(pathToFileURL(filePath).toString(), { headers });
    } catch {
      return new Response('Solicitud no valida.', { status: 400 });
    }
  });
}
