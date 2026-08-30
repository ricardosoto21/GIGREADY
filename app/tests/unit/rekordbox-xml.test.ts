import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { generateRekordboxXML } from '../../backend/rekordbox/rekordbox-xml';
import type { Track, SuggestedCue } from '../../src/types';

function makeTrack(id: string, overrides: Partial<Track> = {}): Track {
  return {
    id,
    path: `C:\\Music\\track-${id}.mp3`,
    filename: `track-${id}.mp3`,
    extension: '.mp3',
    directory: 'C:\\Music',
    fileSize: 1000000,
    modifiedAt: new Date().toISOString(),
    hasArtwork: false,
    ffprobeValid: true,
    riskLevel: 'ok',
    issues: [],
    suggestedCues: [],
    approvedCues: [],
    analysisStatus: 'completed',
    duration: 300,
    bpm: 128,
    ...overrides,
  };
}

function makeCue(id: string, type: any, time: number, status: any): SuggestedCue {
  return {
    id,
    trackId: 't1',
    type,
    timeSeconds: time,
    label: `Cue ${id}`,
    source: 'manual',
    status,
    color: '#ff0000',
  };
}

describe('Rekordbox XML Generator', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gigready-rekordbox-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('generates valid XML with approved cues', async () => {
    const track = makeTrack('1', {
      approvedCues: [
        makeCue('c1', 'INTRO', 0, 'approved'),
        makeCue('c2', 'DROP', 120, 'approved'),
      ],
    });

    const outputPath = path.join(tempDir, 'output.xml');
    await generateRekordboxXML([track], outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<DJ_PLAYLISTS Version="1.0.0">');
    expect(content).toContain('POSITION_MARK');
    expect(content).toContain('Name="Cue c1"');
    expect(content).toContain('Start="0.000"');
    expect(content).toContain('Num="-1"');
    expect(content).toContain('Name="Cue c2"');
    expect(content).toContain('Start="120.000"');
    expect(content).not.toContain('Num="0"');
    expect(content).not.toContain('Red=');
    expect(content).not.toContain('Green=');
    expect(content).not.toContain('Blue=');
  });

  it('exports all approved cues as memory cues, not hot cues', async () => {
    const track = makeTrack('1', {
      approvedCues: [
        makeCue('c1', 'INTRO', 0, 'approved'),
        makeCue('c2', 'MIX_IN', 32, 'approved'),
        makeCue('c3', 'DROP', 96, 'approved'),
      ],
    });

    const outputPath = path.join(tempDir, 'output.xml');
    await generateRekordboxXML([track], outputPath);
    const content = await fs.readFile(outputPath, 'utf-8');
    const positionMarks = content.match(/<POSITION_MARK[^>]+>/g) ?? [];

    expect(positionMarks).toHaveLength(3);
    expect(positionMarks.every((mark) => mark.includes('Type="0"'))).toBe(true);
    expect(positionMarks.every((mark) => mark.includes('Num="-1"'))).toBe(true);
  });

  it('excludes non-approved cues', async () => {
     // Note: rekordbox-xml.ts currently uses track.approvedCues directly.
     // In our data-access layer, we separate suggestedCues and approvedCues.
     const track = makeTrack('1', {
        suggestedCues: [makeCue('c1', 'INTRO', 0, 'suggested')],
        approvedCues: [],
     });

     const outputPath = path.join(tempDir, 'output.xml');
     await generateRekordboxXML([track], outputPath);
     const content = await fs.readFile(outputPath, 'utf-8');
     expect(content).not.toContain('POSITION_MARK');
  });

  it('correctly encodes Windows paths with spaces and special characters', async () => {
    const track = makeTrack('1', {
      path: 'C:\\Music\\DJs & Producers\\Track #1! [2024].mp3',
    });

    const outputPath = path.join(tempDir, 'output.xml');
    await generateRekordboxXML([track], outputPath);
    const content = await fs.readFile(outputPath, 'utf-8');
    
    // Rekordbox expects file://localhost/C:/...
    // encodeURIComponent handles #, !, &, etc.
    expect(content).toContain('Location="file://localhost/C:/Music/DJs%20%26%20Producers/Track%20%231%21%20%5B2024%5D.mp3"');
  });

  it('includes basic metadata', async () => {
    const track = makeTrack('1', {
      artist: 'Artist Name',
      title: 'Track Title',
      bpm: 124.5,
      key: '4A',
      energyRating: 4,
    });

    const outputPath = path.join(tempDir, 'output.xml');
    await generateRekordboxXML([track], outputPath);
    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('Artist="Artist Name"');
    expect(content).toContain('Name="Track Title"');
    expect(content).toContain('AverageBpm="124.50"');
    expect(content).toContain('Tonality="4A"');
    expect(content).toContain('Rating="204"');
  });

  it('excludes critical tracks from collection and playlist', async () => {
    const okTrack = makeTrack('1', { riskLevel: 'ok' });
    const badTrack = makeTrack('2', { riskLevel: 'critical' });

    const outputPath = path.join(tempDir, 'output.xml');
    await generateRekordboxXML([okTrack, badTrack], outputPath);
    const content = await fs.readFile(outputPath, 'utf-8');
    
    expect(content).toContain('track-1.mp3');
    expect(content).not.toContain('track-2.mp3');
    expect(content).toContain('Entries="1"');
  });
});
