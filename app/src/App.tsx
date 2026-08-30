import React, { useEffect } from 'react';
import { useAppStore, useScanStore } from './store';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { HomePage } from './pages/HomePage';
import { FolderSelectPage } from './pages/FolderSelectPage';
import { ScanningPage } from './pages/ScanningPage';
import { DashboardPage } from './pages/DashboardPage';
import { IssuesPage } from './pages/IssuesPage';
import { DuplicatesPage } from './pages/DuplicatesPage';
import { TrackDetailPage } from './pages/TrackDetailPage';
import { CueAssistantPage } from './pages/CueAssistantPage';
import { ExportPage } from './pages/ExportPage';
import { CleanFolderPage } from './pages/CleanFolderPage';
import { ConverterPage } from './pages/ConverterPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LogsPage } from './pages/LogsPage';
import { HelpPage } from './pages/HelpPage';

function PageRouter() {
  const currentPage = useAppStore((s) => s.currentPage);

  switch (currentPage) {
    case 'home': return <HomePage />;
    case 'folder-select': return <FolderSelectPage />;
    case 'scanning': return <ScanningPage />;
    case 'dashboard': return <DashboardPage />;
    case 'issues': return <IssuesPage />;
    case 'duplicates': return <DuplicatesPage />;
    case 'track-detail': return <TrackDetailPage />;
    case 'cue-assistant': return <CueAssistantPage />;
    case 'cue-editor': return <CueAssistantPage />;
    case 'export': return <ExportPage />;
    case 'clean-folder': return <CleanFolderPage />;
    case 'converter': return <ConverterPage />;
    case 'history': return <HistoryPage />;
    case 'settings': return <SettingsPage />;
    case 'logs': return <LogsPage />;
    case 'help': return <HelpPage />;
    default: return <HomePage />;
  }
}

export function App() {
  const setAppVersion = useAppStore((state) => state.setAppVersion);
  const updateSettings = useScanStore((state) => state.updateSettings);

  useEffect(() => {
    let active = true;

    void window.gigready.getSettings().then((settings) => {
      if (active) updateSettings(settings);
    }).catch(() => {
      // Defaults remain active if the persisted file cannot be read.
    });

    void window.gigready.getAppVersion().then((version) => {
      if (active) setAppVersion(version);
    }).catch(() => {
      // The packaged version is cosmetic; the app can continue with its fallback.
    });

    return () => {
      active = false;
    };
  }, [setAppVersion, updateSettings]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <PageRouter />
      </main>
      <ToastContainer />
    </div>
  );
}
