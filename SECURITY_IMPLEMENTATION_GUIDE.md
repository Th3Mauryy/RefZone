# 🛡️ GUÍA DE IMPLEMENTACIÓN DE MEJORAS DE SEGURIDAD

## 📦 PASO 1: Instalar Dependencias

```bash
cd mi-backend
npm install express-rate-limit
```

## 🔧 PASO 2: Actualizar server.js (LOCAL)

Agregar estos imports al inicio de `mi-backend/server.js`:

```javascript
// Importar middlewares de seguridad
const { 
  loginLimiter, 
  registerLimiter, 
  passwordRecoveryLimiter,
  apiLimiter,
  createGameLimiter,
  applyGameLimiter 
} = require('./middleware/rateLimiter');

const { sanitizeBodyMiddleware } = require('./middleware/sanitizer');
const { logRateLimitHit } = require('./middleware/securityLogger');
```

Después de la configuración de sesiones, agregar:

```javascript
// ===== MIDDLEWARES DE SEGURIDAD =====

// 1. Sanitización general de inputs
app.use(sanitizeBodyMiddleware);

// 2. Rate limiting general para API
app.use('/api/', apiLimiter);

// 3. Rate limiters específicos
app.use('/api/usuarios/login', loginLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/usuarios/registro', registerLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/usuarios/recuperar', passwordRecoveryLimiter);
app.use('/api/auth/recuperar', passwordRecoveryLimiter);
```

## 🔧 PASO 3: Actualizar api/index.js (VERCEL)

Agregar al archivo `mi-backend/api/index.js` después de los imports:

```javascript
// Importar middlewares de seguridad
const { 
  loginLimiter, 
  registerLimiter, 
  passwordRecoveryLimiter,
  apiLimiter 
} = require('../middleware/rateLimiter');

const { sanitizeBodyMiddleware } = require('../middleware/sanitizer');
```

Después de la configuración de sesiones, agregar:

```javascript
// ===== MIDDLEWARES DE SEGURIDAD =====
app.use(sanitizeBodyMiddleware);
app.use('/api/', apiLimiter);
app.use(['/api/usuarios/login', '/api/auth/login'], loginLimiter);
app.use(['/api/usuarios/registro', '/api/auth/register'], registerLimiter);
app.use(['/api/usuarios/recuperar', '/api/auth/recuperar'], passwordRecoveryLimiter);
```

## 🔧 PASO 4: Actualizar auth.js (Logging)

En `mi-backend/routes/auth.js`, agregar al inicio:

```javascript
const { logAuthAttempt, logCriticalAction } = require('../middleware/securityLogger');
```

Actualizar la ruta de login (línea ~70):

```javascript
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail })
            .select('_id email password role nombre imagenPerfil')
            .lean();
        
        if (!user) {
            // LOG: Intento fallido - usuario no existe
            logAuthAttempt(req, false, 'Usuario no encontrado');
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // LOG: Intento fallido - contraseña incorrecta
            logAuthAttempt(req, false, 'Contraseña incorrecta');
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // LOG: Login exitoso
        logAuthAttempt(req, true);

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email }, 
            jwtSecret, 
            { expiresIn: '7d' }
        );

        res.status(200).json({ 
            token, 
            redirect: user.role === 'organizador' ? '/dashboard-organizador' : '/dashboard',
            user: {
                id: user._id,
                nombre: user.nombre,
                role: user.role,
                imagenPerfil: user.imagenPerfil
            }
        });
    } catch (error) {
        console.error('Error login:', error.message);
        res.status(500).json({ message: 'Error del servidor' });
    }
});
```

## 🔧 PASO 5: Mejorar Helmet Configuration

En `server.js` y `api/index.js`, reemplazar:

```javascript
app.use(helmet());
```

Por:

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://ref-zone.vercel.app"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
}));
```

## 🔧 PASO 6: Agregar Endpoint de Monitoreo de Seguridad

En `mi-backend/routes/auth.js` o crear `mi-backend/routes/securityRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getSecurityStats, getSecurityEvents } = require('../middleware/securityLogger');

// Solo accesible por administradores
router.get('/security/stats', verifyToken, async (req, res) => {
  try {
    // Verificar que sea un usuario admin (ajustar según tu lógica)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    const stats = getSecurityStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

router.get('/security/events', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    const { limit, type, level } = req.query;
    const events = getSecurityEvents(
      parseInt(limit) || 50,
      { type, level }
    );
    
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
});

module.exports = router;
```

## 📋 PASO 7: Variables de Entorno

Asegúrate de que tu `.env` tenga:

```bash
# Claves secretas - GENERAR NUEVAS PARA PRODUCCIÓN
JWT_SECRET=tu-jwt-super-secreto-cambiar-en-produccion-min-32-caracteres
SESSION_SECRET=tu-session-secret-super-seguro-cambiar-en-produccion-min-32-caracteres

# En producción NO usar fallbacks en el código
NODE_ENV=production
```

## ✅ PASO 8: Verificar Implementación

1. **Probar Rate Limiting:**
   ```bash
   # Intentar login 6 veces seguidas con credenciales incorrectas
   # Debe bloquearse en el 6to intento
   ```

2. **Verificar Sanitización:**
   ```bash
   # Intentar registrar usuario con:
   # nombre: "<script>alert('XSS')</script>John"
   # Debe guardarse como: "John" (sin script)
   ```

3. **Revisar Logs:**
   ```bash
   # Los intentos fallidos deben aparecer en consola
   # Buscar: "🔴 [SECURITY]" o "🟡 [SECURITY]"
   ```

## 🚀 PASO 9: Deploy a Vercel

```bash
git add .
git commit -m "feat: implementar mejoras de seguridad (rate limiting, sanitización, logging)"
git push
```

Vercel detectará los cambios y hará el deploy automáticamente.

## 📊 PASO 10: Monitoreo Post-Deploy

Después del deploy, monitorea:

1. **Logs de Vercel** para ver si hay errores
2. **Rate limiting** funcionando (intentar logins múltiples)
3. **Headers de seguridad** con herramientas como [Security Headers](https://securityheaders.com/)

## ⚠️ NOTAS IMPORTANTES

### Rate Limiting en Vercel
- Los limiters basados en memoria se reinician en cada función serverless
- Para producción seria, considera usar Redis:
  ```bash
  npm install rate-limit-redis ioredis
  ```

### Logging en Producción
- Los logs en memoria se pierden
- Considera servicios como:
  - Logtail
  - Datadog
  - New Relic

### Monitoreo
- Implementa alertas para:
  - +10 intentos de login fallidos en 5 minutos
  - Rate limits excedidos frecuentemente
  - Errores 401/403 repetidos

## 🔐 CHECKLIST FINAL

- [ ] express-rate-limit instalado
- [ ] Middlewares de sanitización agregados
- [ ] Rate limiters aplicados a rutas críticas
- [ ] Security logger implementado
- [ ] Helmet configurado correctamente
- [ ] Variables de entorno seguras
- [ ] Tests de rate limiting realizados
- [ ] Deploy a producción exitoso
- [ ] Monitoreo configurado

## 📖 RECURSOS ADICIONALES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Rate Limiting Strategies](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/)

---

**¿Necesitas ayuda?** Revisa el archivo `SECURITY_AUDIT_REPORT.md` para más detalles.
