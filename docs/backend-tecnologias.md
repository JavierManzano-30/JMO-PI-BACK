# Tecnologías Backend — Proyecto Web Fotográfico (SnapNation)

## 1. Elección del Backend

El backend del proyecto se desarrollará utilizando **Node.js con Express**, siguiendo una arquitectura de **API REST**, que será consumida por el frontend de la aplicación web fotográfica.

Esta elección permite una separación clara entre la lógica de negocio, el acceso a datos y la capa de presentación, facilitando el mantenimiento y la escalabilidad del proyecto.

---

## 2. Node.js y Express

Se ha elegido **Node.js** como entorno de ejecución por su modelo asíncrono y orientado a eventos, especialmente adecuado para aplicaciones web que realizan numerosas operaciones de entrada/salida, como:

- Carga y consulta de fotografías
- Gestión de votos y comentarios
- Obtención de listados (feeds, rankings, retos)
- Autenticación y control de usuarios

**Express** se utilizará como framework backend para definir las rutas de la API, aplicar middleware de validación y gestionar las peticiones HTTP de forma estructurada y ligera.

---

## 3. Base de Datos: PostgreSQL

El sistema utilizará **PostgreSQL** como sistema gestor de base de datos relacional.

Esta elección se debe a que el proyecto maneja un dominio con múltiples entidades relacionadas (usuarios, fotos, temas, comunidades, votos y moderación), así como reglas de negocio que requieren:

- Integridad referencial mediante claves primarias y foráneas
- Restricciones únicas para evitar duplicidades (por ejemplo, votos repetidos)
- Consistencia de datos en operaciones críticas

PostgreSQL permite definir estas reglas directamente a nivel de base de datos, garantizando la fiabilidad y coherencia del sistema.

---

## 4. Comunicación Backend–Base de Datos

El backend se conectará a PostgreSQL mediante un cliente u ORM compatible con Node.js, permitiendo:

- Ejecución de consultas SQL
- Uso de transacciones para operaciones sensibles (votaciones, ganadores)
- Organización clara del acceso a datos

La lógica de negocio se implementará en el servidor, evitando depender únicamente del frontend para validar reglas del sistema.

---

## 5. Conclusión

La combinación de **Node.js + Express + PostgreSQL** proporciona una solución robusta, escalable y coherente con los requisitos del proyecto, permitiendo implementar una aplicación web fotográfica moderna, segura y con un modelo de datos consistente.
