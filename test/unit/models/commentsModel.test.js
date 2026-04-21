import { jest } from '@jest/globals';

const queryMock = jest.fn();

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  default: {
    query: queryMock,
  },
}));

const commentsModel = await import('../../../src/models/commentsModel.js');

describe('comments model', () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [] });
  });

  test('countCommentsByPhotoId consulta conteo por foto', async () => {
    await commentsModel.countCommentsByPhotoId(5);

    expect(queryMock).toHaveBeenCalledWith(
      'SELECT COUNT(*)::int AS total FROM comments WHERE photo_id = $1',
      [5]
    );
  });

  test('findCommentsByPhotoId aplica orden y paginación', async () => {
    await commentsModel.findCommentsByPhotoId(5, 20, 0);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY c.created_at DESC'),
      [5, 20, 0]
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('json_build_object'),
      [5, 20, 0]
    );
  });

  test('findPhotoForComments consulta estado de foto', async () => {
    await commentsModel.findPhotoForComments(9);

    expect(queryMock).toHaveBeenCalledWith(
      'SELECT id, community_id, is_deleted FROM photos WHERE id = $1',
      [9]
    );
  });

  test('insertComment persiste comentario nuevo', async () => {
    await commentsModel.insertComment({
      photoId: 7,
      userId: 2,
      content: 'Comentario de prueba',
    });

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO comments (photo_id, user_id, content)'),
      [7, 2, 'Comentario de prueba']
    );
  });

  test('findCommentById filtra por comentario y foto', async () => {
    await commentsModel.findCommentById(3, 7);

    expect(queryMock).toHaveBeenCalledWith(
      'SELECT id, photo_id, user_id, content, created_at, updated_at FROM comments WHERE id = $1 AND photo_id = $2',
      [3, 7]
    );
  });

  test('deleteCommentById elimina comentario por id', async () => {
    await commentsModel.deleteCommentById(3);

    expect(queryMock).toHaveBeenCalledWith(
      'DELETE FROM comments WHERE id = $1 RETURNING id',
      [3]
    );
  });
});
