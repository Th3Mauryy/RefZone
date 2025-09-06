# 📡 API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://tu-app.vercel.app/api
```

## Authentication
Todas las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

## 🔐 Auth Routes

### POST /auth/register
Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "nombre": "Juan Pérez",
  "edad": 25,
  "contacto": "+1234567890",
  "experiencia": "intermedio",
  "role": "arbitro"
}
```

**Response:**
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan Pérez",
    "role": "arbitro"
  }
}
```

### POST /auth/login
Inicia sesión de usuario existente.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response:**
```json
{
  "message": "Inicio de sesión exitoso",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan Pérez",
    "role": "arbitro"
  }
}
```

## ⚽ Games Routes

### GET /games
Lista todos los partidos disponibles.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "games": [
    {
      "_id": "game_id",
      "equipoLocal": "Equipo A",
      "equipoVisitante": "Equipo B", 
      "fecha": "2025-01-15",
      "hora": "15:00",
      "cancha": "Cancha 1",
      "estado": "disponible",
      "organizador": "organizador_id"
    }
  ]
}
```

### POST /games
Crea un nuevo partido (solo organizadores).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "equipoLocal": "Equipo A",
  "equipoVisitante": "Equipo B",
  "fecha": "2025-01-15",
  "hora": "15:00",
  "cancha": "Cancha 1",
  "descripcion": "Partido de liga amateur"
}
```

### POST /games/:id/apply
Postularse a un partido (solo árbitros).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Postulación exitosa",
  "application": {
    "gameId": "game_id",
    "userId": "user_id",
    "status": "pendiente"
  }
}
```

### POST /games/:id/assign
Asignar árbitro a un partido (solo organizadores).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "arbitroId": "user_id"
}
```

## 📊 Stats Routes

### GET /games/stats
Obtiene estadísticas del usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalPartidos": 15,
  "proximosPartidos": 3,
  "partidosSinArbitro": 5,
  "partidosArbitrados": 12
}
```

## 🚫 Error Responses

### 400 Bad Request
```json
{
  "error": "Datos de entrada inválidos",
  "details": "El email ya está registrado"
}
```

### 401 Unauthorized
```json
{
  "error": "Token inválido o expirado"
}
```

### 403 Forbidden
```json
{
  "error": "No tienes permisos para esta acción"
}
```

### 404 Not Found
```json
{
  "error": "Recurso no encontrado"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

## 📝 Rate Limiting

- **15 requests por minuto** para rutas de autenticación
- **100 requests por minuto** para otras rutas
- Headers de respuesta incluyen límites actuales

## 🔄 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
