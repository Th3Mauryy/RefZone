# Tecnologías utilizadas

## Frontend
El frontend de este proyecto está desarrollado con **React** y configurado con **Vite** para un entorno de desarrollo rápido y eficiente. Algunas características clave del frontend incluyen:
- **React Router**: Para la navegación entre páginas como el login, registro, dashboard, etc.
- **CSS personalizado**: Se utilizaron estilos personalizados para cada componente, organizados en archivos CSS específicos.
- **Vite**: Herramienta de construcción rápida que permite un desarrollo más ágil en comparación con herramientas tradicionales como Webpack.
- **Integración con APIs**: El frontend se comunica con el backend a través de fetch requests para manejar autenticación, gestión de partidos, y más.

## Backend
El backend está construido con **Node.js** y **Express.js**, y utiliza **MongoDB** como base de datos. Algunas características importantes del backend son:
- **Express.js**: Framework para manejar rutas y lógica del servidor.
- **MongoDB Atlas**: Base de datos NoSQL en la nube para almacenar usuarios, partidos y postulaciones.
- **Mongoose**: ODM para modelar datos y realizar operaciones en MongoDB.
- **Cloudinary**: Servicio para almacenar imágenes de perfil de los usuarios.
- **Nodemailer**: Para enviar correos electrónicos, como notificaciones de asignación de árbitros o recuperación de contraseñas.

## Seguridad
El proyecto incluye varias medidas de seguridad para proteger los datos y las operaciones:
- **Autenticación con sesiones**: Se utiliza `express-session` para manejar sesiones de usuario, almacenando el `userId` en cookies seguras.
- **Encriptación de contraseñas**: Las contraseñas de los usuarios se encriptan con **bcrypt** antes de almacenarse en la base de datos.
- **Protección contra CSRF**: Se implementa un token CSRF en el frontend y backend para prevenir ataques de falsificación de solicitudes.
- **Validación de datos**: Tanto en el frontend como en el backend se validan los datos ingresados por los usuarios, como correos electrónicos, contraseñas y otros campos.
- **CORS**: Configuración de CORS para permitir únicamente solicitudes desde el dominio del frontend.
- **Rate Limiting**: Se implementó `express-rate-limit` para limitar el número de solicitudes y prevenir ataques de fuerza bruta.
- **Encriptación de datos sensibles**: Los campos como `email`, `nombre` y `contacto` se encriptan utilizando **AES-256-CBC** antes de almacenarse en la base de datos.
- **Helmet**: Se utiliza para configurar encabezados de seguridad HTTP y proteger contra vulnerabilidades comunes.
- **Advertencia de Self-XSS**: Se implementó un script para advertir a los usuarios sobre los riesgos de pegar código en la consola del navegador.

## Funcionalidades destacadas
- **Gestión de usuarios**: Registro, inicio de sesión, edición de perfil y recuperación de contraseñas.
- **Gestión de partidos**: Los organizadores pueden agregar, editar y eliminar partidos, así como asignar árbitros.
- **Postulación de árbitros**: Los árbitros pueden postularse a partidos disponibles y cancelar sus postulaciones.
- **Notificaciones por correo**: Los árbitros reciben correos electrónicos cuando son asignados a un partido.
- **Estadísticas de partidos**: Los organizadores pueden consultar estadísticas como el total de partidos, próximos partidos y partidos que necesitan árbitros.

## Flujo de trabajo
1. **Registro e inicio de sesión**: Los usuarios se registran con datos validados y pueden iniciar sesión para acceder a sus dashboards.
2. **Dashboard del organizador**: Permite gestionar partidos y asignar árbitros.
3. **Dashboard del árbitro**: Muestra partidos disponibles y permite postularse o cancelar postulaciones.
4. **Notificaciones**: Los árbitros reciben correos electrónicos con detalles del partido asignado.
5. **Edición de perfil**: Los usuarios pueden actualizar su información personal, incluyendo su imagen de perfil.
