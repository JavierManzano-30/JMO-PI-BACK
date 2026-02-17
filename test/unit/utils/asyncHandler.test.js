// Tests de utilidades: garantizan helpers estables y casos limite.
import { jest } from '@jest/globals';
import { asyncHandler } from '../../../src/utils/asyncHandler.js';

describe('asyncHandler', () => {
  test('captura error y lo envía a next', async () => {
    const next = jest.fn();
    const handler = asyncHandler(async () => {
      throw new Error('boom');
    });

    handler({}, {}, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].message).toBe('boom');
  });

  test('ejecuta handler exitoso sin llamar a next', async () => {
    const next = jest.fn();
    const fn = jest.fn();
    const handler = asyncHandler(async () => {
      fn();
    });

    handler({}, {}, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });
});
