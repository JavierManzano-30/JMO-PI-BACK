import { jest } from '@jest/globals';

const queryMock = jest.fn();

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  default: {
    query: queryMock,
  },
}));

const { countWinners, findWinners } = await import('../../../src/models/winnersModel.js');

describe('winners model', () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [] });
  });

  test('countWinners soporta conteo sin rank_limit', async () => {
    await countWinners('WHERE t.id = $1', [4]);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*)::int AS total FROM ranked'),
      [4]
    );
  });

  test('countWinners soporta rank_limit', async () => {
    await countWinners('WHERE t.id = $1', [4], 3);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE ranked.rank_position <= $2'),
      [4, 3]
    );
  });

  test('countWinners soporta filtro de ganadores oficiales', async () => {
    await countWinners('WHERE t.id = $1', [4], null, true);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('ranked.is_official_winner = true'),
      [4]
    );
  });

  test('findWinners pagina ranking sin rank_limit', async () => {
    await findWinners('WHERE t.community_id = $1', [9], 30, 0, 2, null);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY ranked.theme_end_date DESC, ranked.rank_position ASC'),
      [9, 30, 0]
    );
  });

  test('findWinners aplica rank_limit cuando existe', async () => {
    await findWinners('WHERE t.community_id = $1', [9], 30, 0, 2, 3);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE ranked.rank_position <= $2'),
      [9, 3, 30, 0]
    );
  });

  test('findWinners aplica officialOnly cuando existe', async () => {
    await findWinners('WHERE t.community_id = $1', [9], 30, 0, 2, null, true);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('ranked.is_official_winner = true'),
      [9, 30, 0]
    );
  });
});
