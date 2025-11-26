import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// import pkg from 'pg';

// const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
// const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/proyecto';
// const pool = new Pool({ connectionString: databaseUrl });

// Health endpoint - funciona sin DB
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Health endpoint con prefijo /api/v1
app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true });
});

// Endpoints temporales para probar Postman (sin DB)
app.post('/api/v1/auth/register', (req, res) => {
  // Simulación temporal - devuelve respuesta mock
  res.status(201).json({
    token: 'mock_jwt_token_' + Date.now(),
    user: {
      id: 1,
      username: req.body.username || 'testuser',
      email: req.body.email || 'test@example.com',
      display_name: null,
      community_id: req.body.community_id || 1
    }
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  // Simulación temporal
  res.status(200).json({
    token: 'mock_jwt_token_' + Date.now(),
    user: {
      id: 1,
      username: 'testuser',
      email: req.body.email || 'test@example.com',
      display_name: 'Test User',
      community_id: 1
    }
  });
});

app.get('/api/v1/photos', (req, res) => {
  // Simulación temporal con paginación
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  res.json({
    data: [],
    meta: {
      total: 0,
      page: page,
      limit: limit,
      total_pages: 0
    }
  });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  console.log('⚠️  Modo temporal: Sin base de datos (para pruebas de Postman)');
});


