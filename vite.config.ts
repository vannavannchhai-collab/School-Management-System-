import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function schoolErpSqliteApiPlugin(): Plugin {
  return {
    name: 'school-erp-sqlite-api',
    async configureServer(server) {
      try {
        const mod = await import('./server/index.js');
        if (mod?.app) {
          server.middlewares.use(mod.app);
        }
      } catch (err) {
        console.warn('[Vite API Middleware] Falling back to offline/proxy mode:', err);
      }
    },
    async configurePreviewServer(server) {
      try {
        const mod = await import('./server/index.js');
        if (mod?.app) {
          server.middlewares.use(mod.app);
        }
      } catch (err) {
        console.warn('[Vite Preview API Middleware] Falling back to offline mode:', err);
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [schoolErpSqliteApiPlugin(), react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
