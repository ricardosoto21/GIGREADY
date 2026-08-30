import { create } from 'zustand';
import type {
  AppPage, Track, ScanSession, ScanSettings, ScanProgress,
  DashboardSummary, CompatibilityProfile, EnergyRatingProfile,
} from '../types';

// ----------------------------------------------------------------------
interface AppState {
  currentPage: AppPage;
  setPage: (page: AppPage) => void;
  
  // Active scan session
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  
  // Selected track for detail view
  selectedTrackId: string | null;
  setSelectedTrackId: (id: string | null) => void;
  
  // App version
  appVersion: string;
  setAppVersion: (v: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'home',
  setPage: (page) => set({ currentPage: page }),
  
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  
  selectedTrackId: null,
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  
  appVersion: '1.2.0-beta.1',
  setAppVersion: (v) => set({ appVersion: v }),
}));

// ----------------------------------------------------------------------
interface ScanState {
  isScanning: boolean;
  progress: ScanProgress | null;
  scanPath: string | null;
  scanSettings: ScanSettings;
  
  setScanning: (scanning: boolean) => void;
  setProgress: (progress: ScanProgress | null) => void;
  setScanPath: (path: string | null) => void;
  updateSettings: (settings: Partial<ScanSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ScanSettings = {
  mode: 'complete',
  includeSubfolders: true,
  calculateHashes: true,
  validateWithFfprobe: true,
  analyzeCues: true,
  analysisEngine: 'standard',
  compatibilityProfile: 'general',
  minMp3Bitrate: 192,
  minDurationSeconds: 45,
  maxPathLength: 250,
  concurrency: 4,
  advancedAnalysisConcurrency: 2,
  minCueConfidence: 0.35,
  energyRatingProfile: 'auto',
  acceptedFormats: ['.mp3', '.wav', '.aiff', '.aif', '.flac', '.m4a', '.aac', '.ogg'],
  problematicChars: '<>:"/\\|?*',
};

const validEnergyProfiles = new Set<EnergyRatingProfile>([
  'auto',
  'general',
  'house_tech_house',
  'techno',
  'trance_melodic',
  'psytrance',
  'minimal',
  'drum_bass',
  'reggaeton_latin',
  'hip_hop_trap',
  'downtempo_warmup',
]);

function normalizeScanSettings(settings: Partial<ScanSettings> = {}): ScanSettings {
  const compatibilityProfile: CompatibilityProfile =
    settings.compatibilityProfile === 'rekordbox_cdj' ? 'rekordbox_cdj' : 'general';
  const energyRatingProfile = validEnergyProfiles.has(settings.energyRatingProfile as EnergyRatingProfile)
    ? settings.energyRatingProfile as EnergyRatingProfile
    : defaultSettings.energyRatingProfile;
  const acceptedFormats = Array.isArray(settings.acceptedFormats) && settings.acceptedFormats.length > 0
    ? settings.acceptedFormats
    : defaultSettings.acceptedFormats;

  return {
    ...defaultSettings,
    ...settings,
    mode: 'complete',
    includeSubfolders: true,
    calculateHashes: true,
    validateWithFfprobe: true,
    analyzeCues: true,
    analysisEngine: settings.analysisEngine === 'advanced_internal' ? 'advanced_internal' : 'standard',
    compatibilityProfile,
    energyRatingProfile,
    acceptedFormats,
  };
}

export const useScanStore = create<ScanState>((set) => ({
  isScanning: false,
  progress: null,
  scanPath: null,
  scanSettings: normalizeScanSettings(defaultSettings),
  
  setScanning: (scanning) => set({ isScanning: scanning }),
  setProgress: (progress) => set({ progress }),
  setScanPath: (path) => set({ scanPath: path }),
  updateSettings: (partial) =>
    set((state) => ({ scanSettings: normalizeScanSettings({ ...state.scanSettings, ...partial }) })),
  resetSettings: () => set({ scanSettings: normalizeScanSettings(defaultSettings) }),
}));

// ----------------------------------------------------------------------
interface DataState {
  tracks: Track[];
  session: ScanSession | null;
  dashboard: DashboardSummary | null;
  sessions: ScanSession[];
  
  setTracks: (tracks: Track[]) => void;
  setSession: (session: ScanSession | null) => void;
  setDashboard: (dashboard: DashboardSummary | null) => void;
  setSessions: (sessions: ScanSession[]) => void;
  clearData: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  tracks: [],
  session: null,
  dashboard: null,
  sessions: [],
  
  setTracks: (tracks) => set({ tracks }),
  setSession: (session) => set({ session }),
  setDashboard: (dashboard) => set({ dashboard }),
  setSessions: (sessions) => set({ sessions }),
  clearData: () => set({ tracks: [], session: null, dashboard: null }),
}));

// ----------------------------------------------------------------------
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration ?? 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
