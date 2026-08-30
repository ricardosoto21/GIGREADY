import * as fs from 'fs';
import * as path from 'path';

const FFMPEG_ENV_VAR = 'GIGREADY_FFMPEG_PATH';
const FFPROBE_ENV_VAR = 'GIGREADY_FFPROBE_PATH';
const PACKAGED_DIR = 'ffmpeg';
const VENDOR_DIR = path.join('vendor', 'ffmpeg', 'win-x64');

export function getFfmpegPath(): string {
  return resolveBinaryPath({
    binaryName: 'ffmpeg.exe',
    envVar: FFMPEG_ENV_VAR,
  });
}

export function getFfprobePath(): string {
  return resolveBinaryPath({
    binaryName: 'ffprobe.exe',
    envVar: FFPROBE_ENV_VAR,
  });
}

function resolveBinaryPath({ binaryName, envVar }: { binaryName: string; envVar: string }): string {
  const configuredPath = process.env[envVar]?.trim();
  if (configuredPath) {
    if (!fs.existsSync(configuredPath)) {
      throw new Error(`${binaryName} configurado no existe: ${configuredPath}`);
    }
    return configuredPath;
  }

  const resourcesPath = process.resourcesPath;
  if (resourcesPath) {
    const packagedPath = path.join(resourcesPath, PACKAGED_DIR, binaryName);
    if (fs.existsSync(packagedPath)) return packagedPath;
  }

  for (const candidate of getDevelopmentCandidates(binaryName)) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    `No se encontro ${binaryName}. Configura ${envVar} o verifica ${path.join(VENDOR_DIR, binaryName)}.`,
  );
}

function getDevelopmentCandidates(binaryName: string): string[] {
  return [
    path.resolve(process.cwd(), VENDOR_DIR, binaryName),
    path.resolve(__dirname, '..', '..', '..', VENDOR_DIR, binaryName),
  ];
}
