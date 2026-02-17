// Controlador: recibe la peticion HTTP, valida entradas y construye la respuesta.
import { findAllCategories } from '../models/categoriesModel.js';

export async function listCategories(_req, res) {
  const result = await findAllCategories();
  res.json({ data: result.rows });
}
