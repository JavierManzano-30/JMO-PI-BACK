# 🖥 Backend — SnapNation (Sprint 5)

El backend de **SnapNation** es una API REST desarrollada en **Node.js + Express**, que gestiona la autenticación, publicación y votación de fotos, moderación de contenido y administración de temas semanales. Persiste los datos en **PostgreSQL** y en esta implementación base almacena imágenes en local con **Multer** (Cloudinary puede añadirse más adelante).

En este sprint el objetivo no es desarrollar nuevas funcionalidades, sino **documentar el diseño completo del backend y su relación con el frontend**, a través de diagramas UML realizados con PlantUML.

---

## ✅ Estado actual (implementación base)

Actualmente el backend incluye:

- Conexión a PostgreSQL mediante `pg` y scripts SQL (`sql/schema.sql` + `sql/seed.sql`)
- Endpoints base según `docs/api/openapi.yaml`
- Autenticación JWT (registro/login y rutas protegidas)
- Subida de imágenes con `multer` y almacenamiento local en `/uploads`
- Respuestas y errores siguiendo las convenciones de `docs/api/convenciones.md`

> Nota: Cloudinary queda pendiente de integrar si se desea en producción.

---

## 🧩 Relación con los diagramas del Sprint 5

### 🎭 Casos de Uso (Backend como proveedor de funcionalidades)

El backend da soporte directo a los casos de uso del sistema:

- Registrar usuario
- Iniciar sesión
- Subir foto
- Votar foto
- Eliminar foto (usuario)
- Crear tema semanal (admin)
- Moderar fotos (admin)
- Calcular y mostrar ganadores

📍 Diagrama disponible en: `docs/sprint5/usecase/`

---

### 🔁 Diagramas de Actividad (Flujos que el backend valida)

Los diagramas representan la lógica real que el backend debe validar:

- Subida y eliminación de fotos:  
  Control de autenticación, límite temporal y propiedad.
- Votar foto:  
  Control de voto único por usuario y autenticación.
- Moderación de fotos (admin):  
  Eliminar o advertir contenido.
- Crear tema semanal:  
  Validación de fechas y desactivación del tema anterior.
- Ver Perfil:  
  Carga de estadísticas y datos del usuario.

📍 Diagramas: `docs/sprint5/activities/`

---

### ⏱ Diagramas de Secuencia (API REST documentada)

Establecen exactamente cómo el backend debe procesar cada solicitud del frontend:

| Proceso | Acción del backend |
|---------|-------------------|
| Subir Foto | Valida JWT → Envia imagen a Cloudinary → Guarda datos en BD |
| Votar Foto | Verifica autenticación → Comprueba si ya votó → Registra voto |
| Ver Ganadores | Consulta estadísticas y devuelve los ganadores |

📍 Ubicación: `docs/sprint5/sequence/`

---

### 📦 Diagramas JSON (Contratos de API)

Los JSON definieron los contratos de datos entre Frontend y Backend, incluyendo:

- Estructura de respuesta al subir foto (con URL, metadatos y autor)
- Estructura de respuesta para ganadores semanales (con votos, autor, foto, tema)

📍 Diagramas: `docs/sprint5/json/`

Estos contratos permiten construir controladores, validaciones y DTOs en el backend.

---

### 🗄 Modelo IE — Modelo de Datos Relacional

El modelo entidad–relación (IE) define las tablas que el backend debe implementar:

| Entidad | Descripción |
|---------|-------------|
| `users` | Autenticación, roles y perfiles |
| `photos` | Fotos publicadas, URL y metadatos |
| `votes` | Registro de votos únicos por usuario y foto |
| `themes` | Temas semanales activos y anteriores |
| `moderation` | Historial de acciones de moderación |

📍 Diagrama: `docs/sprint5/database/`

Este modelo guía la creación del esquema en PostgreSQL y la lógica de negocio del backend.

---

### 🧱 Diagrama de Componentes (Arquitectura del Backend)

El backend se desglosa en módulos:

| Componente | Responsabilidad |
|------------|----------------|
| `AuthController` | Login, registro y gestión de JWT |
| `PhotoController` | Subida, listado, detalle, eliminación |
| `VoteController` | Registro de votos y restricciones |
| `ThemeController` | Creación y activación de temas |
| `ModerationController` | Acciones administrativas |
| `CloudinaryService` | Gestión de subida y borrado de imágenes |
| `DBService` | Acceso a PostgreSQL |

📍 Diagrama: `docs/sprint5/components/`

---

## 🚀 Puesta en marcha del Backend

Para ejecutar el backend:

1. Acceder a `JMO-PI-BACK`
2. Levantar la base de datos con Docker: `docker compose up -d db`
3. Instalar dependencias con `npm install`
4. Crear el archivo `.env` a partir de `.env.example`
5. Aplicar esquema y seed: `npm run db:setup`
6. Ejecutar la API con `npm run dev`

---

## 🔐 Autenticación y Seguridad

- El backend genera JWT al iniciar sesión.
- Cada petición protegida requiere el token en encabezado `Authorization: Bearer`.
- Hay rutas restringidas a administradores.
- La validación de autenticación/roles está descrita en:
  - Diagramas de Secuencia
  - Diagramas de Actividad

---

## 🛠 Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| Node.js + Express | API REST |
| PostgreSQL | Persistencia de datos |
| JWT | Autenticación |
| Multer | Subida de imágenes (almacenamiento local) |
| Docker | Servicio de base de datos opcional |
| PlantUML | Documentación y modelado |

---

👨‍💻 Autor: **Javier Manzano Oliveros**  
📚 2º DAW — Proyecto Integrado — Sprint 5
