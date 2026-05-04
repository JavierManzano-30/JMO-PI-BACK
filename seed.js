import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seed() {
  try {
    console.log('Sembrando datos iniciales en la base de datos...');

    // 1. Insertar comunidad
    const communityRes = await pool.query(`
      INSERT INTO communities (code, name) 
      VALUES ('global', 'Comunidad Global') 
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const communityId = communityRes.rows[0].id;

    // 2. Insertar categorías
    await pool.query(`
      INSERT INTO categories (slug, name) VALUES 
      ('deportes', 'Deportes'),
      ('retrato', 'Retrato'),
      ('paisaje', 'Paisaje')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // 3. Insertar concurso (theme) "prueba 1"
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth.toISOString().split('T')[0];

    await pool.query(`
      INSERT INTO themes (community_id, title, description, start_date, end_date, is_active)
      VALUES ($1, 'prueba 1', 'Concurso de prueba inicial', $2, $3, true)
    `, [communityId, today, endDate]);

    console.log('✅ Concurso "prueba 1", categorías y comunidad creados con éxito!');
  } catch (err) {
    console.error('❌ Error insertando datos:', err);
  } finally {
    await pool.end();
  }
}

seed();
