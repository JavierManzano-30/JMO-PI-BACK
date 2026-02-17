// Modelo de datos: aqui viven las consultas SQL contra PostgreSQL.
import { asc } from 'drizzle-orm';
import db from '../db/drizzle.js';
import { categories } from '../db/schema.js';

export function findAllCategories() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
    })
    .from(categories)
    .orderBy(asc(categories.name))
    .then((rows) => ({ rows }));
}
