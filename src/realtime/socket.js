// Capa realtime con Socket.IO para notificaciones en tiempo real.
import { Server } from 'socket.io';

let ioInstance = null;

function buildCors(originList, credentials) {
  return {
    origin: originList && originList.length > 0 ? originList : true,
    credentials: Boolean(credentials),
  };
}

export function initSocket(server, { origins = null, credentials = false } = {}) {
  ioInstance = new Server(server, {
    cors: buildCors(origins, credentials),
  });

  ioInstance.on('connection', (socket) => {
    // Suscripcion opcional para escuchar solo eventos de una comunidad concreta.
    socket.on('subscribe:community', (communityId) => {
      const parsed = Number.parseInt(String(communityId), 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        socket.join(`community:${parsed}`);
      }
    });
  });

  return ioInstance;
}

export function getSocket() {
  return ioInstance;
}

export function emitPhotoCreated(photo) {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit('photo:created', photo);

  // Enviamos tambien a una sala de comunidad para facilitar filtrado en frontend.
  if (photo?.community_id) {
    ioInstance.to(`community:${photo.community_id}`).emit('photo:created', photo);
  }
}
