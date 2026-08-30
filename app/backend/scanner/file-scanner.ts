import fg from 'fast-glob';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

/** Files and folders to ignore during scanning */
const IGNORED_FILES = new Set([
  '.DS_Store', 'Thumbs.db', 'desktop.ini', 'Icon\r',
  '.Spotlight-V100', '.Trashes', '.fseventsd',
  '$RECYCLE.BIN', 'System Volume Information',
]);

const IGNORED_EXTENSIONS = new Set([
  '.tmp', '.temp', '.bak', '.log', '.db', '.ini',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',
  '.txt', '.nfo', '.cue', '.m3u', '.m3u8', '.pls',
  '.exe', '.dll', '.sys', '.zip', '.rar', '.7z',
]);

export interface ScanResult {
  audioFiles: string[];
  totalFiles: number;
  skippedFiles: number;
  errors: Array<{ path: string; error: string }>;
}

/**
 * Scan a directory for audio files.
 * @param rootPath - Root directory to scan
 * @param acceptedFormats - List of accepted audio extensions (e.g., ['.mp3', '.wav'])
 * @param includeSubfolders - Whether to scan subdirectories
 * @param onProgress - Callback for progress updates
 * @param signal - AbortSignal for cancellation
 */
export async function scanDirectory(
  rootPath: string,
  acceptedFormats: string[],
  includeSubfolders: boolean = true,
  onProgress?: (discovered: number) => void,
  signal?: AbortSignal,
): Promise<ScanResult> {
  const result: ScanResult = {
    audioFiles: [],
    totalFiles: 0,
    skippedFiles: 0,
    errors: [],
  };

  // Validate root path exists
  if (!existsSync(rootPath)) {
    throw new Error(`La ruta no existe: ${rootPath}`);
  }

  try {
    const stat = await fs.stat(rootPath);
    if (!stat.isDirectory()) {
      throw new Error(`La ruta no es una carpeta: ${rootPath}`);
    }
  } catch (error: any) {
    throw new Error(`No se puede acceder a la ruta: ${error.message}`, { cause: error });
  }

  // Normalize accepted formats to lowercase with dot prefix
  const formats = new Set(
    acceptedFormats.map((f) => (f.startsWith('.') ? f.toLowerCase() : `.${f.toLowerCase()}`))
  );

  // Build glob pattern
  const pattern = includeSubfolders ? '**/*' : '*';
  const normalizedRoot = rootPath.replace(/\\/g, '/');

  try {
    const entries = await fg(pattern, {
      cwd: normalizedRoot,
      absolute: true,
      onlyFiles: true,
      dot: false,
      followSymbolicLinks: false,
      suppressErrors: true,
    });

    for (const entry of entries) {
      // Check cancellation
      if (signal?.aborted) {
        break;
      }

      result.totalFiles++;

      const basename = path.basename(entry);
      const ext = path.extname(entry).toLowerCase();

      // Skip system/ignored files
      if (IGNORED_FILES.has(basename)) {
        result.skippedFiles++;
        continue;
      }

      // Skip ignored extensions
      if (IGNORED_EXTENSIONS.has(ext)) {
        result.skippedFiles++;
        continue;
      }

      // Skip hidden files (starting with .)
      if (basename.startsWith('.')) {
        result.skippedFiles++;
        continue;
      }

      // Check if it's an accepted audio format
      if (formats.has(ext)) {
        result.audioFiles.push(entry);
      } else {
        result.skippedFiles++;
      }

      // Report progress periodically
      if (onProgress && result.totalFiles % 50 === 0) {
        onProgress(result.audioFiles.length);
      }
    }
  } catch (err: any) {
    result.errors.push({ path: rootPath, error: err.message });
  }

  return result;
}
