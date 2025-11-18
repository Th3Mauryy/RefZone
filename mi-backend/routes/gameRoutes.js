const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware/authMiddleware');
const partidoService = require('../services/partidoService');

// 1. MODIFICAR: Función para crear partidos
// Crear partido - OPTIMIZADO
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, date, time, location, canchaId, ubicacionId } = req.body;
        
        // Validación rápida de fecha pasada
        const gameDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        if (gameDateTime < now) {
            return res.status(400).json({ 
                message: 'No se puede crear un partido con fecha pasada' 
            });
        }
        
        // Validación: Mínimo 2 horas de anticipación (CP-022)
        const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
        if (gameDateTime < twoHoursFromNow) {
            return res.status(400).json({ 
                message: 'El partido debe programarse con al menos 2 horas de anticipación' 
            });
        }
        
        // Validación: No permitir nombres duplicados el mismo día (CP-042)
        if (name && date) {
            const nameNormalized = name.trim().toLowerCase();
            
            // Buscar si existe un partido con un nombre similar en la misma fecha
            const partidosDelDia = await Game.find({
                creadorId: req.user.id,
                date: date
            }).select('name').lean();
            
            // Verificar si hay equipos repetidos
            for (const partido of partidosDelDia) {
                const partidoNameNormalized = partido.name.trim().toLowerCase();
                
                // Extraer equipos del nombre (asumiendo formato "Equipo1 vs Equipo2")
                const equiposNuevos = nameNormalized.split(/\s*vs\s*/).map(e => e.trim());
                const equiposExistentes = partidoNameNormalized.split(/\s*vs\s*/).map(e => e.trim());
                
                // Verificar si algún equipo se repite
                const hayRepeticion = equiposNuevos.some(equipo => 
                    equiposExistentes.includes(equipo)
                );
                
                if (hayRepeticion) {
                    return res.status(400).json({ 
                        message: `Ya existe un partido con el equipo "${equiposNuevos.find(e => equiposExistentes.includes(e))}" programado para el ${date}. No puedes tener el mismo equipo en múltiples partidos el mismo día.` 
                    });
                }
            }
        }
        
        // Crear partido
        const newGame = await Game.create({
            name,
            date,
            time, 
            location,
            ubicacionId, // NUEVO: Guardar ID de ubicación
            canchaId,
            creadorId: req.user.id,
            estado: 'programado'
        });
        
        res.status(201).json(newGame);
    } catch (error) {
        console.error('Error crear partido:', error.message);
        res.status(500).json({ message: 'Error al crear el partido' });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        let query = {};
        
        // FILTRO: Si es organizador, solo sus partidos
        if (req.user.role === 'organizador') {
            query.creadorId = req.user.id;
        }
        
        // Filtro por cancha (para árbitros)
        if (req.query.cancha && req.query.cancha !== 'todas' && req.user.role === 'arbitro') {
            const canchaId = String(req.query.cancha).trim();
            if (canchaId.match(/^[0-9a-fA-F]{24}$/)) {
                query.canchaId = canchaId;
            }
        }
        
        // Query optimizada: lean(), select solo campos necesarios
        const games = await Game.find(query)
            .select('-__v')
            .populate('arbitro', 'nombre email imagenPerfil edad contacto experiencia calificacionPromedio totalCalificaciones')
            .populate('canchaId', 'nombre direccion')
            .populate('creadorId', 'nombre email')
            .lean()
            .sort({ date: 1, time: 1 });
        
        return res.status(200).json(games);
    } catch (error) {
        console.error('Error al obtener partidos:', error.message);
        res.status(500).json({ message: 'Error al obtener los partidos' });
    }
});

