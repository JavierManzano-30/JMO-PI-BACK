// Controlador: recibe la peticion HTTP, valida entradas y construye la respuesta.
import { createError } from '../utils/errors.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';
import {
  countCommunities,
  findCommunitiesPaginated,
  findCommunityById,
} from '../models/communitiesModel.js';

export async function listCommunities(req, res) {
  const { page, limit, offset } = parsePagination(req.query);

  const countResult = await countCommunities();
  const total = countResult.rows[0]?.total || 0;

  const listResult = await findCommunitiesPaginated(limit, offset);

  res.json({
    data: listResult.rows,
    meta: buildMeta(total, page, limit),
  });
}

export async function getCommunityById(req, res) {
  const communityId = Number.parseInt(req.params.id, 10);
  if (!communityId || communityId < 1 || Number.isNaN(communityId)) {
    throw createError(400, 'VALIDATION_ERROR', 'ID inválido', []);
  }

  const result = await findCommunityById(communityId);

  if (result.rowCount === 0) {
    throw createError(404, 'COMMUNITY_NOT_FOUND', 'Comunidad no encontrada', []);
  }

  res.json(result.rows[0]);
}
