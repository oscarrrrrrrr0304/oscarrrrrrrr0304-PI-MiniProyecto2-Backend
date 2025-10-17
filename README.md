
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

---

## Uso de la API

La API permite gestionar usuarios y autenticación. A continuación se describen los endpoints principales y sus respuestas:

### Autenticación

#### 1. Registrar usuario
- **POST** `/api/auth/register`
- **Body:** `{ "name": "Nombre", "email": "correo", "password": "clave", "role": "user|admin" }`
- **Respuesta exitosa:**
   ```json
   {
      "message": "Usuario registrado exitosamente",
      "token": "JWT_TOKEN",
      "user": { "id": "...", "name": "...", "email": "...", "role": "...", "createdAt": "..." }
   }
   ```
- **Errores:** Usuario ya existe, datos faltantes.

#### 2. Login
- **POST** `/api/auth/login`
- **Body:** `{ "email": "correo", "password": "clave" }`
- **Respuesta exitosa:**
   ```json
   {
      "message": "Inicio de sesión exitoso",
      "token": "JWT_TOKEN",
      "user": { "id": "...", "name": "...", "email": "...", "role": "...", "createdAt": "..." }
   }
   ```
- **Errores:** Credenciales inválidas.

#### 3. Perfil de usuario
- **GET** `/api/auth/profile`  
   (Requiere token JWT en el header `Authorization: Bearer TOKEN`)
- **Respuesta:**
   ```json
   {
      "user": { "id": "...", "name": "...", "email": "...", "role": "...", "createdAt": "...", "updatedAt": "..." }
   }
   ```

---

### Usuarios

> Todos los endpoints de usuarios requieren autenticación. Algunos requieren rol `admin`.

#### 1. Obtener todos los usuarios (solo admin)
- **GET** `/api/users/`
- **Respuesta:**
   ```json
   {
      "message": "Usuarios obtenidos exitosamente",
      "users": [ ... ],
      "total": 5
   }
   ```

#### 2. Obtener usuario por ID
- **GET** `/api/users/:id`
- **Respuesta:**
   ```json
   {
      "message": "Usuario obtenido exitosamente",
      "user": { ... }
   }
   ```

#### 3. Actualizar usuario (admin o el mismo usuario)
- **PUT** `/api/users/:id`
- **Body:** `{ "name": "...", "email": "...", "role": "user|admin" }`
- **Respuesta:**
   ```json
   {
      "message": "Usuario actualizado exitosamente",
      "user": { ... }
   }
   ```

#### 4. Eliminar usuario (solo admin)
- **DELETE** `/api/users/:id`
- **Respuesta:**
   ```json
   {
      "message": "Usuario eliminado exitosamente"
   }
   ```

---

**Notas:**
- Todos los endpoints devuelven errores en formato `{ "error": "mensaje" }` si ocurre algún problema.
- Para endpoints protegidos, incluye el token JWT en el header:  
   `Authorization: Bearer TU_TOKEN`