// Eliminar partido - OPTIMIZADO (emails asíncronos)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const gameId = req.params.id;

        if (!gameId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        // Obtener partido solo con campos necesarios
        const game = await Game.findById(gameId)
            .select('name date time location arbitro postulados canchaId')
            .populate('postulados', 'email nombre')
            .populate('arbitro', 'email nombre')
            .lean();
        
        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado' });
        }

        // 🔒 VALIDACIÓN: No permitir eliminar partidos que ya iniciaron
        if (partidoService.haIniciado(game)) {
            return res.status(403).json({ 
                message: 'No se puede eliminar un partido que ya ha iniciado' 
            });
        }

        // Guardar en historial ANTES de eliminar
        const HistorialPartido = require('../models/HistorialPartido');
        const [year, month] = game.date.split('-').map(Number);
        
        await HistorialPartido.create({
            originalId: game._id,
            nombre: game.name,
            fecha: game.date,
            hora: game.time,
            ubicacion: game.location,
            arbitro: game.arbitro?._id || null,
            arbitroNombre: game.arbitro?.nombre || 'Sin asignar',
            estado: 'Cancelado',
            canchaId: game.canchaId || null,
            razonEliminacion: 'manual',
            mesPartido: month,
            anoPartido: year
        });

        // Eliminar partido
        await Game.findByIdAndDelete(gameId);
        
        // Responder inmediatamente
        res.status(200).json({ message: 'Partido eliminado correctamente' });

        // Enviar emails en SEGUNDO PLANO (no bloquea la respuesta)
        setImmediate(async () => {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const emailList = [];
                
                // Emails a postulados
                if (game.postulados?.length > 0) {
                    game.postulados.forEach(postulado => {
                        emailList.push({
                            to: postulado.email,
                            subject: 'Partido Cancelado - RefZone',
                            html: `<p>Hola <strong>${postulado.nombre}</strong>,</p>
                                   <p>El partido <strong>"${game.name}"</strong> ha sido <strong>cancelado</strong>.</p>
                                   <p>Fecha: ${game.date} a las ${game.time}</p>
                                   <p>Gracias por tu comprensión.</p>`
                        });
                    });
                }

                // Email al árbitro asignado
                if (game.arbitro) {
                    emailList.push({
                        to: game.arbitro.email,
                        subject: 'Partido Cancelado - RefZone',
                        html: `<p>Hola <strong>${game.arbitro.nombre}</strong>,</p>
                               <p>El partido <strong>"${game.name}"</strong> donde estabas asignado ha sido <strong>cancelado</strong>.</p>
                               <p>Fecha: ${game.date} a las ${game.time}</p>`
                    });
                }

                // Enviar todos los emails en paralelo
                await Promise.allSettled(
                    emailList.map(email => transporter.sendMail({
                        from: `"Soporte RefZone" <${process.env.EMAIL_USER}>`,
                        ...email
                    }))
                );
            } catch (emailError) {
                console.error('Error emails eliminación:', emailError.message);
            }
        });

    } catch (error) {
        console.error('Error eliminar:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error al eliminar el partido' });
        }
    }
});


router.post('/:id/apply', verifyToken, async (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID de partido inválido" });
  }

  try {
    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ message: "Partido no encontrado" });
    }

    // Verifica si el partido ya tiene un árbitro asignado
    if (game.arbitro) {
      return res.status(400).json({ message: "Este partido ya tiene un árbitro asignado" });
    }

    // Verifica si el usuario ya está postulado (convertir a string para comparación exacta)
    const isAlreadyApplied = game.postulados.some(
      postuladoId => postuladoId.toString() === req.user.id.toString()
    );
    
    if (isAlreadyApplied) {
      return res.status(400).json({ message: "Ya estás postulado para este partido" });
    }

    // Verifica si ya se alcanzó el límite de 5 postulados
    if (game.postulados.length >= 5) {
      return res.status(400).json({ message: "El límite de postulantes ha sido alcanzado" });
    }

    // Agrega el usuario a la lista de postulados usando $addToSet (previene duplicados)
    await Game.findByIdAndUpdate(
      id,
      { $addToSet: { postulados: req.user.id } },
      { new: true }
    );

    res.status(200).json({ message: "Postulación exitosa" });
  } catch (error) {
    console.error("Error al postularse:", error);
    res.status(500).json({ message: "Error al postularse" });
  }
});


