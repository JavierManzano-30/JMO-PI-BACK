// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';

const countPhotosMock = jest.fn();
const findPhotosMock = jest.fn();
const findThemeByIdMock = jest.fn();
const findActivePhotoByUserAndThemeMock = jest.fn();
const findCategoryByIdMock = jest.fn();
const insertPhotoMock = jest.fn();
const findPhotoRankingContextByIdMock = jest.fn();
const findPhotoRankInThemeMock = jest.fn();
const findThemeLeaderboardMock = jest.fn();
const findPhotoWithDetailsByIdMock = jest.fn();
const findPhotoOwnerByIdMock = jest.fn();
const softDeletePhotoByIdMock = jest.fn();
const emitPhotoCreatedMock = jest.fn();

jest.unstable_mockModule('../../../src/models/photosModel.js', () => ({
  countPhotos: countPhotosMock,
  findPhotos: findPhotosMock,
  findThemeById: findThemeByIdMock,
  findActivePhotoByUserAndTheme: findActivePhotoByUserAndThemeMock,
  findCategoryById: findCategoryByIdMock,
  insertPhoto: insertPhotoMock,
  findPhotoRankingContextById: findPhotoRankingContextByIdMock,
  findPhotoRankInTheme: findPhotoRankInThemeMock,
  findThemeLeaderboard: findThemeLeaderboardMock,
  findPhotoWithDetailsById: findPhotoWithDetailsByIdMock,
  findPhotoOwnerById: findPhotoOwnerByIdMock,
  softDeletePhotoById: softDeletePhotoByIdMock,
}));

jest.unstable_mockModule('../../../src/realtime/socket.js', () => ({
  emitPhotoCreated: emitPhotoCreatedMock,
}));

const {
  listPhotos,
  createPhoto,
  getPhotoById,
  getPhotoRanking,
  deletePhoto,
} = await import('../../../src/controllers/photosController.js');

