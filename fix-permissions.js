import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixPermissions() {
  try {
    console.log('Fijando permisos en Supabase...');
    await pool.query('GRANT USAGE ON SCHEMA public TO anon, authenticated;');
    await pool.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
    await pool.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;');
    console.log('✅ Permisos arreglados correctamente. El frontend ya no dará error 403.');
  } catch (err) {
    console.error('❌ Error al fijar permisos:', err);
  } finally {
    await pool.end();
  }
}

fixPermissions();