// Asignar árbitro - OPTIMIZADO (email asíncrono)
router.post('/:id/assign', verifyToken, async (req, res) => {
    try {
        const { arbitroId } = req.body;

        if (!arbitroId) {
            return res.status(400).json({ message: 'ID del árbitro no proporcionado' });
        }

        // Buscar partido
        const game = await Game.findById(req.params.id).select('name date time location arbitro postulados').lean();
        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado' });
        }

        // 🔒 VALIDACIÓN: No permitir asignar árbitro si el partido ya inició
        if (partidoService.haIniciado(game)) {
            return res.status(403).json({ 
                message: 'No se puede asignar un árbitro a un partido que ya ha iniciado' 
            });
        }

        // Verificar que el árbitro esté postulado
        if (!game.postulados || !game.postulados.some(p => p.toString() === arbitroId)) {
            return res.status(400).json({ message: 'El árbitro no está postulado' });
        }

        // Asignar árbitro y remover de postulados
        await Game.findByIdAndUpdate(req.params.id, {
            arbitro: arbitroId,
            $pull: { postulados: arbitroId }
        });

        // Obtener datos del árbitro
        const assignedReferee = await User.findById(arbitroId).select('nombre email').lean();
        if (!assignedReferee) {
            return res.status(404).json({ message: 'Árbitro no encontrado' });
        }

        // Responder inmediatamente
        res.status(200).json({ message: 'Árbitro asignado correctamente' });

        // Enviar email en SEGUNDO PLANO
        setImmediate(async () => {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                await transporter.sendMail({
                    from: `"Soporte RefZone" <${process.env.EMAIL_USER}>`,
                    to: assignedReferee.email,
                    subject: '¡Felicidades! Has sido asignado a un partido',
                    html: `<p>¡Felicidades, <strong>${assignedReferee.nombre}</strong>!</p>
                           <p>Has sido asignado al partido <strong>"${game.name}"</strong>.</p>
                           <p>Fecha: ${game.date} a las ${game.time}</p>
                           <p>Ubicación: ${game.location}</p>
                           <p>¡Gracias por ser parte de RefZone!</p>`
                });
            } catch (emailError) {
                console.error('Error email asignación:', emailError.message);
            }
        });

    } catch (error) {
        console.error('Error asignar:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error al asignar árbitro' });
        }
    }
});


