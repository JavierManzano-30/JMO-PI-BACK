// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';

const countCommunitiesMock = jest.fn();
const findCommunitiesPaginatedMock = jest.fn();
const findCommunityByIdMock = jest.fn();

jest.unstable_mockModule('../../../src/models/communitiesModel.js', () => ({
  countCommunities: countCommunitiesMock,
  findCommunitiesPaginated: findCommunitiesPaginatedMock,
  findCommunityById: findCommunityByIdMock,
}));

const {
  listCommunities,
  getCommunityById,
} = await import('../../../src/controllers/communitiesController.js');

describe('communities controller', () => {
  beforeEach(() => {
    countCommunitiesMock.mockReset();
    findCommunitiesPaginatedMock.mockReset();
    findCommunityByIdMock.mockReset();
  });

  test('listCommunities devuelve data y meta', async () => {
    countCommunitiesMock.mockResolvedValueOnce({ rows: [{ total: 3 }] });
    findCommunitiesPaginatedMock.mockResolvedValueOnce({
      rows: [{ id: 10, code: 'A', name: 'Alpha', created_at: '2026-01-01' }],
    });

    const req = { query: { page: '1', limit: '2' } };
    const res = { json: jest.fn() };

    await listCommunities(req, res);

    expect(countCommunitiesMock).toHaveBeenCalledTimes(1);
    expect(findCommunitiesPaginatedMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 10, code: 'A', name: 'Alpha', created_at: '2026-01-01' }],
      meta: { total: 3, page: 1, limit: 2, total_pages: 2 },
    });
  });

  test('getCommunityById valida id', async () => {
    await expect(getCommunityById({ params: { id: '0' } }, { json: jest.fn() })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('getCommunityById devuelve 404 si no existe', async () => {
    findCommunityByIdMock.mockResolvedValue({ rowCount: 0, rows: [] });

    await expect(getCommunityById({ params: { id: '9' } }, { json: jest.fn() })).rejects.toMatchObject({
      status: 404,
      code: 'COMMUNITY_NOT_FOUND',
    });
  });

  test('getCommunityById devuelve comunidad', async () => {
    findCommunityByIdMock.mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 9, code: 'B', name: 'Beta', created_at: '2026-01-02' }],
    });
    const res = { json: jest.fn() };

    await getCommunityById({ params: { id: '9' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      id: 9,
      code: 'B',
      name: 'Beta',
      created_at: '2026-01-02',
    });
  });
});
