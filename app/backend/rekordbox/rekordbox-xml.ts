import * as fs from 'fs/promises';
import type { Track } from '../../src/types';
import { rekordboxRatingValue } from '../audio/energy-rating';

/**
 * Generate a Rekordbox-compatible XML file.
 * This XML can be imported via Rekordbox's "Import > rekordbox xml" feature.
 */
export async function generateRekordboxXML(
  tracks: Track[],
  outputPath: string,
  playlistName: string = 'GigReady',
): Promise<void> {
  const validTracks = tracks.filter((t) => t.riskLevel !== 'critical' && t.analysisStatus === 'completed');
  
  const trackEntries = validTracks.map((track, index) => {
    const trackId = index + 1;
    const locationUrl = pathToFileUrl(track.path);
    const totalTime = track.duration ? Math.round(track.duration) : 0;
    const bpm = track.bpm ? track.bpm.toFixed(2) : '0.00';
    const bitRate = track.bitrate || 0;
    const sampleRate = track.sampleRate || 44100;
    const rating = rekordboxRatingValue(track.energyRating);
    
    // Get approved cues only
    const cues = track.approvedCues
      .filter((cue) => cue.status === 'approved')
      .sort((a, b) => a.timeSeconds - b.timeSeconds);
    
    const cueEntries = cues.map((cue) => {
      return `      <POSITION_MARK Name="${escapeXml(cue.label)}" Type="0" Start="${formatCueStart(cue.timeSeconds)}" Num="-1"/>`;
    }).join('\n');

    return `    <TRACK TrackID="${trackId}" Name="${escapeXml(track.title || track.filename)}" Artist="${escapeXml(track.artist || '')}" Album="${escapeXml(track.album || '')}" Genre="${escapeXml(track.genre || '')}" Kind="${getKindString(track.extension)}" Size="${track.fileSize}" TotalTime="${totalTime}" AverageBpm="${bpm}" BitRate="${bitRate}" SampleRate="${sampleRate}" Rating="${rating}" Location="${escapeXml(locationUrl)}" Comments="${escapeXml('GigReady')}" Tonality="${escapeXml(track.key || '')}">
${cueEntries}
    </TRACK>`;
  });

  // Playlist entries
  const playlistEntries = validTracks.map((_, index) => {
    return `        <TRACK Key="${index + 1}"/>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <PRODUCT Name="GigReady" Version="1.2.0-beta.1" Company="GigReady"/>
  <COLLECTION Entries="${validTracks.length}">
${trackEntries.join('\n')}
  </COLLECTION>
  <PLAYLISTS>
    <NODE Type="0" Name="ROOT" Count="1">
      <NODE Name="${escapeXml(playlistName)}" Type="1" KeyType="0" Entries="${validTracks.length}">
${playlistEntries}
      </NODE>
    </NODE>
  </PLAYLISTS>
</DJ_PLAYLISTS>`;

  await fs.writeFile(outputPath, xml, 'utf-8');
}

/**
 * Convert a local file path to a file:// URL with proper encoding for Rekordbox.
 * Handles Windows paths (C:\) and special characters.
 */
function pathToFileUrl(filePath: string): string {
  let normalized = filePath.replace(/\\/g, '/');
  
  // Rekordbox XML on Windows expects file://localhost/C:/...
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  // Encode URI but keep the leading / and colons for Windows drive letters
  const encoded = normalized.split('/').map((segment) => encodePathSegment(segment)).join('/');

  return 'file://localhost' + encoded;
}

function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment)
    .replace(/%3A/gi, ':')
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Get the "Kind" string for Rekordbox based on file extension.
 */
function getKindString(extension: string): string {
  const kinds: Record<string, string> = {
    '.mp3': 'MP3 File',
    '.wav': 'WAV File',
    '.aiff': 'AIFF File',
    '.aif': 'AIFF File',
    '.flac': 'FLAC File',
    '.m4a': 'M4A File',
    '.aac': 'AAC File',
    '.ogg': 'OGG File',
  };
  return kinds[extension.toLowerCase()] || 'Audio File';
}

function formatCueStart(timeSeconds: number): string {
  return Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds).toFixed(3) : '0.000';
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