// Sustituir árbitro asignado
router.post('/:id/substitute', async (req, res) => {
    try {
        const { nuevoArbitroId, razon } = req.body;
        const gameId = req.params.id;

        // Validaciones
        if (!nuevoArbitroId) {
            return res.status(400).json({ message: 'ID del nuevo árbitro es requerido.' });
        }

        if (!razon || razon.trim().length < 10) {
            return res.status(400).json({ message: 'La razón debe tener al menos 10 caracteres.' });
        }

        // Buscar el partido
        const game = await Game.findById(gameId)
            .populate('arbitro', 'nombre email')
            .populate('postulados', 'nombre email _id');

        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        // 🔒 VALIDACIÓN: No permitir sustituir árbitro si el partido ya inició
        if (partidoService.haIniciado(game)) {
            return res.status(403).json({ 
                message: 'No se puede sustituir al árbitro de un partido que ya ha iniciado' 
            });
        }

        if (!game.arbitro) {
            return res.status(400).json({ message: 'No hay árbitro asignado para sustituir.' });
        }

        // Verificar que el nuevo árbitro esté en la lista de postulados
        const nuevoArbitro = await User.findById(nuevoArbitroId);
        if (!nuevoArbitro) {
            return res.status(404).json({ message: 'Nuevo árbitro no encontrado.' });
        }

        // Guardar referencia del árbitro anterior
        const arbitroAnterior = game.arbitro;

        // Actualizar el partido: asignar nuevo árbitro y remover solo ese árbitro de postulados
        // También volver a agregar el árbitro anterior a los postulados (por si quieren volver a asignarlo)
        game.arbitro = nuevoArbitroId;
        game.postulados = game.postulados.filter(postuladoId => postuladoId._id.toString() !== nuevoArbitroId.toString());
        
        // Opcional: agregar al árbitro anterior de vuelta a los postulados
        if (!game.postulados.some(p => p._id.toString() === arbitroAnterior._id.toString())) {
            game.postulados.push(arbitroAnterior._id);
        }
        
        await game.save();

        // Configurar transporte de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Formatear fecha y hora
        const formatGameDateTime = (game) => {
            let date = game.date;
            let time = game.time;

            if (typeof date === 'string') {
                date = date.trim();
            } else if (date instanceof Date) {
                date = date.toISOString().split('T')[0];
            }

            if (typeof time === 'string') {
                time = time.trim();
            }

            const dateTime = new Date(`${date}T${time}`);
            if (isNaN(dateTime)) {
                return { formattedDate: 'Fecha no disponible', formattedTime: 'Hora no disponible' };
            }

            const day = dateTime.getDate();
            const month = dateTime.toLocaleString('es-ES', { month: 'long' });
            const year = dateTime.getFullYear();
            const hours = dateTime.getHours();
            const minutes = dateTime.getMinutes().toString().padStart(2, '0');
            const period = hours >= 12 ? 'PM' : 'AM';
            const formattedHour = hours % 12 || 12;

            const formattedDate = `el día ${day} de ${month} del ${year}`;
            const formattedTime = `a las ${formattedHour}:${minutes} ${period}`;

            return { formattedDate, formattedTime };
        };

        const { formattedDate, formattedTime } = formatGameDateTime(game);

        // Email al árbitro sustituido
        const emailArbitroAnterior = {
            from: `"Soporte RefZone" <${process.env.EMAIL_USER}>`,
            to: arbitroAnterior.email,
            subject: 'Cambio de Asignación - RefZone',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f59e0b;">Cambio de Asignación de Partido</h2>
                    <p>Hola <strong>${arbitroAnterior.nombre}</strong>,</p>
                    <p>Lamentamos informarte que has sido sustituido en el partido <strong>"${game.name}"</strong> programado para <strong>${formattedDate}</strong> <strong>${formattedTime}</strong>.</p>
                    
                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #92400e; margin-top: 0;">Razón de la sustitución:</h3>
                        <p style="color: #78350f; margin: 0;">${razon}</p>
                    </div>
                    
                    <p style="color: #6b7280;">Gracias por tu comprensión y esperamos contar contigo en futuros partidos.</p>
                    <p>Saludos,<br><strong>Equipo RefZone</strong></p>
                </div>
            `
        };

        // Email al nuevo árbitro designado
        const emailNuevoArbitro = {
            from: `"Soporte RefZone" <${process.env.EMAIL_USER}>`,
            to: nuevoArbitro.email,
            subject: '¡Has sido designado como árbitro! - RefZone',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">¡Felicidades! Has sido designado</h2>
                    <p>Hola <strong>${nuevoArbitro.nombre}</strong>,</p>
                    <p>Has sido <strong>designado</strong> como árbitro para el partido <strong>"${game.name}"</strong>.</p>
                    
                    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #065f46; margin-top: 0;">Detalles del partido:</h3>
                        <ul style="color: #047857;">
                            <li><strong>Fecha:</strong> ${formattedDate}</li>
                            <li><strong>Hora:</strong> ${formattedTime}</li>
                            <li><strong>Ubicación:</strong> ${game.location}</li>
                        </ul>
                    </div>
                    
                    <p style="color: #6b7280;">Por favor, confirma tu asistencia y prepárate para el partido.</p>
                    <p>¡Gracias por ser parte de RefZone!</p>
                    <p>Saludos,<br><strong>Equipo RefZone</strong></p>
                </div>
            `
        };

        // Enviar ambos correos
        try {
            await Promise.all([
                transporter.sendMail(emailArbitroAnterior),
                transporter.sendMail(emailNuevoArbitro)
            ]);
            console.log('Correos de sustitución enviados correctamente');
        } catch (emailError) {
            console.error('Error al enviar correos:', emailError);
        }

        res.status(200).json({ 
            message: 'Árbitro sustituido correctamente y notificaciones enviadas.',
            arbitroAnterior: arbitroAnterior.nombre,
            nuevoArbitro: nuevoArbitro.nombre
        });

    } catch (error) {
        console.error('Error al sustituir árbitro:', error);
        res.status(500).json({ message: 'Error al sustituir árbitro.' });
    }
});

