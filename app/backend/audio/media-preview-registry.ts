import { randomUUID } from 'crypto';

const previewFiles = new Map<string, string>();

export function registerPreviewFile(filePath: string): string {
  const token = randomUUID();
  previewFiles.set(token, filePath);
  return token;
}

export function getPreviewFile(token: string): string | undefined {
  return previewFiles.get(token);
}
