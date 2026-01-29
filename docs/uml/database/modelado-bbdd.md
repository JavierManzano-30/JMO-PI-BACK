# Modelado de la Base de Datos  
## Proyecto Web Fotográfico — SnapNation

---

## 1. Introducción

Este documento describe el **modelado de la base de datos** del proyecto web fotográfico *SnapNation*.  
El objetivo del diseño es garantizar la **integridad de los datos**, el cumplimiento de las **reglas de negocio** y una estructura clara que permita la evolución del sistema.

El modelo está orientado a una base de datos **relacional**, implementada mediante **PostgreSQL**.

---

## 2. Justificación del Modelo Relacional

El sistema gestiona múltiples entidades relacionadas entre sí (usuarios, fotos, comunidades, temas, votos y moderación), así como restricciones que deben cumplirse de forma estricta.

Por este motivo, se ha optado por un **modelo relacional**, que permite:

- Definir relaciones mediante claves primarias y foráneas
- Aplicar restricciones de unicidad
- Garantizar coherencia en las operaciones críticas
- Mantener un historial fiable de moderación y participación

---

## 3. Entidades Principales

### 3.1 Usuarios

Representa a los usuarios registrados en la plataforma.

**Atributos principales:**
- id
- nombre
- email
- contraseña
- fecha_registro
- estado

Un usuario puede:
- Subir fotografías
- Participar en comunidades
- Votar fotografías
- Ser moderador en determinadas comunidades

---

### 3.2 Comunidades

Las comunidades agrupan usuarios y temas fotográficos.

**Atributos principales:**
- id
- nombre
- descripción
- fecha_creación

Relaciones:
- Una comunidad tiene múltiples usuarios
- Una comunidad puede tener varios temas activos

---

### 3.3 Temas

Los temas representan retos o categorías fotográficas dentro de una comunidad.

**Atributos principales:**
- id
- comunidad_id
- nombre
- fecha_inicio
- fecha_fin

Restricciones:
- Un usuario solo puede subir **una fotografía por tema**

---

### 3.4 Fotografías

Entidad central del sistema.

**Atributos principales:**
- id
- usuario_id
- tema_id
- url_imagen
- descripción
- fecha_publicación

Relaciones:
- Cada fotografía pertenece a un usuario
- Cada fotografía está asociada a un tema

---

### 3.5 Votos

Gestiona los votos que los usuarios realizan sobre las fotografías.

**Atributos principales:**
- id
- usuario_id
- fotografia_id
- fecha_voto

Restricciones:
- Un usuario **no puede votar la misma fotografía más de una vez**

---

### 3.6 Moderación

Registra las acciones de moderación realizadas sobre las fotografías.

**Atributos principales:**
- id
- fotografia_id
- moderador_id
- acción
- motivo
- fecha

Este registro permite mantener un **historial de decisiones**, garantizando trazabilidad y control.

---

### 3.7 Ganadores

Entidad encargada de registrar la fotografía ganadora de un tema.

**Atributos principales:**
- id
- tema_id
- fotografia_id
- fecha_selección

Restricciones:
- Cada tema puede tener **un único ganador**

---

## 4. Relaciones entre Entidades

- Usuario ↔ Comunidad (N:M)
- Comunidad ↔ Tema (1:N)
- Tema ↔ Fotografía (1:N)
- Usuario ↔ Fotografía (1:N)
- Usuario ↔ Fotografía mediante Votos (N:M)
- Fotografía ↔ Moderación (1:N)

Estas relaciones se implementan mediante **claves foráneas**, garantizando la integridad de los datos.

---

## 5. Reglas de Negocio Implementadas en la Base de Datos

- Un usuario no puede votar dos veces la misma fotografía
- Un usuario solo puede subir una fotografía por tema
- Un tema pertenece a una única comunidad
- Cada tema tiene un único ganador
- Todas las acciones de moderación quedan registradas

Estas reglas se aplican mediante **constraints**, claves únicas y relaciones referenciales.

---

## 6. Conclusión

El modelo de datos propuesto proporciona una estructura sólida y coherente con los requisitos del proyecto SnapNation.  
El uso de **PostgreSQL** permite implementar de forma eficiente las relaciones y restricciones necesarias, asegurando la consistencia de la información y facilitando la escalabilidad futura del sistema.

---

