import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface CleanFolderFile {
  sourcePath: string;
  newFilename?: string;
  relativePath?: string;
}

export interface CleanFolderCopyResult {
  copied: number;
  failed: number;
  errors: string[];
  copiedFiles: Array<{
    sourcePath: string;
    destPath: string;
  }>;
}

/**
 * Create a timestamped backup folder and copy specified files.
 */
export async function createBackup(
  files: string[],
  backupRoot?: string,
): Promise<string> {
  if (files.length === 0) {
    throw new Error('No hay archivos para respaldar.');
  }

  const resolvedFiles = files.map((file) => path.resolve(file));
  const commonRoot = findCommonRoot(resolvedFiles);
  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '');
  
  const backupDir = backupRoot || path.join(process.cwd(), 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = await fs.mkdtemp(path.join(backupDir, `GigReady_Backup_${timestamp}_`));

  // Copy files preserving relative structure from common root. The backup is
  // all-or-nothing: callers must never mutate originals after a partial copy.
  try {
    for (const file of resolvedFiles) {
      const relativePath = path.relative(commonRoot, file);
      const destPath = path.join(backupPath, relativePath);
      assertPathInside(backupPath, destPath);
      const destDir = path.dirname(destPath);

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      await fs.copyFile(file, destPath);
      const [sourceStats, destinationStats] = await Promise.all([
        fs.stat(file),
        fs.stat(destPath),
      ]);
      if (sourceStats.size !== destinationStats.size) {
        throw new Error(`La copia de ${path.basename(file)} no coincide con el original.`);
      }
    }
  } catch (error) {
    await fs.rm(backupPath, { recursive: true, force: true });
    const message = error instanceof Error ? error.message : 'Error desconocido.';
    throw new Error(
      `No se pudo completar el respaldo. No se modifico ningun original. ${message}`,
      { cause: error },
    );
  }

  return backupPath;
}

/**
 * Create a clean folder by copying only valid files.
 */
export async function createCleanFolder(
  files: CleanFolderFile[],
  outputDir: string,
  flatStructure: boolean = false,
  commonRoot?: string,
): Promise<CleanFolderCopyResult> {
  const result: CleanFolderCopyResult = { copied: 0, failed: 0, errors: [], copiedFiles: [] };

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const file of files) {
    try {
      let destPath: string;

      if (file.relativePath) {
        destPath = path.join(outputDir, file.relativePath);
      } else if (flatStructure) {
        const filename = file.newFilename || path.basename(file.sourcePath);
        destPath = path.join(outputDir, filename);
      } else {
        const root = commonRoot || findCommonRoot(files.map((f) => f.sourcePath));
        const relativePath = path.relative(root, file.sourcePath);
        if (file.newFilename) {
          destPath = path.join(outputDir, path.dirname(relativePath), file.newFilename);
        } else {
          destPath = path.join(outputDir, relativePath);
        }
      }

      assertPathInside(outputDir, destPath);

      // Handle filename conflicts
      destPath = await resolveConflict(destPath);

      const destDir = path.dirname(destPath);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }

      await fs.copyFile(file.sourcePath, destPath);
      result.copied++;
      result.copiedFiles.push({ sourcePath: file.sourcePath, destPath });
    } catch (err: any) {
      result.failed++;
      result.errors.push(`${file.sourcePath}: ${err.message}`);
    }
  }

  return result;
}

function findCommonRoot(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return path.dirname(paths[0]);

  const roots = new Set(paths.map((filePath) => path.parse(filePath).root.toLowerCase()));
  if (roots.size !== 1) {
    throw new Error('El respaldo no admite archivos ubicados en unidades diferentes.');
  }

  let commonRoot = path.dirname(paths[0]);
  while (!paths.every((filePath) => isPathInside(commonRoot, filePath))) {
    const parent = path.dirname(commonRoot);
    if (parent === commonRoot) {
      throw new Error('No se pudo determinar una raiz comun segura para el respaldo.');
    }
    commonRoot = parent;
  }

  return commonRoot;
}

function isPathInside(rootPath: string, candidatePath: string): boolean {
  const relative = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertPathInside(rootPath: string, candidatePath: string): void {
  if (!isPathInside(rootPath, candidatePath)) {
    throw new Error('La ruta de respaldo calculada no es segura.');
  }
}

async function resolveConflict(filePath: string): Promise<string> {
  if (!existsSync(filePath)) return filePath;
  
  const ext = path.extname(filePath);
  const base = filePath.substring(0, filePath.length - ext.length);
  let counter = 1;
  let newPath = `${base}_${counter}${ext}`;
  
  while (existsSync(newPath)) {
    counter++;
    newPath = `${base}_${counter}${ext}`;
  }
  
  return newPath;
}
