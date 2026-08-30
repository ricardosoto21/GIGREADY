import React from 'react';
import { useAppStore } from '../store';
import type { AppPage } from '../types';

interface NavItem {
  id: AppPage;
  label: string;
}

const mainNav: NavItem[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'folder-select', label: 'Escanear' },
];

const analysisNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'issues', label: 'Problemas' },
  { id: 'duplicates', label: 'Duplicados' },
  { id: 'cue-assistant', label: 'Memory Cues' },
];

const toolsNav: NavItem[] = [
  { id: 'clean-folder', label: 'Carpeta limpia' },
  { id: 'converter', label: 'Convertir' },
  { id: 'export', label: 'Exportar' },
  { id: 'history', label: 'Historial' },
  { id: 'settings', label: 'Configuracion' },
  { id: 'logs', label: 'Registros' },
  { id: 'help', label: 'Ayuda' },
];

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  const { currentPage, setPage } = useAppStore();

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">{title}</div>
      {items.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
          onClick={() => setPage(item.id)}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Sidebar() {
  const appVersion = useAppStore((state) => state.appVersion);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <h1>GigReady</h1>
        <div className="subtitle">Revisa tu musica antes de tocar</div>
      </div>
      <nav className="sidebar-nav">
        <NavSection title="Principal" items={mainNav} />
        <NavSection title="Analisis" items={analysisNav} />
        <NavSection title="Herramientas" items={toolsNav} />
      </nav>
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderTop: 'var(--border)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-tertiary)',
      }}>
        v{appVersion}
      </div>
    </aside>
  );
}
