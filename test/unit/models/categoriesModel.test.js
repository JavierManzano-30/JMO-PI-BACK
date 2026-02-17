// Tests de modelos: comprueban consultas y mapeos de datos en capa de persistencia.
import { jest } from '@jest/globals';

const ascMock = jest.fn((value) => ({ order: 'asc', value }));
const orderByMock = jest.fn();
const fromMock = jest.fn(() => ({ orderBy: orderByMock }));
const selectMock = jest.fn(() => ({ from: fromMock }));

jest.unstable_mockModule('drizzle-orm', () => ({
  asc: ascMock,
}));

jest.unstable_mockModule('../../../src/db/drizzle.js', () => ({
  default: {
    select: selectMock,
  },
}));

jest.unstable_mockModule('../../../src/db/schema.js', () => ({
  categories: {
    id: 'id_column',
    slug: 'slug_column',
    name: 'name_column',
  },
}));

const { findAllCategories } = await import('../../../src/models/categoriesModel.js');

describe('categories model with drizzle', () => {
  beforeEach(() => {
    ascMock.mockClear();
    orderByMock.mockReset();
    fromMock.mockClear();
    selectMock.mockClear();
  });

  test('findAllCategories devuelve rows ordenadas por nombre', async () => {
    const rows = [{ id: 1, slug: 'naturaleza', name: 'Naturaleza' }];
    orderByMock.mockResolvedValue(rows);

    const result = await findAllCategories();

    expect(selectMock).toHaveBeenCalledWith({
      id: 'id_column',
      slug: 'slug_column',
      name: 'name_column',
    });
    expect(fromMock).toHaveBeenCalledWith({
      id: 'id_column',
      slug: 'slug_column',
      name: 'name_column',
    });
    expect(ascMock).toHaveBeenCalledWith('name_column');
    expect(orderByMock).toHaveBeenCalledWith({ order: 'asc', value: 'name_column' });
    expect(result).toEqual({ rows });
  });
});
