// Capa de base de datos: conexion y scripts auxiliares para SQL.
import pkg from 'pg';
import config from '../config.js';

const { Pool } = pkg;

const pool = new Pool({ connectionString: config.db.connectionString });

export default pool;
