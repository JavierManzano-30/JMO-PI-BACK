import fs from 'node:fs/promises';
import path from 'node:path';
import pool from './pool.js';

const rootDir = path.resolve(process.cwd());
const schemaPath = path.join(rootDir, 'sql', 'schema.sql');
const seedPath = path.join(rootDir, 'sql', 'seed.sql');

async function runSql(filePath) {
  const sql = await fs.readFile(filePath, 'utf8');
  await pool.query(sql);
}

async function main() {
  try {
    await runSql(schemaPath);
    await runSql(seedPath);
    // eslint-disable-next-line no-console
    console.log('DB schema and seed applied');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('DB setup failed:', error);
  process.exit(1);
});
