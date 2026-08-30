// ----------------------------------------------------------------------
// GigReady - Core Type Definitions
// ----------------------------------------------------------------------

/** Risk severity levels for track issues */
export type Severity = 'info' | 'warning' | 'critical';

/** Overall risk level for a track */
export type RiskLevel = 'ok' | 'info' | 'warning' | 'critical';

/** Analysis status for a track */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

/** Scan session status */
export type ScanStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';

/** Scan analysis depth */
export type ScanMode = 'quick' | 'normal' | 'complete';

/** Musical analysis engine */
export type AnalysisEngine = 'standard' | 'advanced_internal';

/** Musical analysis quality */
export type MusicalAnalysisQuality = 'high' | 'medium' | 'low' | 'fallback' | 'failed';

/** Musical section labels */
export type MusicalSectionLabel =
  | 'INTRO'
  | 'GROOVE'
  | 'BREAK'
  | 'BUILD'
  | 'DROP'
  | 'OUTRO'
  | 'UNKNOWN';

/** Cue timing adjustment quality */
export type SnapQuality = 'phrase' | 'downbeat' | 'beat' | 'unsnapped';

/** Energy rating profile for DJ-oriented star ratings */
export type EnergyRatingProfile =
  | 'auto'
  | 'general'
  | 'house_tech_house'
  | 'techno'
  | 'trance_melodic'
  | 'psytrance'
  | 'minimal'
  | 'drum_bass'
  | 'reggaeton_latin'
  | 'hip_hop_trap'
  | 'downtempo_warmup';

/** Compatibility profile for validation rules */
export type CompatibilityProfile = 'general' | 'rekordbox_cdj' | 'local_archive' | 'custom';

/** Memory cue types for DJ mixing */
export type CueType =
  | 'INTRO'
  | 'FIRST_BEAT'
  | 'MIX_IN'
  | 'GROOVE_START'
  | 'BASS_IN'
  | 'BREAK'
  | 'BUILD_UP'
  | 'DROP'
  | 'MIX_OUT'
  | 'OUTRO';

/** Source of a cue suggestion */
export type CueSource = 'rule' | 'audio_analysis' | 'manual';

/** Status of a cue in the approval workflow */
export type CueStatus = 'suggested' | 'approved' | 'edited' | 'discarded';

/** Duplicate match type */
export type DuplicateType = 'exact' | 'probable';

/** Export job types */
export type ExportType = 'csv' | 'html' | 'pdf' | 'm3u' | 'rekordbox_xml' | 'clean_folder' | 'json';

/** Job status for async operations */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

/** Audio conversion output formats */
export type ConversionTargetFormat = 'mp3' | 'wav' | 'aiff';

/** Audio conversion source type */
export type ConversionSourceType = 'files' | 'folder';

/** Audio conversion item status */
export type ConversionItemStatus = 'ready' | 'converting' | 'completed' | 'failed' | 'skipped';

// ----------------------------------------------------------------------
// Track
// ----------------------------------------------------------------------

export interface Track {
  id: string;
  path: string;
  filename: string;
  extension: string;
  directory: string;
  artist?: string;
  title?: string;
  album?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  container?: string;
  fileSize: number;
  modifiedAt: string;
  createdAt?: string;
  sha256?: string;
  hasArtwork: boolean;
  ffprobeValid: boolean;
  riskLevel: RiskLevel;
  issues: TrackIssue[];
  duplicates?: DuplicateInfo[];
  suggestedCues: SuggestedCue[];
  approvedCues: SuggestedCue[];
  energyScore?: number;
  energyRating?: 1 | 2 | 3 | 4 | 5;
  energyRatingProfile?: EnergyRatingProfile;
  energyRatingConfidence?: number;
  energyRatingReason?: string;
  analysisStatus: AnalysisStatus;
  errorMessage?: string;
}

// ----------------------------------------------------------------------
// TrackIssue
// ----------------------------------------------------------------------

export interface TrackIssue {
  id: string;
  trackId: string;
  type: string;
  severity: Severity;
  message: string;
  recommendation?: string;
  technicalDetails?: string;
  canAutoFix: boolean;
}

// ----------------------------------------------------------------------
// SuggestedCue
// ----------------------------------------------------------------------

export interface SuggestedCue {
  id: string;
  trackId: string;
  type: CueType;
  timeSeconds: number;
  label: string;
  confidence?: number;
  source: CueSource;
  status: CueStatus;
  color?: string;
  snapQuality?: SnapQuality;
  reason?: string;
  analysisQuality?: MusicalAnalysisQuality;
}

