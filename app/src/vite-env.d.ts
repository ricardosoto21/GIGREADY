/// <reference types="vite/client" />

interface Window {
  gigready: typeof import('../electron/preload').gigreadyAPI;
}
