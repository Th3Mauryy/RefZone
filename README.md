# 🏆 RefZone - Plataforma de Gestión Deportiva

**RefZone** es una plataforma web completa para la gestión de partidos deportivos, diseñada para conectar organizadores con árbitros de manera eficiente y profesional.

## 🌟 Características Principales

- 🏟️ **Gestión de Partidos**: Crear, editar y eliminar partidos deportivos
- ⚽ **Gestión de Canchas**: Administrar múltiples ubicaciones deportivas  
- 👥 **Sistema de Usuarios**: Perfiles diferenciados para organizadores y árbitros
- 📝 **Postulaciones**: Sistema de aplicaciones para árbitros
- 📊 **Estadísticas**: Dashboard con métricas y reportes
- 📧 **Notificaciones**: Sistema de emails automáticos
- 🔐 **Seguridad Avanzada**: Autenticación JWT, encriptación y protección CSRF
- 🖼️ **Gestión de Imágenes**: Subida y almacenamiento en la nube

## 🛠️ Stack Tecnológico

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

### Cloud & Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta MongoDB Atlas
- Cuenta Cloudinary

### Clonar el repositorio
```bash
git clone https://github.com/Th3Mauryy/RefZone.git
cd RefZone
```

### Configurar Backend
```bash
cd mi-backend
npm install

# Crear archivo .env basado en .env.example
cp .env.example .env
# Editar .env con tus credenciales reales

npm run dev
```

### Configurar Frontend
```bash
cd mi-frontend
npm install
npm run dev
```

### Variables de Entorno Requeridas

```env
# Backend (.env)
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/refzone
JWT_SECRET=tu-jwt-secreto-super-seguro
BCRYPT_SECRET=tu-bcrypt-secreto
SESSION_SECRET=tu-session-secreto
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
NODE_ENV=development
PORT=5000
```

## 📱 Funcionalidades Detalladas

### Para Organizadores
- ✅ Crear y gestionar partidos
- ✅ Administrar canchas deportivas
- ✅ Asignar árbitros a partidos
- ✅ Ver postulaciones de árbitros
- ✅ Enviar notificaciones automáticas
- ✅ Generar reportes y estadísticas

### Para Árbitros  
- ✅ Ver partidos disponibles
- ✅ Postularse a partidos
- ✅ Gestionar perfil personal
- ✅ Historial de partidos arbitrados
- ✅ Recibir notificaciones por email

## 🔒 Características de Seguridad

- **Autenticación JWT** con tokens seguros
- **Encriptación bcrypt** para contraseñas  
- **Protección CSRF** contra ataques
- **Rate Limiting** para prevenir spam
- **Validación de datos** en frontend y backend
- **Encriptación AES-256-CBC** para datos sensibles
- **Headers de seguridad** con Helmet
- **Protección XSS** con sanitización

## 📁 Estructura del Proyecto

```
RefZone/
├── mi-frontend/          # Aplicación React
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── services/     # Servicios API
│   │   └── styles/       # Estilos CSS
│   └── package.json
├── mi-backend/           # API Node.js/Express
│   ├── models/           # Modelos Mongoose
│   ├── routes/           # Rutas de la API
│   ├── middleware/       # Middleware personalizado
│   ├── config/           # Configuraciones
│   └── package.json
└── README.md
```

## 🔄 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión

### Partidos
- `GET /api/games` - Listar partidos
- `POST /api/games` - Crear partido
- `PUT /api/games/:id` - Actualizar partido
- `DELETE /api/games/:id` - Eliminar partido

### Postulaciones
- `POST /api/games/:id/apply` - Postularse a partido
- `POST /api/games/:id/assign` - Asignar árbitro

## � Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## �👨‍💻 Autor

**Mauricio** - [Th3Mauryy](https://github.com/Th3Mauryy)

*Este es un proyecto personal desarrollado para demostrar habilidades en desarrollo full-stack.*

## 🙏 Agradecimientos

- Comunidad de desarrolladores de React y Node.js
- MongoDB Atlas por el hosting de base de datos
- Cloudinary por el almacenamiento de imágenes
- Vercel por el hosting y deployment

---

⭐ **¡Dale una estrella si te gustó el proyecto!** ⭐
