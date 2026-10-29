import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createSchoolErpApiRouter } from './apiEngine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

const serverApp = createSchoolErpApiRouter();

// Serve static production frontend when dist/ exists
if (fs.existsSync(DIST_DIR)) {
  serverApp.use(express.static(DIST_DIR));
  serverApp.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || (isProd ? 3000 : 3001));
const HOST = process.env.HOST || (isProd ? '0.0.0.0' : '127.0.0.1');

serverApp.listen(PORT, HOST, () => {
  console.log(
    `[Cambodia School ERP] Server listening on http://${HOST}:${PORT} (${
      isProd ? 'production unified' : 'dev api'
    })`
  );
});
