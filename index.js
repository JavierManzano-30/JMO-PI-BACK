// Punto de entrada principal de la aplicacion.
import http from 'node:http';
import app from './src/app.js';
import config from './src/config.js';
import { initSocket } from './src/realtime/socket.js';
import { ensureDatabaseSetup } from './src/db/setup.js';

const server = http.createServer(app);

initSocket(server, {
  origins: config.cors.origins,
  credentials: config.cors.credentials,
});

async function startServer() {
  await ensureDatabaseSetup();

  server.listen(config.app.port, () => {
    console.log(`API listening on http://localhost:${config.app.port}`);
  });
}

startServer().catch((error) => {
  console.error('Error starting API:', error);
  process.exit(1);
});
