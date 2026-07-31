import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

// Dynamically resolve relative SQLite database URLs to absolute paths
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
  const dbRelativePath = process.env.DATABASE_URL.replace(/^file:/, '');
  if (!path.isAbsolute(dbRelativePath)) {
    const absoluteDbPath = path.resolve(__dirname, '../prisma/dev.db');
    process.env.DATABASE_URL = `file:${absoluteDbPath}`;
    console.log(`[Env] Resolved relative SQLite database path to absolute: ${process.env.DATABASE_URL}`);
  }
}

