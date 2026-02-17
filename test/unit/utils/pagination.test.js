// Tests de utilidades: garantizan helpers estables y casos limite.
import { parsePagination, buildMeta } from '../../../src/utils/pagination.js';

describe('pagination utils', () => {
  test('parsePagination devuelve defaults', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 10, offset: 0 });
  });

  test('parsePagination valida page', () => {
    expect(() => parsePagination({ page: '0' })).toThrow('page inválido');
    expect(() => parsePagination({ page: 'abc' })).toThrow('page inválido');
  });

  test('parsePagination valida limit', () => {
    expect(() => parsePagination({ limit: '0' })).toThrow('limit inválido');
    expect(() => parsePagination({ limit: 'abc' })).toThrow('limit inválido');
  });

  test('parsePagination limita limit a 100', () => {
    const result = parsePagination({ page: '2', limit: '500' });
    expect(result).toEqual({ page: 2, limit: 100, offset: 100 });
  });

  test('buildMeta calcula total_pages', () => {
    expect(buildMeta(0, 1, 10)).toEqual({
      total: 0,
      page: 1,
      limit: 10,
      total_pages: 0,
    });

    expect(buildMeta(25, 2, 10)).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      total_pages: 3,
    });
  });
});