// Endpoint para desasignar árbitro (sin asignar nuevo)
router.post('/:id/unassign', verifyToken, async (req, res) => {
    console.log('=== INICIANDO DESASIGNACIÓN ===');
    const { razon } = req.body;
    const gameId = req.params.id;
    
    console.log('GameID:', gameId);
    console.log('Razón:', razon);

    try {
        // Validaciones
        if (!razon || razon.trim().length < 10) {
            return res.status(400).json({ message: 'La razón debe tener al menos 10 caracteres.' });
        }

        // Buscar el partido
        console.log('Buscando partido...');
        const game = await Game.findById(gameId).populate('arbitro', 'nombre email');

        if (!game) {
            console.log('Partido no encontrado');
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        // 🔒 VALIDACIÓN: No permitir desasignar árbitro si el partido ya inició
        if (partidoService.haIniciado(game)) {
            console.log('Partido ya inició, no se puede desasignar');
            return res.status(403).json({ 
                message: 'No se puede desasignar al árbitro de un partido que ya ha iniciado' 
            });
        }

        if (!game.arbitro) {
            console.log('No hay árbitro asignado');
            return res.status(400).json({ message: 'No hay árbitro asignado para desasignar.' });
        }

        // Guardar referencia del árbitro antes de removerlo
        const arbitroRemovido = game.arbitro;
        console.log('Árbitro a desasignar:', arbitroRemovido.nombre);

        // Volver a agregar el árbitro a los postulados si no está ya
        if (!game.postulados.some(p => p.toString() === arbitroRemovido._id.toString())) {
            game.postulados.push(arbitroRemovido._id);
            console.log('Árbitro agregado a postulados');
        }

        // Desasignar el árbitro (el partido vuelve a estar abierto)
        game.arbitro = null;
        console.log('Guardando partido...');
        await game.save();
        console.log('Partido guardado exitosamente');

        // Responder al cliente
        res.status(200).json({ 
            message: 'Árbitro desasignado correctamente. El partido está ahora abierto para postulaciones.',
            arbitroRemovido: arbitroRemovido.nombre
        });
        console.log('Respuesta enviada al cliente');

        // Enviar correo de forma asíncrona (en segundo plano)
        setImmediate(async () => {
            try {
                console.log('Preparando email...');
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                // Formatear fecha y hora
                let date = game.date;
                let time = game.time;

                if (typeof date === 'string') {
                    date = date.trim();
                } else if (date instanceof Date) {
                    date = date.toISOString().split('T')[0];
                }

                if (typeof time === 'string') {
                    time = time.trim();
                }

                const dateTime = new Date(`${date}T${time}`);
                let formattedDate = 'Fecha no disponible';
                let formattedTime = 'Hora no disponible';

                if (!isNaN(dateTime)) {
                    const day = dateTime.getDate();
                    const month = dateTime.toLocaleString('es-ES', { month: 'long' });
                    const year = dateTime.getFullYear();
                    const hours = dateTime.getHours();
                    const minutes = dateTime.getMinutes().toString().padStart(2, '0');
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const formattedHour = hours % 12 || 12;

                    formattedDate = `el día ${day} de ${month} del ${year}`;
                    formattedTime = `a las ${formattedHour}:${minutes} ${period}`;
                }

                // Email al árbitro desasignado
                const emailArbitroRemovido = {
                    from: `"Soporte RefZone" <${process.env.EMAIL_USER}>`,
                    to: arbitroRemovido.email,
                    subject: 'Desasignación de Partido - RefZone',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #ef4444;">Desasignación de Partido</h2>
                            <p>Hola <strong>${arbitroRemovido.nombre}</strong>,</p>
                            <p>Lamentamos informarte que has sido <strong>desasignado</strong> del partido <strong>"${game.name}"</strong> programado para <strong>${formattedDate}</strong> <strong>${formattedTime}</strong>.</p>
                            
                            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #991b1b; margin-top: 0;">Razón de la desasignación:</h3>
                                <p style="color: #7f1d1d; margin: 0;">${razon}</p>
                            </div>
                            
                            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #1e40af; margin-top: 0;">ℹ️ Información importante:</h3>
                                <p style="color: #1e3a8a; margin: 0;">El partido ahora está <strong>abierto nuevamente</strong> para que otros árbitros puedan postularse. Si lo deseas, puedes volver a postularte para este partido.</p>
                            </div>
                            
                            <p style="color: #6b7280;">Gracias por tu comprensión y esperamos contar contigo en futuros partidos.</p>
                            <p>Saludos,<br><strong>Equipo RefZone</strong></p>
                        </div>
                    `
                };

                await transporter.sendMail(emailArbitroRemovido);
                console.log('✅ Correo de desasignación enviado correctamente');
            } catch (emailError) {
                console.error('❌ Error al enviar correo:', emailError);
            }
        });

    } catch (error) {
        console.error('❌ ERROR EN DESASIGNACIÓN:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error al desasignar árbitro.', error: error.message });
        }
    }
});

// Obtener postulados de un partido
router.get('/:id/postulados', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('postulados', 'nombre email _id imagenPerfil edad contacto experiencia calificacionPromedio totalCalificaciones');
        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }
        res.status(200).json({ postulados: game.postulados });
    } catch (error) {
        console.error('Error al obtener postulados:', error);
        res.status(500).json({ message: 'Error al obtener postulados.' });
    }
});

// Ruta para cancelar postulación
router.post('/cancel-postulation', async (req, res) => {
    const { gameId, userId } = req.body;

    console.log('Datos recibidos del cliente:', { gameId, userId });

    if (!gameId || !userId) {
        return res.status(400).json({ message: 'Datos incompletos: gameId y userId son requeridos.' });
    }

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            console.log('Partido no encontrado en la base de datos.');
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        console.log('Partido encontrado:', game);

        const index = game.postulados.indexOf(userId);
        if (index === -1) {
            console.log('Usuario no está postulado para este partido.');
            return res.status(400).json({ message: 'No estás postulado para este partido.' });
        }

        // Elimina al usuario de la lista de postulados
        game.postulados.splice(index, 1);
        await game.save();

        console.log('Postulación cancelada con éxito. Partido actualizado:', game);

        res.json({ message: 'Postulación cancelada con éxito.' });
    } catch (error) {
        console.error('Error al cancelar postulación:', error);
        res.status(500).json({ message: 'Error interno al cancelar la postulación.' });
    }
});
router.put('/:id', async (req, res) => {
    const { name, date, time, location, canchaId, ubicacionId } = req.body;
    const gameId = req.params.id;

    try {
        // Buscar el partido primero para validar si ya inició
        const game = await Game.findById(gameId).select('date time');
        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        // 🔒 VALIDACIÓN: No permitir editar partidos que ya iniciaron
        if (partidoService.haIniciado(game)) {
            return res.status(403).json({ 
                message: 'No se puede modificar un partido que ya ha iniciado' 
            });
        }

        // Validar que la fecha y hora no sean pasadas (solo si se están actualizando)
        if (date && time) {
            const gameDateTime = new Date(`${date}T${time}`);
            const now = new Date();
            
            if (gameDateTime < now) {
                return res.status(400).json({ 
                    message: 'No se puede actualizar un partido con fecha y hora pasadas. Por favor selecciona una fecha y hora futura.' 
                });
            }
        }
        
        const updateData = { name, date, time, location };
        
        // Agregar canchaId al objeto de actualización si está presente
        if (canchaId) {
            updateData.canchaId = canchaId;
        }
        
        // Agregar ubicacionId al objeto de actualización si está presente
        if (ubicacionId) {
            updateData.ubicacionId = ubicacionId;
        }
        
        const updatedGame = await Game.findByIdAndUpdate(gameId, updateData, { new: true });
        if (!updatedGame) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }
        res.status(200).json({ updatedGame });
    } catch (error) {
        console.error('Error al actualizar el partido:', error);
        res.status(500).json({ message: 'Error al actualizar el partido' });
    }
});

// Ruta para estadísticas de partidos
router.get('/stats', verifyToken, async (req, res) => {
    try {
        // Filtrar por el organizador que está logueado
        const creadorId = req.user.id;
        
        const total = await Game.countDocuments({ creadorId });
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];

        const upcoming = await Game.countDocuments({ 
            creadorId,
            $or: [
                { date: { $gt: today } },
                { 
                    date: { $eq: today },
                    time: { $gte: currentTime }
                }
            ]
        });

        // Solo null o no existe, NO string vacío
        const needsReferee = await Game.countDocuments({ 
            creadorId,
            $or: [{ arbitro: null }, { arbitro: { $exists: false } }] 
        });

        res.json({ total, upcoming, needsReferee });
    } catch (err) {
        console.error("Error en /games/stats:", err);
        res.status(500).json({ total: 0, upcoming: 0, needsReferee: 0, error: err.message });
    }
});

// Obtener historial de partidos de un árbitro (CP-016)
router.get('/arbitro/:arbitroId/historial', verifyToken, async (req, res) => {
    try {
        const { arbitroId } = req.params;
        
        // Validar ID
        if (!arbitroId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'ID de árbitro inválido' });
        }
        
        const User = require('../models/User');
        
        // Buscar árbitro con su historial de calificaciones
        const arbitro = await User.findById(arbitroId)
            .select('nombre email imagenPerfil calificacionPromedio totalCalificaciones calificaciones')
            .populate('calificaciones.organizadorId', 'nombre')
            .lean();
        
        if (!arbitro) {
            return res.status(404).json({ message: 'Árbitro no encontrado' });
        }
        
        // Buscar partidos finalizados del árbitro en el historial
        const HistorialPartido = require('../models/HistorialPartido');
        
        const historialPartidos = await HistorialPartido.find({
            arbitro: arbitroId,
            estado: 'Finalizado'
        })
        .select('nombre fecha hora ubicacion originalId calificado')
        .sort({ fechaEliminacion: -1 })
        .limit(20)
        .lean();
        
        // Combinar historial con calificaciones
        const historialConCalificaciones = historialPartidos.map(partido => {
            // Buscar calificación usando el _id del HistorialPartido, no el originalId
            const calificacion = arbitro.calificaciones.find(
                c => String(c.partidoId) === String(partido._id)
            );
            
            return {
                _id: partido.originalId,
                nombre: partido.nombre,
                fecha: partido.fecha,
                hora: partido.hora,
                ubicacion: partido.ubicacion,
                calificacion: calificacion ? calificacion.estrellas : null,
                comentario: calificacion ? calificacion.comentario : null,
                organizador: calificacion?.organizadorId?.nombre || null
            };
        });
        
        res.status(200).json({
            arbitro: {
                nombre: arbitro.nombre || 'Árbitro',
                email: arbitro.email,
                imagenPerfil: arbitro.imagenPerfil,
                calificacionPromedio: arbitro.calificacionPromedio || 0,
                totalCalificaciones: arbitro.totalCalificaciones || 0
            },
            historial: historialConCalificaciones
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error al obtener el historial del árbitro' });
    }
});

// Ruta alternativa para información detallada del árbitro (mantener compatibilidad)
router.get('/arbitro/:arbitroId/info', verifyToken, async (req, res) => {
    try {
        const { arbitroId } = req.params;
        
        // Validar ID
        if (!arbitroId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'ID de árbitro inválido' });
        }
        
        // Buscar partidos finalizados del árbitro en el historial
        const HistorialPartido = require('../models/HistorialPartido');
        
        const historial = await HistorialPartido.find({
            arbitro: arbitroId,
            estado: 'Finalizado'
        })
        .select('nombre fecha hora ubicacion canchaId estado mesPartido anoPartido')
        .populate('canchaId', 'nombre')
        .sort({ anoPartido: -1, mesPartido: -1, fecha: -1 })
        .limit(20) // Últimos 20 partidos
        .lean();
        
        // También buscar partidos actuales/futuros del árbitro
        const partidosActuales = await Game.find({
            arbitro: arbitroId
        })
        .select('name date time location canchaId')
        .populate('canchaId', 'nombre')
        .sort({ date: -1 })
        .limit(10)
        .lean();
        
        // Buscar info del árbitro
        const User = require('../models/User');
        const arbitro = await User.findById(arbitroId)
            .select('nombre calificacionPromedio totalCalificaciones')
            .lean();
        
        res.status(200).json({
            arbitro: {
                nombre: arbitro?.nombre || 'Árbitro',
                calificacionPromedio: arbitro?.calificacionPromedio || 0,
                totalCalificaciones: arbitro?.totalCalificaciones || 0
            },
            historialFinalizados: historial.map(h => ({
                nombre: h.nombre,
                fecha: h.fecha,
                hora: h.hora,
                ubicacion: h.ubicacion,
                cancha: h.canchaId?.nombre || 'N/A',
                estado: h.estado
            })),
            partidosRecientes: partidosActuales.map(p => ({
                nombre: p.name,
                fecha: p.date,
                hora: p.time,
                ubicacion: p.location,
                cancha: p.canchaId?.nombre || 'N/A'
            })),
            totalPartidos: historial.length + partidosActuales.length
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error al obtener el historial del árbitro' });
    }
});

// La ruta para generar reportes PDF ha sido movida a reporteRoutes.js

module.exports = router;
