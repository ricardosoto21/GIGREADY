import { v4 as uuidv4 } from 'uuid';
import type { Track } from '../../src/types';

interface DuplicateGroup {
  groupId: string;
  type: 'exact' | 'probable';
  confidence: number;
  trackIds: string[];
  recommendation?: string;
}

/**
 * Detect exact duplicates by SHA256 hash.
 */
export function detectExactDuplicates(tracks: Track[]): DuplicateGroup[] {
  const hashMap = new Map<string, string[]>();
  
  for (const track of tracks) {
    if (track.sha256) {
      const existing = hashMap.get(track.sha256) || [];
      existing.push(track.id);
      hashMap.set(track.sha256, existing);
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const trackIds of hashMap.values()) {
    if (trackIds.length > 1) {
      groups.push({
        groupId: uuidv4(),
        type: 'exact',
        confidence: 1.0,
        trackIds,
        recommendation: 'Estos archivos son idénticos. Conserva el que prefieras y excluye los demás de la carpeta limpia.',
      });
    }
  }

  return groups;
}

/**
 * Detect probable duplicates by fuzzy matching of artist, title, duration, and filename.
 */
export function detectProbableDuplicates(tracks: Track[], threshold: number = 0.75): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < tracks.length; i++) {
    if (processed.has(tracks[i].id)) continue;
    
    const group: string[] = [tracks[i].id];
    
    for (let j = i + 1; j < tracks.length; j++) {
      if (processed.has(tracks[j].id)) continue;
      
      const similarity = calculateSimilarity(tracks[i], tracks[j]);
      if (similarity >= threshold) {
        group.push(tracks[j].id);
        processed.add(tracks[j].id);
      }
    }

    if (group.length > 1) {
      processed.add(tracks[i].id);
      groups.push({
        groupId: uuidv4(),
        type: 'probable',
        confidence: 0.8,
        trackIds: group,
        recommendation: 'Estos archivos parecen ser versiones del mismo track. Revisa cuál tiene mejor calidad.',
      });
    }
  }

  return groups;
}

/**
 * Calculate similarity between two tracks (0-1).
 */
function calculateSimilarity(a: Track, b: Track): number {
  let score = 0;
  let factors = 0;

  // Artist similarity (weight: 3)
  if (a.artist && b.artist) {
    const artistSim = stringSimilarity(normalize(a.artist), normalize(b.artist));
    score += artistSim * 3;
    factors += 3;
  }

  // Title similarity (weight: 3)
  if (a.title && b.title) {
    const titleSim = stringSimilarity(normalize(a.title), normalize(b.title));
    score += titleSim * 3;
    factors += 3;
  }

  // Duration similarity (weight: 2) - within 5 seconds
  if (a.duration && b.duration) {
    const durationDiff = Math.abs(a.duration - b.duration);
    const durationSim = durationDiff < 5 ? 1 : durationDiff < 15 ? 0.5 : 0;
    score += durationSim * 2;
    factors += 2;
  }

  // Filename similarity (weight: 2)
  const filenameSim = stringSimilarity(
    normalize(stripExtension(a.filename)),
    normalize(stripExtension(b.filename))
  );
  score += filenameSim * 2;
  factors += 2;

  // File size similarity (weight: 1) - within 10%
  if (a.fileSize && b.fileSize) {
    const ratio = Math.min(a.fileSize, b.fileSize) / Math.max(a.fileSize, b.fileSize);
    score += (ratio > 0.9 ? 1 : ratio > 0.7 ? 0.5 : 0) * 1;
    factors += 1;
  }

  return factors > 0 ? score / factors : 0;
}

/**
 * Simple string similarity using Dice coefficient.
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.substring(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }

  let intersections = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2);
    const count = bigrams.get(bigram) || 0;
    if (count > 0) {
      bigrams.set(bigram, count - 1);
      intersections++;
    }
  }

  return (2.0 * intersections) / (a.length + b.length - 2);
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stripExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}
