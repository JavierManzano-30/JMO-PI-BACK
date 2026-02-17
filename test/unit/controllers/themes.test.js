// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';

const queryMock = jest.fn();

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  default: {
    query: queryMock,
  },
}));

const {
  listThemes,
  createTheme,
  getThemeById,
} = await import('../../../src/controllers/themesController.js');

describe('themes controller', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  test('listThemes valida filtro community_id', async () => {
    await expect(
      listThemes({ query: { community_id: 'bad' } }, { json: jest.fn() })
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  test('listThemes devuelve data con filtros', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, title: 'Tema', is_active: true, created_at: '2026-01-10' }],
      });

    const req = { query: { is_active: 'true', page: '1', limit: '5' } };
    const res = { json: jest.fn() };

    await listThemes(req, res);

    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 1, title: 'Tema', is_active: true, created_at: '2026-01-10' }],
      meta: { total: 1, page: 1, limit: 5, total_pages: 1 },
    });
  });

  test('createTheme valida titulo y fechas', async () => {
    await expect(
      createTheme({ body: { title: '', start_date: '2026-01-01', end_date: '2026-01-07' } }, { status: jest.fn() })
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    await expect(
      createTheme({ body: { title: 'Valido' } }, { status: jest.fn() })
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  test('createTheme valida comunidad inexistente', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await expect(
      createTheme(
        {
          body: {
            title: 'Semana 1',
            start_date: '2026-01-01',
            end_date: '2026-01-07',
            community_id: '4',
          },
        },
        { status: jest.fn() }
      )
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  test('createTheme crea tema', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 11, title: 'Semana 2', description: null, is_active: true, created_at: '2026-02-01' }],
      });

    const res = {
      status: jest.fn(function status() {
        return this;
      }),
      json: jest.fn(),
    };

    await createTheme(
      {
        body: {
          title: 'Semana 2',
          start_date: '2026-02-01',
          end_date: '2026-02-07',
          is_active: true,
          community_id: '3',
        },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 11,
      title: 'Semana 2',
      description: null,
      is_active: true,
      created_at: '2026-02-01',
    });
  });

  test('getThemeById valida id y 404', async () => {
    await expect(getThemeById({ params: { id: '-1' } }, { json: jest.fn() })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    await expect(getThemeById({ params: { id: '99' } }, { json: jest.fn() })).rejects.toMatchObject({
      status: 404,
      code: 'THEME_NOT_FOUND',
    });
  });

  test('getThemeById devuelve tema', async () => {
    queryMock.mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 8, title: 'Tema 8' }],
    });
    const res = { json: jest.fn() };

    await getThemeById({ params: { id: '8' } }, res);

    expect(res.json).toHaveBeenCalledWith({ id: 8, title: 'Tema 8' });
  });
});
