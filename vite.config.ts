import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function schoolErpHybridPlugin(): Plugin {
  const apiModulePath = './server/' + 'apiEngine.mjs';
  return {
    name: 'school-erp-hybrid-plugin',
    async configureServer(server) {
      try {
        const mod = await import(apiModulePath);
        if (typeof mod?.createSchoolErpApiRouter === 'function') {
          server.middlewares.use(mod.createSchoolErpApiRouter());
        }
      } catch (err) {
        console.warn('[Vite API Middleware] Falling back to offline/PWA mode:', err);
      }
    },
    async configurePreviewServer(server) {
      try {
        const mod = await import(apiModulePath);
        if (typeof mod?.createSchoolErpApiRouter === 'function') {
          server.middlewares.use(mod.createSchoolErpApiRouter());
        }
      } catch (err) {
        console.warn('[Vite Preview API Middleware] Falling back to offline/PWA mode:', err);
      }
    },
    closeBundle() {
      // Generate dist/404.html SPA fallback for GitHub Pages & static hosts
      try {
        const distIndex = path.resolve(process.cwd(), 'dist/index.html');
        const dist404 = path.resolve(process.cwd(), 'dist/404.html');
        if (fs.existsSync(distIndex)) {
          fs.copyFileSync(distIndex, dist404);
        }
      } catch {
        // ignore
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [schoolErpHybridPlugin(), react()],
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
