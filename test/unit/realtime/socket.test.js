// Tests de realtime: validan la emision de eventos WebSocket con Socket.IO.
import { jest } from '@jest/globals';

const onMock = jest.fn();
const emitMock = jest.fn();
const toEmitMock = jest.fn();
const toMock = jest.fn(() => ({ emit: toEmitMock }));
const serverCtorMock = jest.fn(function FakeSocketServer() {
  this.on = onMock;
  this.emit = emitMock;
  this.to = toMock;
});

jest.unstable_mockModule('socket.io', () => ({
  Server: serverCtorMock,
}));

const {
  emitCommentCreated,
  emitCommentDeleted,
  emitPhotoCreated,
  emitVoteChanged,
  getSocket,
  initSocket,
} = await import('../../../src/realtime/socket.js');

describe('realtime socket', () => {
  beforeEach(() => {
    onMock.mockReset();
    emitMock.mockReset();
    toEmitMock.mockReset();
    toMock.mockReset();
    toMock.mockImplementation(() => ({ emit: toEmitMock }));
    serverCtorMock.mockClear();
  });

  test('initSocket configura Socket.IO con CORS y deja instancia accesible', () => {
    const fakeHttpServer = {};

    const io = initSocket(fakeHttpServer, {
      origins: ['http://localhost:5173'],
      credentials: true,
    });

    expect(serverCtorMock).toHaveBeenCalledWith(fakeHttpServer, {
      cors: {
        origin: ['http://localhost:5173'],
        credentials: true,
      },
    });
    expect(io).toBeDefined();
    expect(getSocket()).toBe(io);
    expect(onMock).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  test('emitPhotoCreated publica evento global y por sala de comunidad', () => {
    initSocket({}, { origins: null, credentials: false });

    emitPhotoCreated({ id: 10, community_id: 7, title: 'Foto' });

    expect(emitMock).toHaveBeenCalledWith('photo:created', { id: 10, community_id: 7, title: 'Foto' });
    expect(toMock).toHaveBeenCalledWith('community:7');
    expect(toEmitMock).toHaveBeenCalledWith('photo:created', { id: 10, community_id: 7, title: 'Foto' });
  });

  test('emitPhotoCreated funciona aunque no llegue community_id', () => {
    initSocket({}, { origins: null, credentials: false });

    expect(() => emitPhotoCreated({ id: 1, title: 'Solo global' })).not.toThrow();
    expect(emitMock).toHaveBeenCalledWith('photo:created', { id: 1, title: 'Solo global' });
    expect(toMock).not.toHaveBeenCalled();
  });

  test('emitVoteChanged publica global, por foto y por comunidad', () => {
    initSocket({}, { origins: null, credentials: false });
    const payload = { photo_id: 4, community_id: 2, total_votes: 9, action: 'created' };

    emitVoteChanged(payload);

    expect(emitMock).toHaveBeenCalledWith('vote:changed', payload);
    expect(toMock).toHaveBeenCalledWith('photo:4');
    expect(toMock).toHaveBeenCalledWith('community:2');
    expect(toEmitMock).toHaveBeenCalledWith('vote:changed', payload);
  });

  test('emitCommentCreated publica global, por foto y por comunidad', () => {
    initSocket({}, { origins: null, credentials: false });
    const payload = { photo_id: 4, community_id: 2, comment: { id: 8, content: 'Texto' } };

    emitCommentCreated(payload);

    expect(emitMock).toHaveBeenCalledWith('comment:created', payload);
    expect(toMock).toHaveBeenCalledWith('photo:4');
    expect(toMock).toHaveBeenCalledWith('community:2');
    expect(toEmitMock).toHaveBeenCalledWith('comment:created', payload);
  });

  test('emitCommentDeleted publica global, por foto y por comunidad', () => {
    initSocket({}, { origins: null, credentials: false });
    const payload = { photo_id: 4, community_id: 2, comment_id: 8 };

    emitCommentDeleted(payload);

    expect(emitMock).toHaveBeenCalledWith('comment:deleted', payload);
    expect(toMock).toHaveBeenCalledWith('photo:4');
    expect(toMock).toHaveBeenCalledWith('community:2');
    expect(toEmitMock).toHaveBeenCalledWith('comment:deleted', payload);
  });
});