function createRes() {
  return {
    status: jest.fn(function status() {
      return this;
    }),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('photos controller', () => {
  beforeEach(() => {
    countPhotosMock.mockReset();
    findPhotosMock.mockReset();
    findThemeByIdMock.mockReset();
    findActivePhotoByUserAndThemeMock.mockReset();
    findCategoryByIdMock.mockReset();
    insertPhotoMock.mockReset();
    findPhotoRankingContextByIdMock.mockReset();
    findPhotoRankInThemeMock.mockReset();
    findThemeLeaderboardMock.mockReset();
    findPhotoWithDetailsByIdMock.mockReset();
    findPhotoOwnerByIdMock.mockReset();
    softDeletePhotoByIdMock.mockReset();
    emitPhotoCreatedMock.mockReset();
  });

  test('listPhotos valida filtros y sort', async () => {
    await expect(listPhotos({ query: { community_id: 'x' } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    await expect(listPhotos({ query: { sort: 'invalid:asc' } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('listPhotos devuelve data y meta', async () => {
    countPhotosMock.mockResolvedValue({ rows: [{ total: 2 }] });
    findPhotosMock.mockResolvedValue({ rows: [{ id: 1, title: 'foto', votes_count: 5 }] });
    const res = createRes();

    await listPhotos({ query: { page: '1', limit: '10', sort: 'votes:desc' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 1, title: 'foto', votes_count: 5 }],
      meta: { total: 2, page: 1, limit: 10, total_pages: 1 },
    });
  });

  test('createPhoto valida payload basico', async () => {
    await expect(createPhoto({ body: { title: '' }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    await expect(
      createPhoto({ body: { title: 'T'.repeat(81), theme_id: '2' }, user: { id: 1 } }, createRes())
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    await expect(
      createPhoto({
        body: { title: 'ok', description: 'D'.repeat(501), theme_id: '2' },
        user: { id: 1 },
      }, createRes())
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    await expect(
      createPhoto({ body: { title: 'ok', theme_id: 'bad' }, user: { id: 1 } }, createRes())
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    await expect(
      createPhoto({ body: { title: 'ok', theme_id: '2' }, user: { id: 1 } }, createRes())
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });

  test('createPhoto valida tema y duplicados', async () => {
    findThemeByIdMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    await expect(
      createPhoto(
        {
          body: { title: 'ok', theme_id: '2' },
          user: { id: 1 },
          file: { filename: 'a.png' },
          protocol: 'http',
          get: () => 'localhost:3000',
        },
        createRes()
      )
    ).rejects.toMatchObject({ status: 404, code: 'THEME_NOT_FOUND' });

    findThemeByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2, community_id: 3, is_active: false }] });
    await expect(
      createPhoto(
        {
          body: { title: 'ok', theme_id: '2' },
          user: { id: 1 },
          file: { filename: 'a.png' },
          protocol: 'http',
          get: () => 'localhost:3000',
        },
        createRes()
      )
    ).rejects.toMatchObject({ status: 400, code: 'THEME_INACTIVE' });

    findThemeByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2, community_id: 3, is_active: true }] });
    findActivePhotoByUserAndThemeMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 9 }] });
    await expect(
      createPhoto(
        {
          body: { title: 'ok', theme_id: '2' },
          user: { id: 1 },
          file: { filename: 'a.png' },
          protocol: 'http',
          get: () => 'localhost:3000',
        },
        createRes()
      )
    ).rejects.toMatchObject({ status: 409, code: 'PHOTO_ALREADY_SUBMITTED' });
  });

  test('createPhoto valida categoria y crea registro', async () => {
    findThemeByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2, community_id: 3, is_active: true }] });
    findActivePhotoByUserAndThemeMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await expect(
      createPhoto(
        {
          body: { title: 'ok', theme_id: '2', category_id: 'bad' },
          user: { id: 1 },
          file: { filename: 'a.png' },
          protocol: 'http',
          get: () => 'localhost:3000',
        },
        createRes()
      )
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    findThemeByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2, community_id: 3, is_active: true }] });
    findActivePhotoByUserAndThemeMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    findCategoryByIdMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    await expect(
      createPhoto(
        {
          body: { title: 'ok', theme_id: '2', category_id: '10' },
          user: { id: 1 },
          file: { filename: 'a.png' },
          protocol: 'http',
          get: () => 'localhost:3000',
        },
        createRes()
      )
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    findThemeByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2, community_id: 3, is_active: true }] });
    findActivePhotoByUserAndThemeMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    findCategoryByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 10 }] });
    insertPhotoMock.mockResolvedValueOnce({
      rows: [{ id: 88, title: 'ok', image_url: 'http://localhost:3000/uploads/a.png' }],
    });
    const res = createRes();

    await createPhoto(
      {
        body: { title: 'ok', theme_id: '2', category_id: '10' },
        user: { id: 1 },
        file: { filename: 'a.png' },
        protocol: 'http',
        get: (name) => (name === 'host' ? 'localhost:3000' : ''),
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 88,
      title: 'ok',
      image_url: 'http://localhost:3000/uploads/a.png',
    });
    expect(emitPhotoCreatedMock).toHaveBeenCalledWith({
      id: 88,
      title: 'ok',
      image_url: 'http://localhost:3000/uploads/a.png',
    });
  });

  test('createPhoto normaliza título y descripción antes de insertar', async () => {
    findThemeByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2, community_id: 3, is_active: true }] });
    findActivePhotoByUserAndThemeMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    insertPhotoMock.mockResolvedValueOnce({
      rows: [{ id: 90, title: 'Título limpio', description: 'Descripción limpia' }],
    });
    const res = createRes();

    await createPhoto(
      {
        body: {
          title: '  Título limpio  ',
          description: '  Descripción limpia  ',
          theme_id: '2',
        },
        user: { id: 1 },
        file: { filename: 'a.png' },
        protocol: 'http',
        get: (name) => (name === 'host' ? 'localhost:3000' : ''),
      },
      res
    );

    expect(insertPhotoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Título limpio',
        description: 'Descripción limpia',
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('getPhotoById valida id, 404 y success', async () => {
    await expect(getPhotoById({ params: { id: 'x' }, user: null }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    findPhotoWithDetailsByIdMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    await expect(getPhotoById({ params: { id: '8' }, user: null }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'PHOTO_NOT_FOUND',
    });

    findPhotoWithDetailsByIdMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 8, title: 'foto8', has_user_voted: false }],
    });
    const res = createRes();

    await getPhotoById({ params: { id: '8' }, user: { id: 3 } }, res);

    expect(res.json).toHaveBeenCalledWith({ id: 8, title: 'foto8', has_user_voted: false });
  });

  test('deletePhoto valida id y permisos', async () => {
    await expect(deletePhoto({ params: { id: 'x' }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    findPhotoOwnerByIdMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    await expect(deletePhoto({ params: { id: '2' }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'PHOTO_NOT_FOUND',
    });

    findPhotoOwnerByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2, user_id: 999 }] });
    await expect(deletePhoto({ params: { id: '2' }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  test('deletePhoto elimina foto', async () => {
    findPhotoOwnerByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2, user_id: 1 }] });
    softDeletePhotoByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [] });
    const res = createRes();

    await deletePhoto({ params: { id: '2' }, user: { id: 1 } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('getPhotoRanking valida id y devuelve ranking', async () => {
    await expect(getPhotoRanking({ params: { id: 'bad' }, query: {} }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    findPhotoRankingContextByIdMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    await expect(getPhotoRanking({ params: { id: '8' }, query: {} }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'PHOTO_NOT_FOUND',
    });

    findPhotoRankingContextByIdMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{
        photo_id: 8,
        photo_title: 'Foto 8',
        photo_description: 'desc',
        photo_image_url: 'http://localhost/uploads/8.jpg',
        photo_thumb_url: 'http://localhost/uploads/8-thumb.jpg',
        photo_created_at: '2026-01-01',
        user_id: 2,
        author_display_name: 'Ana',
        community_id: 4,
        community_name: 'Madrid',
        theme_id: 11,
        theme_title: 'Nocturna',
        theme_description: 'Luces',
        theme_start_date: '2026-01-01',
        theme_end_date: '2026-01-07',
        theme_is_active: false,
        votes_count: 22,
      }],
    });
    findPhotoRankInThemeMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{
        photo_id: 8,
        rank_position: 2,
        total_entries: 16,
        votes_count: 22,
        is_official_winner: false,
      }],
    });
    findThemeLeaderboardMock.mockResolvedValueOnce({
      rows: [{ photo_id: 7, rank_position: 1, votes_count: 30 }],
    });

    const res = createRes();
    await getPhotoRanking({ params: { id: '8' }, query: { limit: '5' } }, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ranking: expect.objectContaining({
        photo_id: 8,
        rank_position: 2,
        total_entries: 16,
      }),
      leaderboard: [{ photo_id: 7, rank_position: 1, votes_count: 30 }],
    }));
  });
});
