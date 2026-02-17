# JMO-Backend

Backend API de SnapNation desarrollado con `Node.js + Express` para 2º DAW.

## Resumen

Este proyecto implementa:
- API REST versionada (`/api/v1`)
- autenticación con JWT (registro/login y rutas protegidas)
- gestión de usuarios, temas, fotos, votos, comunidades y categorías
- subida de imágenes con `multer` en almacenamiento local
- envío de correo de prueba por SMTP (MailHog en local)
- documentación Swagger/OpenAPI
- eventos realtime con Socket.IO (`photo:created`)
- test unitarios y m2m con cobertura
- análisis de calidad en SonarQube
- integración de Drizzle ORM (configuración, schema y uso en modelo de categorías)

## Arquitectura

Estructura por capas:
- `src/routes`: define endpoints y middlewares
- `src/controllers`: lógica de negocio y validaciones
- `src/models`: acceso a datos
- `src/middleware`: autenticación, permisos, manejo de errores
- `src/services`: integraciones externas (email)
- `src/db`: conexión y utilidades de base de datos
- `src/realtime`: WebSocket/Socket.IO
- `src/utils`: helpers reutilizables

Flujo general:
1. request HTTP -> `routes`
2. middlewares (`authenticate`, `requireRole`, `upload`, etc.)
3. controller
4. model/service
5. respuesta JSON estandarizada o error

## Endpoints principales

Base URL: `http://localhost:3000/api/v1`

### Health
- `GET /health` (root)
- `GET /api/v1/health`

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Users
- `GET /users/me` (auth)
- `PATCH /users/me` (auth)
- `DELETE /users/me` (auth)
- `DELETE /users/:id` (auth + admin)

### Photos
- `GET /photos`
- `POST /photos` (auth + upload `image`)
- `GET /photos/:id` (auth opcional)
- `DELETE /photos/:id` (auth)

### Themes
- `GET /themes`
- `POST /themes` (auth + admin)
- `GET /themes/:id`

### Communities
- `GET /communities`
- `GET /communities/:id`

### Categories
- `GET /categories`

### Votes
- `POST /votes` (auth)
- `DELETE /votes` (auth)

### Email
- `POST /email/test`

Spec OpenAPI: `docs/api/openapi.yaml`

## Swagger / OpenAPI

- UI: `GET /docs`
- JSON: `GET /openapi.json`
- Archivo fuente: `docs/api/openapi.yaml`

## Seguridad

- JWT firmado con `JWT_SECRET`
- auth middleware en `src/middleware/auth.js`
- roles con `src/middleware/requireRole.js`
- hash de contraseñas con `bcryptjs` (`register`/`login`)
- límites defensivos de payload:
  - `HTTP_BODY_LIMIT`
  - `UPLOAD_MAX_FILE_SIZE_BYTES`
  - `UPLOAD_MAX_FILES`
  - `UPLOAD_MAX_FIELDS`

## Imágenes

Subida:
- endpoint `POST /api/v1/photos`
- multipart con campo `image`

Almacenamiento:
- carpeta local `uploads/`
- exposición estática por `/uploads/*`

Nombre de fichero:
- generado de forma segura con `randomBytes` + timestamp

## Realtime (WebSocket)

- servidor Socket.IO inicializado en `index.js`
- evento emitido al crear foto: `photo:created`
- room opcional por comunidad: `subscribe:community`

## Base de datos

Motor: PostgreSQL

Esquema SQL base:
- `sql/schema.sql`
- `sql/seed.sql`

Conexión:
- `src/db/pool.js` (`pg`)

Drizzle integrado:
- config: `drizzle.config.js`
- schema: `src/db/schema.js`
- instancia: `src/db/drizzle.js`
- ejemplo de uso real: `src/models/categoriesModel.js`

Nota de uso:
- en este proyecto el flujo principal de creación de schema es `npm run db:setup`
- si se usa `drizzle:migrate`, debe ser sobre una base limpia o en un flujo exclusivo de migraciones Drizzle

