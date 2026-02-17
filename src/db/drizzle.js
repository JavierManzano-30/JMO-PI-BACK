// Instancia de Drizzle ORM usando el mismo pool de PostgreSQL del proyecto.
import { drizzle } from 'drizzle-orm/node-postgres';
import pool from './pool.js';
import * as schema from './schema.js';

const db = drizzle(pool, { schema });

export default db;
