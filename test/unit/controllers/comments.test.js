import { jest } from '@jest/globals';

const countCommentsByPhotoIdMock = jest.fn();
const deleteCommentByIdMock = jest.fn();
const findCommentByIdMock = jest.fn();
const findCommentsByPhotoIdMock = jest.fn();
const findPhotoForCommentsMock = jest.fn();
const insertCommentMock = jest.fn();
const emitCommentCreatedMock = jest.fn();
const emitCommentDeletedMock = jest.fn();

jest.unstable_mockModule('../../../src/models/commentsModel.js', () => ({
  countCommentsByPhotoId: countCommentsByPhotoIdMock,
  deleteCommentById: deleteCommentByIdMock,
  findCommentById: findCommentByIdMock,
  findCommentsByPhotoId: findCommentsByPhotoIdMock,
  findPhotoForComments: findPhotoForCommentsMock,
  insertComment: insertCommentMock,
}));

jest.unstable_mockModule('../../../src/realtime/socket.js', () => ({
  emitCommentCreated: emitCommentCreatedMock,
  emitCommentDeleted: emitCommentDeletedMock,
}));

const {
  listPhotoComments,
  createPhotoComment,
  deletePhotoComment,
} = await import('../../../src/controllers/commentsController.js');

function createRes() {
  return {
    status: jest.fn(function status() {
      return this;
    }),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('comments controller', () => {
  beforeEach(() => {
    countCommentsByPhotoIdMock.mockReset();
    deleteCommentByIdMock.mockReset();
    findCommentByIdMock.mockReset();
    findCommentsByPhotoIdMock.mockReset();
    findPhotoForCommentsMock.mockReset();
    insertCommentMock.mockReset();
    emitCommentCreatedMock.mockReset();
    emitCommentDeletedMock.mockReset();
  });

  test('listPhotoComments devuelve 404 si foto no existe', async () => {
    findPhotoForCommentsMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await expect(listPhotoComments({ params: { id: '3' }, query: {} }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'PHOTO_NOT_FOUND',
    });
  });

  test('createPhotoComment crea comentario', async () => {
    findPhotoForCommentsMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 7, is_deleted: false }] });
    insertCommentMock.mockResolvedValueOnce({
      rows: [{ id: 55, photo_id: 3, user_id: 9, content: 'Buen encuadre', created_at: '2026-01-01', updated_at: '2026-01-01' }],
    });
    const res = createRes();

    await createPhotoComment(
      {
        params: { id: '3' },
        body: { content: 'Buen encuadre' },
        user: { id: 9, username: 'ana', display_name: 'Ana', avatar_url: null },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(emitCommentCreatedMock).toHaveBeenCalled();
  });

  test('createPhotoComment valida contenido vacío tras trim', async () => {
    await expect(
      createPhotoComment(
        {
          params: { id: '3' },
          body: { content: '   ' },
          user: { id: 9, username: 'ana', display_name: 'Ana', avatar_url: null },
        },
        createRes()
      )
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('createPhotoComment rechaza comentarios de más de 280 caracteres', async () => {
    await expect(
      createPhotoComment(
        {
          params: { id: '3' },
          body: { content: 'C'.repeat(281) },
          user: { id: 9, username: 'ana', display_name: 'Ana', avatar_url: null },
        },
        createRes()
      )
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    expect(findPhotoForCommentsMock).not.toHaveBeenCalled();
    expect(insertCommentMock).not.toHaveBeenCalled();
  });

  test('createPhotoComment acepta exactamente 280 caracteres', async () => {
    const content = 'C'.repeat(280);
    findPhotoForCommentsMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 7, is_deleted: false }] });
    insertCommentMock.mockResolvedValueOnce({
      rows: [{ id: 56, photo_id: 3, user_id: 9, content, created_at: '2026-01-01', updated_at: '2026-01-01' }],
    });
    const res = createRes();

    await createPhotoComment(
      {
        params: { id: '3' },
        body: { content },
        user: { id: 9, username: 'ana', display_name: 'Ana', avatar_url: null },
      },
      res
    );

    expect(insertCommentMock).toHaveBeenCalledWith({ photoId: 3, userId: 9, content });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('listPhotoComments devuelve can_delete para autor', async () => {
    findPhotoForCommentsMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, is_deleted: false }] });
    countCommentsByPhotoIdMock.mockResolvedValueOnce({ rows: [{ total: 1 }] });
    findCommentsByPhotoIdMock.mockResolvedValueOnce({
      rows: [
        {
          id: 8,
          photo_id: 3,
          user_id: 9,
          content: 'Texto',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          user: {
            id: 9,
            username: 'ana',
            display_name: 'Ana',
            avatar_url: null,
          },
        },
      ],
    });

    const res = createRes();
    await listPhotoComments(
      {
        params: { id: '3' },
        query: { page: '1', limit: '10' },
        user: { id: 9, role: 'user' },
      },
      res
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            id: 8,
            can_delete: true,
          }),
        ],
        meta: expect.objectContaining({ total: 1, page: 1, limit: 10 }),
      })
    );
  });

  test('deletePhotoComment valida permisos', async () => {
    findPhotoForCommentsMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 7, is_deleted: false }] });
    findCommentByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 8, user_id: 4 }] });

    await expect(
      deletePhotoComment(
        {
          params: { id: '3', commentId: '8' },
          user: { id: 9, role: 'user' },
        },
        createRes()
      )
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  test('deletePhotoComment permite borrado por admin', async () => {
    findPhotoForCommentsMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3, community_id: 7, is_deleted: false }] });
    findCommentByIdMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 8, user_id: 4 }] });
    deleteCommentByIdMock.mockResolvedValueOnce({ rows: [{ id: 8 }] });

    const res = createRes();
    await deletePhotoComment(
      {
        params: { id: '3', commentId: '8' },
        user: { id: 1, role: 'admin' },
      },
      res
    );

    expect(deleteCommentByIdMock).toHaveBeenCalledWith(8);
    expect(emitCommentDeletedMock).toHaveBeenCalledWith({
      photo_id: 3,
      community_id: 7,
      comment_id: 8,
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
