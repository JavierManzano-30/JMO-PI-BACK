import { jest } from '@jest/globals';

const countWinnersMock = jest.fn();
const findWinnersMock = jest.fn();

jest.unstable_mockModule('../../../src/models/winnersModel.js', () => ({
  countWinners: countWinnersMock,
  findWinners: findWinnersMock,
}));

const { listWinners } = await import('../../../src/controllers/winnersController.js');

describe('winners controller', () => {
  beforeEach(() => {
    countWinnersMock.mockReset();
    findWinnersMock.mockReset();
  });

  test('valida filtros numericos', async () => {
    await expect(listWinners({ query: { theme_id: 'bad' } }, { json: jest.fn() })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    await expect(listWinners({ query: { theme_state: 'invalid' } }, { json: jest.fn() })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('devuelve ranking con meta', async () => {
    countWinnersMock.mockResolvedValueOnce({ rows: [{ total: 2 }] });
    findWinnersMock.mockResolvedValueOnce({
      rows: [{ theme_id: 1, photo_id: 4, rank_position: 1, votes_count: 12 }],
    });

    const res = { json: jest.fn() };

    await listWinners({ query: { page: '1', limit: '5', theme_state: 'active', official_only: 'true' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [{ theme_id: 1, photo_id: 4, rank_position: 1, votes_count: 12 }],
      meta: {
        total: 2,
        page: 1,
        limit: 5,
        total_pages: 1,
        theme_state: 'active',
        official_only: true,
        rank_limit: null,
      },
    });
    expect(countWinnersMock).toHaveBeenCalledWith(expect.any(String), expect.any(Array), null, true);
    expect(findWinnersMock).toHaveBeenCalledWith(expect.any(String), expect.any(Array), 5, 0, expect.any(Number), null, true);
  });
});
