// Creamos la instancia de Express y delegamos toda la configuracion a los loaders.
import express from 'express';
import loaders from './loaders/index.js';

const app = express();
loaders.init(app);

export default app;
