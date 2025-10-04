

## Endpoints Disponibles

### Autenticación

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario autenticado

### Usuarios (requiere autenticación)

- `GET /api/users` - Obtener todos los usuarios (solo admin)
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario (solo admin)

### Rutas de sistema

- `GET /` - Información básica de la API
- `GET /health` - Estado de salud del servidor

## 🛠️ Instalación Local

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/oscarrrrrrrr0304/oscarrrrrrrr0304-PI-MiniProyecto2-Backend.git
   cd oscarrrrrrrr0304-PI-MiniProyecto2-Backend
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env
   ```

   Edita el archivo `.env` con tus configuraciones.

4. **Ejecutar en modo desarrollo:**

   ```bash
   npm run dev
   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   npm start
   ```

## 🌐 Despliegue en Render

### Paso 1: Preparar tu base de datos MongoDB

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Configura el acceso de red (permite todas las IPs: 0.0.0.0/0)
4. Crea un usuario de base de datos
5. Obtén tu connection string

### Paso 2: Desplegar en Render

1. Ve a [Render.com](https://render.com) y crea una cuenta
2. Conecta tu repositorio de GitHub
3. Crea un nuevo "Web Service"
4. Configura el servicio:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

### Paso 3: Configurar Variables de Entorno en Render

En la sección "Environment" de tu servicio en Render, agrega:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=tu_connection_string_de_mongodb_atlas
JWT_SECRET=tu_jwt_secret_super_seguro
```

**⚠️ Importante:**

- Reemplaza `tu_connection_string_de_mongodb_atlas` con tu string real de MongoDB Atlas
- Genera un JWT_SECRET seguro (puedes usar: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

### Paso 4: Deploy

1. Haz push de tu código a GitHub
2. Render automáticamente desplegará tu aplicación
3. Tu API estará disponible en: `https://tu-app-name.onrender.com`

## 📚 Uso de la API

### Registrar un usuario:

```bash
curl -X POST https://tu-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "password": "123456"
  }'
```

### Iniciar sesión:

```bash
curl -X POST https://tu-app-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "password": "123456"
  }'
```

### Acceder a rutas protegidas:

```bash
curl -X GET https://tu-app-name.onrender.com/api/auth/profile \
  -H "Authorization: Bearer tu_token_jwt_aqui"
```

## 🔧 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Superset tipado de JavaScript
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - JSON Web Tokens para autenticación
- **bcrypt** - Hash de contraseñas
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Gestión de variables de entorno

## 📝 Estructura del Proyecto

```
src/
├── controllers/     # Controladores de la aplicación
├── middleware/      # Middleware personalizado
├── models/         # Modelos de MongoDB
├── routes/         # Rutas de la API
└── index.ts        # Punto de entrada de la aplicación
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.
