# README Futuro - JMO-Backend

Documento de ideas y mejoras futuras del proyecto.

## 1) Modo movil tipo Tinder (swipe)

### Objetivo
Permitir votar fotos de forma rapida en movil:
- deslizar a la derecha = me gusta (voto)
- deslizar a la izquierda = pasar sin votar

### Propuesta funcional
- pantalla de visualizacion secuencial de fotos (1 foto principal por vez)
- carga progresiva de nuevas fotos al deslizar
- evitar mostrar fotos ya vistas en la sesion

### Backend (propuesta)
- reutilizar `POST /api/v1/votes` para el swipe a la derecha
- crear endpoint para feed de swipe, por ejemplo:
  - `GET /api/v1/photos/swipe?theme_id=...`
- opcion futura: registrar descartes para no repetir contenido en otras sesiones

### Criterios de aceptacion
- en movil se puede votar en menos de 2 toques
- una foto no se vota 2 veces por el mismo usuario
- la navegacion entre fotos es fluida y sin recargas completas

## 2) Vista exclusiva de fotos ya votadas por mi

### Objetivo
Mostrar un listado/galeria solo con fotos que el usuario autenticado ya ha votado.

### Propuesta funcional
- nueva seccion "Mis votos"
- filtros opcionales por tema o comunidad
- acceso al detalle de cada foto votada

### Backend (propuesta)
- crear endpoint especifico, por ejemplo:
  - `GET /api/v1/users/me/voted-photos`
- devolver metadatos utiles:
  - `photo_id`, `title`, `image_url`, `theme_id`, `votes_count`, `voted_at`

### Criterios de aceptacion
- el listado solo incluye fotos votadas por el usuario autenticado
- los datos se muestran paginados
- tiempo de respuesta adecuado para uso normal

## Priorizacion

1. Implementar vista "Mis votos" (impacto claro y bajo riesgo).
2. Implementar swipe movil (mayor impacto UX, mas trabajo frontend).

## Nota

Estas funcionalidades son roadmap: no estan implementadas en la version actual.

## Gabri

- no escuchar a Antonio
- actualizar temas
- repasito test funcionales
- docker file
- cronyo