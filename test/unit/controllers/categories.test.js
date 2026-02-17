// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';

const findAllCategoriesMock = jest.fn();

jest.unstable_mockModule('../../../src/models/categoriesModel.js', () => ({
  findAllCategories: findAllCategoriesMock,
}));

const { listCategories } = await import('../../../src/controllers/categoriesController.js');

describe('categories controller', () => {
  test('listCategories devuelve lista', async () => {
    findAllCategoriesMock.mockResolvedValue({
      rows: [{ id: 1, slug: 'street', name: 'Street' }],
    });

    const res = { json: jest.fn() };

    await listCategories({}, res);

    expect(findAllCategoriesMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 1, slug: 'street', name: 'Street' }],
    });
  });
});
