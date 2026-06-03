import { jest } from '@jest/globals';

const queryMock = jest.fn();

jest.unstable_mockModule('../../../src/db/pool.js', () => ({
  default: {
    query: queryMock,
  },
}));

const photosModel = await import('../../../src/models/photosModel.js');

describe('photos model', () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [] });
  });

  test('countPhotos construye consulta de conteo', async () => {
    await photosModel.countPhotos('WHERE is_deleted = false', [1]);
    expect(queryMock).toHaveBeenCalledWith(
      'SELECT COUNT(*)::int AS total FROM photos WHERE is_deleted = false',
      [1]
    );
  });

  test('findPhotos incluye has_user_voted y placeholders de paginacion', async () => {
    await photosModel.findPhotos('WHERE p.community_id = $1', 'p.created_at DESC', [7], 10, 0, 2, 99);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('AS has_user_voted'),
      [7, 99, 10, 0]
    );
  });

  test('consultas base de referencia devuelven pool.query', async () => {
    await photosModel.findThemeById(4);
    await photosModel.findActivePhotoByUserAndTheme(3, 8);
    await photosModel.findCategoryById(9);
    await photosModel.findPhotoOwnerById(11);
    await photosModel.softDeletePhotoById(11);

    expect(queryMock).toHaveBeenCalledTimes(5);
  });

  test('insertPhoto persiste todos los campos esperados', async () => {
    await photosModel.insertPhoto({
      userId: 1,
      themeId: 2,
      communityId: 3,
      categoryId: 4,
      title: 'Foto',
      description: 'Desc',
      imageUrl: 'http://localhost/a.jpg',
      thumbUrl: 'http://localhost/a-thumb.jpg',
    });

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO photos'),
      [1, 2, 3, 4, 'Foto', 'Desc', 'http://localhost/a.jpg', 'http://localhost/a-thumb.jpg']
    );
  });

  test('findPhotoWithDetailsById consulta detalle con usuario opcional', async () => {
    await photosModel.findPhotoWithDetailsById(8, 2);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('AS has_user_voted'),
      [8, 2]
    );
    expect(queryMock.mock.calls[0][0]).toContain('start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE');
  });

  test('consultas de ranking por foto y tema', async () => {
    await photosModel.findPhotoRankingContextById(12);
    await photosModel.findPhotoRankInTheme(12, 5);
    await photosModel.findThemeLeaderboard(5, 8);

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('AS theme_id'),
      [12]
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('total_entries'),
      [12, 5]
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('ORDER BY ranked.rank_position ASC'),
      [5, 8]
    );
  });
});
