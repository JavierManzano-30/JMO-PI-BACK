import pool from '../db/pool.js';

export async function listCategories(_req, res) {
  const result = await pool.query('SELECT id, slug, name FROM categories ORDER BY name ASC');
  res.json({ data: result.rows });
}
