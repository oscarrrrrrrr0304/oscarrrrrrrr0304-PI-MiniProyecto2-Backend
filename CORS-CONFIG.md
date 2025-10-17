# Configuración CORS para Frontend

## CORS ya está configurado

El backend ya tiene CORS habilitado para:
- `http://localhost:5173` (Vite/React en desarrollo)
- `https://tu-frontend.com` (Producción - reemplaza con tu dominio real)

## Para cambiar las URLs permitidas:

Edita `src/index.ts` línea 13-18:

```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'https://tu-frontend-en-render.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

## Ejemplo de petición desde el frontend:

```javascript
// Registro
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    password: '123456',
    age: 25
  })
});

const data = await response.json();
console.log(data.token); // Guarda este token

// Petición autenticada
const profileResponse = await fetch('http://localhost:3000/api/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
});
```

## En producción (Render):

1. Actualiza la URL del origin en `src/index.ts` con tu dominio de frontend
2. Recompila: `npm run build`
3. Haz commit y push
4. Render desplegará automáticamente

## Nota:

Si usas un puerto diferente en desarrollo, cámbialo en la configuración de CORS.