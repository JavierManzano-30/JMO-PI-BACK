// Tests de utilidades: garantizan helpers estables y casos limite.
import { jest } from '@jest/globals';
import path from 'node:path';

const multerFactory = jest.fn((options) => ({ options }));
multerFactory.diskStorage = jest.fn((config) => config);

jest.unstable_mockModule('multer', () => ({
  default: multerFactory,
}));

const { createImageUpload } = await import('../../../src/utils/upload.js');

describe('upload utils', () => {
  beforeEach(() => {
    multerFactory.mockClear();
    multerFactory.diskStorage.mockClear();
  });

  test('createImageUpload configura storage y limits', () => {
    const upload = createImageUpload();

    expect(upload).toEqual(expect.objectContaining({ options: expect.any(Object) }));
    expect(multerFactory.diskStorage).toHaveBeenCalledTimes(1);
    expect(multerFactory).toHaveBeenCalledTimes(1);

    const options = multerFactory.mock.calls[0][0];
    expect(options.limits.fileSize).toBeGreaterThan(0);
    expect(options.limits.files).toBe(1);
    expect(options.limits.fields).toBeGreaterThan(0);
    expect(options.limits.parts).toBe(options.limits.fields + options.limits.files);
  });

  test('storage destination y filename generan nombre seguro', () => {
    createImageUpload();
    const storageConfig = multerFactory.diskStorage.mock.calls[0][0];

    const destinationCb = jest.fn();
    storageConfig.destination({}, {}, destinationCb);
    expect(destinationCb).toHaveBeenCalledWith(null, path.resolve(process.cwd(), 'uploads'));

    const filenameCb = jest.fn();
    storageConfig.filename({}, { originalname: 'avatar.png' }, filenameCb);
    const [error, filename] = filenameCb.mock.calls[0];
    expect(error).toBeNull();
    expect(filename).toMatch(/^\d+-[a-f0-9]{24}\.png$/);
  });

  test('fileFilter rechaza formato no permitido y acepta imagen valida', () => {
    createImageUpload();
    const options = multerFactory.mock.calls[0][0];

    const invalidCb = jest.fn();
    options.fileFilter({}, { mimetype: 'text/plain' }, invalidCb);
    expect(invalidCb).toHaveBeenCalledTimes(1);
    expect(invalidCb.mock.calls[0][0]).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    const validCb = jest.fn();
    options.fileFilter({}, { mimetype: 'image/jpeg' }, validCb);
    expect(validCb).toHaveBeenCalledWith(null, true);
  });
});
