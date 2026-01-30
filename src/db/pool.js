import pkg from 'pg';

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/proyecto';

const pool = new Pool({ connectionString });

export default pool;