// ----------------------------------------------------------------------
// ScanSession
// ----------------------------------------------------------------------

export interface ScanSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  rootPath: string;
  mode: ScanMode;
  totalFiles: number;
  audioFiles: number;
  completedFiles: number;
  failedFiles: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  duplicateExactCount: number;
  duplicateProbableCount: number;
  score: number;
  status: ScanStatus;
  settings: ScanSettings;
  durationMs?: number;
}

// ----------------------------------------------------------------------
// ScanSettings
// ----------------------------------------------------------------------

export interface ScanSettings {
  mode: ScanMode;
  includeSubfolders: boolean;
  calculateHashes: boolean;
  validateWithFfprobe: boolean;
  analyzeCues: boolean;
  analysisEngine: AnalysisEngine;
  compatibilityProfile: CompatibilityProfile;
  minMp3Bitrate: number;
  minDurationSeconds: number;
  maxPathLength: number;
  concurrency: number;
  advancedAnalysisConcurrency: number;
  minCueConfidence: number;
  energyRatingProfile: EnergyRatingProfile;
  acceptedFormats: string[];
  problematicChars: string;
}

// ----------------------------------------------------------------------
// DuplicateInfo
// ----------------------------------------------------------------------

export interface DuplicateInfo {
  groupId: string;
  type: DuplicateType;
  confidence: number;
  relatedTrackIds: string[];
  recommendation?: string;
}

// ----------------------------------------------------------------------
// ExportJob
// ----------------------------------------------------------------------

export interface ExportJob {
  id: string;
  type: ExportType;
  createdAt: string;
  outputPath: string;
  status: JobStatus;
  errorMessage?: string;
}

export interface RenamePreview {
  originalPath: string;
  originalName: string;
  newName: string;
  changes: string[];
  hasChanges: boolean;
}

export interface CleanFolderOptions {
  folderName: string;
  safeRename: boolean;
  organization: 'preserve' | 'flat' | 'artist' | 'genre';
  includeWarnings: boolean;
  excludeExactDuplicates: boolean;
  includeCsv: boolean;
  includeHtml: boolean;
  includeM3u: boolean;
  includeRekordboxXml: boolean;
  includeSupportData: boolean;
}

export interface CleanFolderPreview {
  totalTracks: number;
  includedTracks: number;
  excludedCritical: number;
  excludedWarnings: number;
  excludedDuplicates: number;
  renameCount: number;
  totalSizeBytes: number;
  sampleRenames: RenamePreview[];
}

export interface CleanFolderResult extends CleanFolderPreview {
  outputPath: string;
  copied: number;
  failed: number;
  errors: string[];
  reports: string[];
}

export interface ConversionSource {
  type: ConversionSourceType;
  paths: string[];
  rootPath?: string;
}

export interface ConversionItem {
  id: string;
  sourcePath: string;
  relativePath: string;
  filename: string;
  extension: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  targetFormat: ConversionTargetFormat;
  outputPath: string;
  status: ConversionItemStatus;
  errorMessage?: string;
}

export interface ConversionPlan {
  id: string;
  source: ConversionSource;
  targetFormat: ConversionTargetFormat;
  outputDirectory: string;
  totalFiles: number;
  items: ConversionItem[];
  createdAt: string;
}

export interface ConversionProgress {
  jobId: string;
  current: number;
  total: number;
  currentFile?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  message: string;
}

export interface ConversionResult {
  jobId: string;
  outputDirectory: string;
  converted: number;
  failed: number;
  cancelled: boolean;
  items: ConversionItem[];
  errors: string[];
}

// ----------------------------------------------------------------------
// Scan Progress (IPC)
// ----------------------------------------------------------------------

export interface ScanProgress {
  sessionId: string;
  phase: 'discovering' | 'analyzing' | 'duplicates' | 'cues' | 'finalizing';
  current: number;
  total: number;
  currentFile?: string;
  message: string;
}

// ----------------------------------------------------------------------
// Dashboard Summary
// ----------------------------------------------------------------------

export interface DashboardSummary {
  score: number;
  scoreLabel: string;
  totalTracks: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  duplicateExactCount: number;
  duplicateProbableCount: number;
  lowQualityCount: number;
  unreadableCount: number;
  suggestedCuesCount: number;
  approvedCuesCount: number;
  scanDurationMs: number;
}

// ----------------------------------------------------------------------
// Energy Data (for waveform/energy map)
// ----------------------------------------------------------------------

export interface EnergyData {
  trackId: string;
  sampleRate: number;
  hopSize: number;
  times?: number[];
  rmsEnergy: number[];
  lowEnergy: number[];
  onsets: number[];
  beats: number[];
  segments: EnergySegment[];
  analysisQuality?: MusicalAnalysisQuality;
}

