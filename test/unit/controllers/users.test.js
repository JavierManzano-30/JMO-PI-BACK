// Tests de controladores: validan entradas, respuestas y codigos HTTP.
import { jest } from '@jest/globals';

const findUserProfileByIdMock = jest.fn();
const updateUserProfileByIdMock = jest.fn();
const deleteUserByIdMock = jest.fn();

jest.unstable_mockModule('../../../src/models/usersModel.js', () => ({
  findUserProfileById: findUserProfileByIdMock,
  updateUserProfileById: updateUserProfileByIdMock,
  deleteUserById: deleteUserByIdMock,
}));

const {
  getMe,
  updateMe,
  deleteMe,
  deleteUserById,
} = await import('../../../src/controllers/usersController.js');

function createRes() {
  return {
    status: jest.fn(function status() {
      return this;
    }),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('users controller', () => {
  beforeEach(() => {
    findUserProfileByIdMock.mockReset();
    updateUserProfileByIdMock.mockReset();
    deleteUserByIdMock.mockReset();
  });

  test('getMe devuelve 404 si usuario no existe', async () => {
    findUserProfileByIdMock.mockResolvedValue({ rowCount: 0, rows: [] });

    await expect(getMe({ user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  test('getMe devuelve usuario', async () => {
    findUserProfileByIdMock.mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 1, username: 'demo' }],
    });
    const res = createRes();

    await getMe({ user: { id: 1 } }, res);

    expect(res.json).toHaveBeenCalledWith({ id: 1, username: 'demo' });
  });

  test('updateMe valida display_name', async () => {
    await expect(
      updateMe(
        { body: { display_name: 123 }, user: { id: 1 } },
        createRes()
      )
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('updateMe falla sin cambios', async () => {
    await expect(updateMe({ body: {}, user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('updateMe actualiza display_name y avatar', async () => {
    updateUserProfileByIdMock.mockResolvedValue({
      rows: [{ id: 1, username: 'demo', display_name: 'Nuevo', avatar_url: 'http://localhost:3000/uploads/a.png' }],
    });
    const res = createRes();

    await updateMe(
      {
        body: { display_name: 'Nuevo' },
        file: { filename: 'a.png' },
        protocol: 'http',
        get: (name) => (name === 'host' ? 'localhost:3000' : ''),
        user: { id: 1 },
      },
      res
    );

    expect(updateUserProfileByIdMock).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      username: 'demo',
      display_name: 'Nuevo',
      avatar_url: 'http://localhost:3000/uploads/a.png',
    });
  });

  test('deleteMe devuelve 404 si usuario no existe', async () => {
    deleteUserByIdMock.mockResolvedValue({ rowCount: 0, rows: [] });

    await expect(deleteMe({ user: { id: 1 } }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  test('deleteMe elimina usuario autenticado', async () => {
    deleteUserByIdMock.mockResolvedValue({ rowCount: 1, rows: [{ id: 1 }] });
    const res = createRes();

    await deleteMe({ user: { id: 1 } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('deleteUserById valida id', async () => {
    await expect(deleteUserById({ params: { id: 'x' } }, createRes())).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  test('deleteUserById devuelve 404 si usuario no existe', async () => {
    deleteUserByIdMock.mockResolvedValue({ rowCount: 0, rows: [] });

    await expect(deleteUserById({ params: { id: '10' } }, createRes())).rejects.toMatchObject({
      status: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  test('deleteUserById elimina usuario por id', async () => {
    deleteUserByIdMock.mockResolvedValue({ rowCount: 1, rows: [{ id: 10 }] });
    const res = createRes();

    await deleteUserById({ params: { id: '10' } }, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
