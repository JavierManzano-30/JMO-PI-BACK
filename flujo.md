# Flujo De La Aplicacion (Version Corta)

## 1. Cometido
Backend para un concurso de fotografia:
- registro/login
- creacion de temas (admin)
- subida y borrado de fotos
- votaciones
- email de prueba
- realtime al crear foto

## 2. Flujo Tecnico Base
`Cliente -> Route -> Middleware -> Controller -> Model/Service -> DB/SMTP -> Response`

Capas:
- `routes`: endpoints
- `middleware`: JWT, roles, errores, upload
- `controllers`: reglas de negocio
- `models`: consultas a PostgreSQL
- `services`: integraciones (email)

## 3. Flujos Principales

### Auth
- `POST /api/v1/auth/register`: crea usuario y devuelve token.
- `POST /api/v1/auth/login`: valida credenciales y devuelve token.

### Temas
- `POST /api/v1/themes` (solo admin): crea tema activo/inactivo.

### Fotos
- `POST /api/v1/photos` (auth + multipart `image`): valida tema/categoria, guarda archivo en `uploads/`, crea registro y emite `photo:created`.
- `DELETE /api/v1/photos/{id}`: borrado logico (`is_deleted = true`) de foto propia.

### Votos
- `POST /api/v1/votes`: votar foto.
- `DELETE /api/v1/votes`: quitar voto.

### Email
- `POST /api/v1/email/test`: envia correo por SMTP (MailHog en local).

## 4. Realtime
- Socket.IO inicializado al arrancar.
- Evento: `photo:created`.
- Soporte de sala por comunidad: `community:<id>`.

## 5. Demo Rapida
1. `docker compose up -d db mailhog`
2. `npm run db:setup`
3. `npm run dev`
4. Swagger: `http://localhost:3000/docs`
5. MailHog: `http://localhost:8025`

## 6. Calidad
- Tests: `test/unit` y `test/funcional`
- Cobertura con Jest
- Lint con ESLint
- Analisis con SonarQube
