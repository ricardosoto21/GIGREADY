import React, { useEffect, useState } from 'react';
import { useToastStore } from '../store';

export function LogsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [logs, setLogs] = useState<string[]>([]);
  const [count, setCount] = useState(100);

  useEffect(() => {
    window.gigready.getLogs(count).then(setLogs).catch(() => {
      addToast({ type: 'error', message: 'No se pudieron cargar los registros.' });
    });
  }, [addToast, count]);

  return (
    <div className="app-content">
      <div className="flex justify-between items-center mb-6">
        <h2>Registros</h2>
        <div className="flex gap-3">
          <select className="input" style={{ width: 'auto' }} value={count} onChange={(e) => setCount(Number(e.target.value))}>
            <option value={50}>Últimos 50</option>
            <option value={100}>Últimos 100</option>
            <option value={500}>Últimos 500</option>
          </select>
          <button className="btn btn-ghost" onClick={() => window.gigready.getLogs(count).then(setLogs)}>
            Actualizar
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <h3>Sin registros</h3>
          <p>Los registros de la aplicación aparecerán aquí.</p>
        </div>
      ) : (
        <div className="card selectable" style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          <pre className="font-mono" style={{ fontSize: 'var(--font-size-xs)', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {logs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}