## Arranque local

1. Entrar en carpeta:
```bash
cd JMO-Backend
```

2. Levantar servicios:
```bash
docker compose up -d db mailhog
```

3. Instalar dependencias:
```bash
npm install
```

4. Configurar entorno:
- copiar `.env.example` a `.env`
- revisar `DATABASE_URL`, `JWT_SECRET`, SMTP, etc.

5. Aplicar schema y seed:
```bash
npm run db:setup
```

6. Ejecutar API:
```bash
npm run dev
```

## Scripts disponibles

- `npm start`: arranque normal
- `npm run dev`: arranque con nodemon
- `npm run db:setup`: aplica schema + seed SQL
- `npm test`: tests con cobertura
- `npm run test:fast`: tests sin coverage
- `npm run test:unit`: unitarios
- `npm run test:m2m`: m2m
- `npm run sonar`: tests + scanner SonarQube
- `npm run db:drizzle:generate`
- `npm run db:drizzle:migrate`
- `npm run db:drizzle:push`
- `npm run db:drizzle:studio`

## MailHog (correo local)

- SMTP: `127.0.0.1:1025`
- UI: `http://localhost:8025`
- endpoint de prueba:
  - `POST /api/v1/email/test`

## Testing y cobertura

Frameworks:
- Jest
- Supertest

Carpetas:
- `test/unit`
- `test/funcional`

Estado actual esperado:
- cobertura global >= 80% líneas

## SonarQube

1. Levantar SonarQube local:
```bash
docker compose -f docker-compose.sonarqube.yml up -d
```

2. Crear token en SonarQube (`My Account > Security`)

3. Exportar token:
- PowerShell:
```powershell
$env:SONAR_TOKEN="tu_token"
```
- Bash:
```bash
export SONAR_TOKEN=tu_token
```

4. Ejecutar análisis:
```bash
npm run sonar
```

## Postman

Importar `docs/api/openapi.yaml` en Postman para generar la colección automáticamente.

Colección de apoyo manual:
- `api.http`

## Documentación y diagramas

- OpenAPI: `docs/api/openapi.yaml`
- UML componentes: `docs/uml/componentes/`
- UML base de datos: `docs/uml/database/`
- UML respuestas JSON: `docs/uml/json/`
- Explicación extendida del proyecto: `explicacion.md`
- Roadmap de mejoras futuras: `README.futuro.md`

## Despliegue (estado actual y propuesta)

Estado actual:
- despliegue local para desarrollo con Docker (`db`, `mailhog`) + ejecución Node (`npm run dev/start`)

Propuesta producción:
1. contenedor para API (Dockerfile)
2. reverse proxy (Nginx/Caddy) con HTTPS
3. variables de entorno seguras para JWT/DB/SMTP
4. almacenamiento de imágenes en servicio externo (S3/Cloudinary) en lugar de disco local
5. pipeline CI/CD con tests + Sonar antes de desplegar

## Despliegue en Render

Se incluye blueprint en `render.yaml` en la raiz del repositorio:
- servicio web Node (`jmo-backend`)
- base de datos PostgreSQL gestionada (`jmo-backend-db`)
- variables de entorno base

Pasos recomendados:
1. Subir repo a GitHub.
2. En Render: `New +` -> `Blueprint`.
3. Seleccionar el repositorio y aplicar `render.yaml`.
4. Tras primer deploy, abrir `Shell` del servicio y ejecutar:
```bash
npm run db:setup
```
5. Verificar:
- `GET /health`
- `GET /api/v1/health`
- `GET /docs`

Notas importantes:
- En Render, `uploads/` es almacenamiento efimero en el contenedor web.
- Si hay redeploy/restart, los ficheros locales pueden perderse.
- Para producción real, mover imágenes a S3/Cloudinary.

## Autor

- Javier Manzano Oliveros
- 2º DAW
