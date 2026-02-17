// Punto de entrada alternativo dentro de src.
import http from 'node:http';
import app from './app.js';
import config from './config.js';
import { initSocket } from './realtime/socket.js';

const server = http.createServer(app);

initSocket(server, {
  origins: config.cors.origins,
  credentials: config.cors.credentials,
});

server.listen(config.app.port, () => {
  console.log(`API listening on http://localhost:${config.app.port}`);
});
