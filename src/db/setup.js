// Capa de base de datos: conexion y scripts auxiliares para SQL.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './pool.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const rootDir = path.resolve(currentDirPath, '../..');
const bootstrapPath = path.join(rootDir, 'sql', 'bootstrap.sql');
const schemaPath = path.join(rootDir, 'sql', 'schema.sql');
const seedPath = path.join(rootDir, 'sql', 'seed.sql');

async function runSql(filePath) {
  const sql = await fs.readFile(filePath, 'utf8');
  await pool.query(sql);
}

async function hasBaseSchema() {
  const result = await pool.query(
    `SELECT to_regclass('public.communities') IS NOT NULL AS communities_exists,
            to_regclass('public.themes') IS NOT NULL AS themes_exists,
            to_regclass('public.photos') IS NOT NULL AS photos_exists`
  );

  const row = result.rows[0] || {};
  return Boolean(row.communities_exists && row.themes_exists && row.photos_exists);
}

export async function ensureDatabaseSetup({ force = false } = {}) {
  const ready = force ? false : await hasBaseSchema();
  if (ready) {
    return false;
  }

  try {
    try {
      await fs.access(bootstrapPath);
      await runSql(bootstrapPath);
      console.log('DB bootstrap applied');
      return true;
    } catch {
      // Fallback para repos antiguos sin bootstrap.sql.
    }

    await runSql(schemaPath);
    await runSql(seedPath);
    console.log('DB schema and seed applied');
    return true;
  } catch (error) {
    console.error('DB setup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await ensureDatabaseSetup({ force: true });
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('DB setup failed:', error);
    process.exit(1);
  });
}
