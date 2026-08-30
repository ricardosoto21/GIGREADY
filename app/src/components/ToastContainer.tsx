import React from 'react';
import { useToastStore } from '../store';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => removeToast(toast.id)}
          >
            Cerrar
          </button>
        </div>
      ))}
    </div>
  );
}