export interface EnergySegment {
  startTime: number;
  endTime: number;
  avgEnergy: number;
  label?: string;
}

export interface MusicalAnalysisFeatures {
  times: number[];
  rmsEnergy: number[];
  lowEnergy: number[];
  onsetStrength: number[];
  spectralFlux?: number[];
}

export interface MusicalAnalysisSection {
  label: MusicalSectionLabel;
  startTime: number;
  endTime: number;
  confidence: number;
  avgEnergy?: number;
}

export interface MusicalAnalysisDiagnostics {
  analyzerVersion: string;
  warnings: string[];
  fallbackReason?: string;
  error?: string;
}

export interface MusicalAnalysis {
  trackId: string;
  engine: AnalysisEngine;
  quality: MusicalAnalysisQuality;
  bpm?: number;
  tempoConfidence: number;
  beats: number[];
  downbeats: number[];
  phraseBoundaries: number[];
  sections: MusicalAnalysisSection[];
  features: MusicalAnalysisFeatures;
  diagnostics: MusicalAnalysisDiagnostics;
}

// ----------------------------------------------------------------------
// App Navigation
// ----------------------------------------------------------------------

export type AppPage =
  | 'home'
  | 'folder-select'
  | 'scanning'
  | 'dashboard'
  | 'issues'
  | 'duplicates'
  | 'track-detail'
  | 'cue-assistant'
  | 'cue-editor'
  | 'converter'
  | 'export'
  | 'clean-folder'
  | 'history'
  | 'settings'
  | 'logs'
  | 'help';

// ----------------------------------------------------------------------
// IPC Channel Names
// ----------------------------------------------------------------------

export const IPC_CHANNELS = {
  // Dialog
  SELECT_FOLDER: 'dialog:select-folder',
  
  // Scan
  SCAN_START: 'scan:start',
  SCAN_CANCEL: 'scan:cancel',
  SCAN_PROGRESS: 'scan:progress',
  SCAN_COMPLETE: 'scan:complete',
  SCAN_ERROR: 'scan:error',
  
  // Data
  GET_TRACKS: 'data:get-tracks',
  GET_TRACK: 'data:get-track',
  GET_SESSION: 'data:get-session',
  GET_SESSIONS: 'data:get-sessions',
  GET_DASHBOARD: 'data:get-dashboard',
  GET_DUPLICATES: 'data:get-duplicates',
  GET_ENERGY: 'data:get-energy',
  GET_MUSICAL_ANALYSIS: 'data:get-musical-analysis',
  
  // Cues
  UPDATE_CUE: 'cues:update',
  APPROVE_CUE: 'cues:approve',
  DISCARD_CUE: 'cues:discard',
  APPROVE_ALL_CUES: 'cues:approve-all',
  APPROVE_SESSION_ALL: 'cues:approve-session-all',
  
  // Export
  EXPORT_CSV: 'export:csv',
  EXPORT_HTML: 'export:html',
  EXPORT_PDF: 'export:pdf',
  EXPORT_M3U: 'export:m3u',
  EXPORT_REKORDBOX_XML: 'export:rekordbox-xml',
  EXPORT_JSON: 'export:json',
  EXPORT_CLEAN_FOLDER: 'export:clean-folder',
  
  // Backup
  CREATE_BACKUP: 'backup:create',
  
  // Safe Rename
  PREVIEW_RENAME: 'rename:preview',
  APPLY_RENAME: 'rename:apply',

  // Converter
  CONVERTER_SELECT_FILES: 'converter:select-files',
  CONVERTER_SELECT_FOLDER: 'converter:select-folder',
  CONVERTER_SELECT_OUTPUT_FOLDER: 'converter:select-output-folder',
  CONVERTER_PREVIEW: 'converter:preview',
  CONVERTER_START: 'converter:start',
  CONVERTER_CANCEL: 'converter:cancel',
  CONVERTER_PROGRESS: 'converter:progress',

  // Audio preview
  AUDIO_GET_PLAYBACK_URL: 'audio:get-playback-url',
  AUDIO_CREATE_PREVIEW_CLIP: 'audio:create-preview-clip',
  
  // Settings
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  
  // Logs
  GET_LOGS: 'logs:get',
  
  // System
  GET_DRIVES: 'system:get-drives',
  GET_DISK_SPACE: 'system:get-disk-space',
  OPEN_PATH: 'system:open-path',
  GET_APP_VERSION: 'system:get-version',
} as const;
