# API de Calificaciones y Comentarios

## Descripción
Sistema de calificaciones (1-5 estrellas) y comentarios integrado directamente en el modelo de Video para facilitar el manejo desde el backend.

## Modelo de Datos

### Rating
```typescript
{
  userId: ObjectId,      // ID del usuario que calificó
  rating: Number,        // Calificación (1-5)
  createdAt: Date       // Fecha de la calificación
}
```

### Comment
```typescript
{
  _id: ObjectId,        // ID del comentario (autogenerado)
  userId: ObjectId,     // ID del usuario que comentó
  userName: String,     // Nombre del usuario
  text: String,         // Texto del comentario (máx 500 caracteres)
  createdAt: Date      // Fecha del comentario
}
```

### Video (propiedades nuevas)
```typescript
{
  ...propiedades existentes,
  ratings: Rating[],           // Array de calificaciones
  averageRating: Number,       // Promedio de calificaciones (0-5)
  comments: Comment[]          // Array de comentarios
}
```

## Endpoints

### 1. Agregar o Actualizar Calificación
**POST** `/api/videos/:videoId/rating`

**Autenticación:** Requerida (Bearer Token)

**Body:**
```json
{
  "rating": 5
}
```

**Validaciones:**
- `rating` debe ser un número entre 1 y 5
- Si el usuario ya calificó el video, actualiza la calificación existente
- Recalcula automáticamente el promedio

**Respuesta exitosa (200):**
```json
{
  "message": "Calificación agregada",
  "averageRating": 4.5,
  "totalRatings": 10,
  "userRating": 5
}
```

**Ejemplos de uso:**
```bash
# Calificar con 5 estrellas
curl -X POST http://localhost:3000/api/videos/VIDEO_ID/rating \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'

# Actualizar calificación a 3 estrellas
curl -X POST http://localhost:3000/api/videos/VIDEO_ID/rating \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 3}'
```

---

### 2. Obtener Calificación del Usuario
**GET** `/api/videos/:videoId/rating`

**Autenticación:** Requerida (Bearer Token)

**Respuesta exitosa (200):**
```json
{
  "userRating": 5,           // null si el usuario no ha calificado
  "averageRating": 4.5,
  "totalRatings": 10
}
```

**Ejemplo de uso:**
```bash
curl -X GET http://localhost:3000/api/videos/VIDEO_ID/rating \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Agregar Comentario
**POST** `/api/videos/:videoId/comments`

**Autenticación:** Requerida (Bearer Token)

**Body:**
```json
{
  "text": "¡Excelente video! Me encantó."
}
```

**Validaciones:**
- `text` es requerido y no puede estar vacío
- Máximo 500 caracteres
- Se agrega automáticamente el nombre del usuario y la fecha

**Respuesta exitosa (201):**
```json
{
  "message": "Comentario agregado exitosamente",
  "comment": {
    "userId": "USER_ID",
    "userName": "John Doe",
    "text": "¡Excelente video! Me encantó.",
    "createdAt": "2025-10-29T10:30:00.000Z"
  },
  "totalComments": 15
}
```

**Ejemplo de uso:**
```bash
curl -X POST http://localhost:3000/api/videos/VIDEO_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "¡Excelente video! Me encantó."}'
```

---

### 4. Obtener Comentarios
**GET** `/api/videos/:videoId/comments?page=1&limit=20`

**Autenticación:** No requerida

**Query params:**
- `page` (opcional): Número de página, default: 1
- `limit` (opcional): Comentarios por página, default: 20

**Respuesta exitosa (200):**
```json
{
  "comments": [
    {
      "_id": "COMMENT_ID",
      "userId": "USER_ID",
      "userName": "John Doe",
      "text": "¡Excelente video! Me encantó.",
      "createdAt": "2025-10-29T10:30:00.000Z"
    }
  ],
  "currentPage": 1,
  "totalPages": 3,
  "totalComments": 45
}
```

**Características:**
- Ordenados por fecha (más recientes primero)
- Paginación automática
- No requiere autenticación (lectura pública)

**Ejemplo de uso:**
```bash
# Primera página (20 comentarios)
curl -X GET http://localhost:3000/api/videos/VIDEO_ID/comments

# Página 2 con 10 comentarios
curl -X GET "http://localhost:3000/api/videos/VIDEO_ID/comments?page=2&limit=10"
```

---

### 5. Eliminar Comentario
**DELETE** `/api/videos/:videoId/comments/:commentId`

**Autenticación:** Requerida (Bearer Token)

**Validaciones:**
- Solo el autor del comentario puede eliminarlo
- Retorna error 403 si el usuario intenta eliminar un comentario de otro usuario

**Respuesta exitosa (200):**
```json
{
  "message": "Comentario eliminado exitosamente",
  "totalComments": 44
}
```

**Ejemplo de uso:**
```bash
curl -X DELETE http://localhost:3000/api/videos/VIDEO_ID/comments/COMMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Errores Comunes

### 400 Bad Request
```json
{
  "error": "La calificación debe ser un número entre 1 y 5"
}
```
```json
{
  "error": "El texto del comentario es requerido"
}
```
```json
{
  "error": "El comentario no puede exceder 500 caracteres"
}
```

### 401 Unauthorized
```json
{
  "error": "No token, autorización denegada"
}
```

### 403 Forbidden
```json
{
  "error": "No tienes permiso para eliminar este comentario"
}
```

### 404 Not Found
```json
{
  "error": "Video no encontrado"
}
```
```json
{
  "error": "Comentario no encontrado"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

---

## Ventajas del Diseño

1. **Simplicidad**: Todo está en el modelo de Video, sin necesidad de tablas adicionales
2. **Rendimiento**: Acceso rápido a calificaciones y comentarios sin joins
3. **Atomicidad**: Las operaciones son atómicas en el documento de Video
4. **Escalabilidad**: Fácil de manejar con el sistema de paginación incluido

## Consideraciones

- Las calificaciones son únicas por usuario (un usuario = una calificación)
- El promedio se recalcula automáticamente al agregar/actualizar calificaciones
- Los comentarios están ordenados por fecha (más recientes primero)
- Los comentarios tienen paginación para manejar grandes cantidades
- Solo el autor puede eliminar sus propios comentarios

## Integración con el Frontend

El video incluirá automáticamente las nuevas propiedades en los endpoints existentes:

```javascript
// GET /api/videos/:id ahora retorna:
{
  "video": {
    "pexelsId": 123,
    "url": "...",
    "likesCount": 50,
    "ratings": [...],           // ← NUEVO
    "averageRating": 4.5,       // ← NUEVO
    "comments": [...]           // ← NUEVO
  }
}
```
