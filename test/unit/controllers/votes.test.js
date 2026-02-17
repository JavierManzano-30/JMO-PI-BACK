// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';

const queryMock = jest.fn();

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  default: {
    query: queryMock,
  },
}));

const { createVote, deleteVote } = await import('../../../src/controllers/votesController.js');

function createRes() {
  return {
    status: jest.fn(function status() {
      return this;
    }),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('votes controller', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  test('createVote valida photo_id', async () => {
    await expect(createVote({ body: { photo_id: 'abc' }, user: { id: 2 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('createVote devuelve 404 si foto no existe', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await expect(createVote({ body: { photo_id: '3' }, user: { id: 2 } }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'PHOTO_NOT_FOUND',
    });
  });

  test('createVote evita voto duplicado', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 99 }] });

    await expect(createVote({ body: { photo_id: '3' }, user: { id: 2 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'ALREADY_VOTED',
    });
  });

  test('createVote registra voto', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 20, photo_id: 3, user_id: 2, created_at: '2026-02-01' }],
      });
    const res = createRes();

    await createVote({ body: { photo_id: '3' }, user: { id: 2 } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 20, photo_id: 3, user_id: 2, created_at: '2026-02-01' });
  });

  test('deleteVote valida photo_id', async () => {
    await expect(deleteVote({ body: { photo_id: 0 }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('deleteVote devuelve 404 si no hay voto', async () => {
    queryMock.mockResolvedValue({ rowCount: 0 });

    await expect(deleteVote({ body: { photo_id: 3 }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'VOTE_NOT_FOUND',
    });
  });

  test('deleteVote elimina voto', async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });
    const res = createRes();

    await deleteVote({ body: { photo_id: 3 }, user: { id: 1 } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
