import { jest } from '@jest/globals';

const clientMock = {
  query: jest.fn(),
  release: jest.fn(),
};
const connectMock = jest.fn();

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  default: {
    connect: connectMock,
  },
}));

const {
  ensureWeeklyContests,
  getWeeklyContestRange,
  selectWeeklyContestThemes,
} = await import('../../../src/services/weeklyContests.js');

describe('weekly contests service', () => {
  beforeEach(() => {
    clientMock.query.mockReset();
    clientMock.release.mockReset();
    connectMock.mockReset();
    connectMock.mockResolvedValue(clientMock);
  });

  test('calcula siempre semanas de lunes a domingo', () => {
    expect(getWeeklyContestRange(new Date(2026, 4, 11))).toEqual({
      startDate: '2026-05-11',
      endDate: '2026-05-17',
    });
    expect(getWeeklyContestRange(new Date(2026, 4, 17))).toEqual({
      startDate: '2026-05-11',
      endDate: '2026-05-17',
    });
  });

  test('selecciona dos tematicas diferentes para una semana', () => {
    const selected = selectWeeklyContestThemes('2026-05-11');

    expect(selected).toHaveLength(2);
    expect(selected[0].title).not.toBe(selected[1].title);
  });

  test('crea dos concursos globales si no existen para la semana', async () => {
    clientMock.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 10, title: 'Tema 1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, title: 'Tema 2' }] })
      .mockResolvedValueOnce({});

    const result = await ensureWeeklyContests({
      referenceDate: new Date(2026, 4, 11),
    });

    expect(clientMock.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(clientMock.query).toHaveBeenNthCalledWith(2, 'SELECT pg_advisory_xact_lock($1)', [20260510]);
    expect(clientMock.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM themes'),
      ['2026-05-11', '2026-05-17']
    );
    expect(clientMock.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO themes'),
      expect.arrayContaining(['2026-05-11', '2026-05-17'])
    );
    expect(clientMock.query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('INSERT INTO themes'),
      expect.arrayContaining(['2026-05-11', '2026-05-17'])
    );
    expect(clientMock.query).toHaveBeenNthCalledWith(6, 'COMMIT');
    expect(clientMock.release).toHaveBeenCalled();
    expect(result).toMatchObject({
      start_date: '2026-05-11',
      end_date: '2026-05-17',
      existing_count: 0,
      created_count: 2,
    });
  });

  test('no crea mas concursos si ya hay dos activos esa semana', async () => {
    clientMock.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          { id: 10, title: 'Tema 1' },
          { id: 11, title: 'Tema 2' },
        ],
      })
      .mockResolvedValueOnce({});

    const result = await ensureWeeklyContests({
      referenceDate: new Date(2026, 4, 11),
    });

    expect(clientMock.query).toHaveBeenCalledTimes(4);
    expect(clientMock.query).toHaveBeenLastCalledWith('COMMIT');
    expect(result.created_count).toBe(0);
  });

  test('hace rollback si falla la creacion', async () => {
    const error = new Error('db failed');
    clientMock.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({});

    await expect(
      ensureWeeklyContests({ referenceDate: new Date(2026, 4, 11) })
    ).rejects.toBe(error);

    expect(clientMock.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(clientMock.release).toHaveBeenCalled();
  });
});
