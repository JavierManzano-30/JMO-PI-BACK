// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';

const queryMock = jest.fn();
const emitVoteChangedMock = jest.fn();

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  default: {
    query: queryMock,
  },
}));

jest.unstable_mockModule('../../../src/realtime/socket.js', () => ({
  emitVoteChanged: emitVoteChangedMock,
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
    emitVoteChangedMock.mockReset();
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
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, can_vote: true }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 99 }] });

    await expect(createVote({ body: { photo_id: '3' }, user: { id: 2 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'ALREADY_VOTED',
    });
  });

  test('createVote rechaza concurso con votación cerrada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 2, can_vote: false }] });

    await expect(createVote({ body: { photo_id: '3' }, user: { id: 2 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VOTING_CLOSED',
    });
  });

  test('createVote registra voto', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 2, can_vote: true }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 20, photo_id: 3, user_id: 2, created_at: '2026-02-01' }],
      })
      .mockResolvedValueOnce({
        rows: [{ total_votes: 7 }],
      });
    const res = createRes();

    await createVote({ body: { photo_id: '3' }, user: { id: 2 } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 20, photo_id: 3, user_id: 2, created_at: '2026-02-01' });
    expect(emitVoteChangedMock).toHaveBeenCalledWith({
      photo_id: 3,
      community_id: 2,
      total_votes: 7,
      action: 'created',
    });
  });

  test('createVote ignora user_id enviado por el cliente y usa el usuario autenticado', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 2, can_vote: true }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 21, photo_id: 3, user_id: 2, created_at: '2026-02-01' }],
      })
      .mockResolvedValueOnce({
        rows: [{ total_votes: 8 }],
      });
    const res = createRes();

    await createVote({ body: { photo_id: '3', user_id: 999 }, user: { id: 2 } }, res);

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      'SELECT id FROM votes WHERE photo_id = $1 AND user_id = $2',
      [3, 2]
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO votes (photo_id, user_id)'),
      [3, 2]
    );
  });

  test('createVote traduce conflicto unico a voto duplicado', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 2, can_vote: true }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockRejectedValueOnce({ code: '23505', constraint: 'uq_votes_user_photo' });

    await expect(createVote({ body: { photo_id: '3' }, user: { id: 2 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'ALREADY_VOTED',
    });
  });

  test('createVote traduce bloqueo de base de datos por votación cerrada', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 2, can_vote: true }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockRejectedValueOnce({ code: '23514' });

    await expect(createVote({ body: { photo_id: '3' }, user: { id: 2 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VOTING_CLOSED',
    });
  });

  test('deleteVote valida photo_id', async () => {
    await expect(deleteVote({ body: { photo_id: 0 }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('deleteVote devuelve 404 si no hay voto', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 5, can_vote: true }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await expect(deleteVote({ body: { photo_id: 3 }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'VOTE_NOT_FOUND',
    });
  });

  test('deleteVote rechaza concurso con votación cerrada', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 5, can_vote: false }] });

    await expect(deleteVote({ body: { photo_id: 3 }, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VOTING_CLOSED',
    });
  });

  test('deleteVote elimina voto', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 5, can_vote: true }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total_votes: 4 }] });
    const res = createRes();

    await deleteVote({ body: { photo_id: 3 }, user: { id: 1 } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(emitVoteChangedMock).toHaveBeenCalledWith({
      photo_id: 3,
      community_id: 5,
      total_votes: 4,
      action: 'deleted',
    });
  });

  test('deleteVote ignora user_id enviado por el cliente y borra solo el voto autenticado', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 5, can_vote: true }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total_votes: 4 }] });
    const res = createRes();

    await deleteVote({ body: { photo_id: 3, user_id: 999 }, user: { id: 1 } }, res);

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM votes WHERE photo_id = $1 AND user_id = $2',
      [3, 1]
    );
  });
});
