/**
 * Filename sanitizer for safe renaming.
 * Handles emojis, tildes, special characters, multiple spaces, and long names.
 */

export interface RenamePreview {
  originalPath: string;
  originalName: string;
  newName: string;
  changes: string[];
  hasChanges: boolean;
}

/** Characters to remove or replace */
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

/** Map of accented characters to ASCII equivalents */
const ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a',
  'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
  'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
  'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o',
  'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
  'ñ': 'n', 'ç': 'c',
  'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A', 'Ã': 'A',
  'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E',
  'Í': 'I', 'Ì': 'I', 'Ï': 'I', 'Î': 'I',
  'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O', 'Õ': 'O',
  'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U',
  'Ñ': 'N', 'Ç': 'C',
};

/**
 * Sanitize a filename for maximum compatibility.
 * @param filename - Original filename (with extension)
 * @param stripAccents - Whether to replace accented chars with ASCII
 * @param maxLength - Maximum filename length (excluding extension)
 */
export function sanitizeFilename(
  filename: string,
  stripAccents: boolean = true,
  maxLength: number = 200,
): RenamePreview {
  const changes: string[] = [];
  const ext = getExtension(filename);
  let name = getNameWithoutExtension(filename);
  // Remove emojis
  const afterEmoji = name.replace(EMOJI_REGEX, '');
  if (afterEmoji !== name) {
    changes.push('Emojis eliminados');
    name = afterEmoji;
  }

  // Replace accented characters
  if (stripAccents) {
    let afterAccents = '';
    for (const char of name) {
      afterAccents += ACCENT_MAP[char] || char;
    }
    if (afterAccents !== name) {
      changes.push('Tildes y acentos reemplazados');
      name = afterAccents;
    }
  }

  // Replace problematic characters
  const beforeProblematic = name;
  name = name.replace(/[<>:"/\\|?*]/g, '_');
  if (name !== beforeProblematic) {
    changes.push('Caracteres problemáticos reemplazados');
  }

  const beforePunctuation = name;
  name = name.replace(/[!¡]+/g, '_');
  if (name !== beforePunctuation) {
    changes.push('Signos no recomendados reemplazados');
  }

  // Replace multiple spaces/underscores with single underscore. Single spaces in
  // otherwise clean names are left intact to avoid unnecessary renames.
  const beforeSpaces = name;
  if (changes.length > 0 || /[\s_]{2,}/.test(name)) {
    name = name.replace(/[\s_]+/g, '_');
  }
  if (name !== beforeSpaces) {
    changes.push('Espacios normalizados');
  }

  // Remove leading/trailing underscores and dots
  const beforeTrim = name;
  name = name.replace(/^[_.\s]+|[_.\s]+$/g, '');
  if (name !== beforeTrim) {
    changes.push('Caracteres iniciales/finales limpiados');
  }

  // Truncate if too long
  if (name.length > maxLength) {
    name = name.substring(0, maxLength);
    changes.push(`Nombre acortado a ${maxLength} caracteres`);
  }

  // Ensure name is not empty
  if (!name) {
    name = 'track_sin_nombre';
    changes.push('Nombre vacío reemplazado');
  }

  const newName = name + ext;
  return {
    originalPath: '',
    originalName: filename,
    newName,
    changes,
    hasChanges: newName !== filename,
  };
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot) : '';
}

function getNameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}
