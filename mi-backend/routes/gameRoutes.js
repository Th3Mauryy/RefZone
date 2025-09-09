const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware/authMiddleware');

// Cambia /games por / en todas las rutas
router.post('/', async (req, res) => {
    const { name, date, time, location } = req.body;

    try {
        const newGame = new Game({ name, date, time, location });
        await newGame.save();  // Guardar el nuevo partido en MongoDB
        res.status(201).json(newGame); // Devuelve el partido agregado como respuesta
    } catch (error) {
        console.error('Error al agregar el partido:', error);
        res.status(500).json({ message: 'Error al agregar el partido' });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const games = await Game.find().populate('arbitro', 'nombre email _id');
        res.status(200).json(games);
    } catch (error) {
        console.error('Error al obtener los partidos:', error);
        res.status(500).json({ message: 'Error al obtener los partidos' });
    }
});

// Eliminar un partido por ID (cambia /games/:id por /:id)
router.delete('/:id', async (req, res) => {
    try {
        const gameId = req.params.id;

        // Validar que el ID sea un ObjectId válido
        if (!gameId || !gameId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }

        const deletedGame = await Game.findByIdAndDelete(gameId);

        if (!deletedGame) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        res.status(200).json({ message: 'Partido eliminado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el partido.' });
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

    // Verifica si el usuario ya está postulado
    if (game.postulados.includes(req.user.id)) {
      return res.status(400).json({ message: "Ya estás postulado para este partido" });
    }

    // Verifica si ya se alcanzó el límite de 5 postulados
    if (game.postulados.length >= 5) {
      return res.status(400).json({ message: "El límite de postulantes ha sido alcanzado" });
    }

    // Agrega el usuario a la lista de postulados
    game.postulados.push(req.user.id);
    await game.save();

    res.status(200).json({ message: "Postulación exitosa" });
  } catch (error) {
    console.error("Error al postularse:", error);
    res.status(500).json({ message: "Error al postularse" });
  }
});


// Asignar árbitro al partido y enviar correo
router.post('/:id/assign', async (req, res) => {
    try {
        const { arbitroId } = req.body;

        if (!arbitroId) {
            return res.status(400).json({ message: 'ID del árbitro no proporcionado.' });
        }

        // Encuentra y actualiza el partido
        const game = await Game.findById(req.params.id).populate('arbitro', 'nombre email');
        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        // Verifica si el árbitro está en la lista de postulados
        if (game.postulados && !game.postulados.includes(arbitroId)) {
            return res.status(400).json({ message: 'El árbitro seleccionado no está postulado.' });
        }

        // Asignar árbitro y limpiar postulados
        game.arbitro = arbitroId;
        game.postulados = [];
        await game.save();

        // Obtener los datos del árbitro asignado
        const assignedReferee = await User.findById(arbitroId);
        if (!assignedReferee) {
            return res.status(404).json({ message: 'Árbitro no encontrado.' });
        }

        // Verifica y ajusta el formato de la fecha y hora
        let date, time;

        if (typeof game.date === 'string') {
            date = game.date.trim(); // Si es una cadena, elimina espacios
        } else if (game.date instanceof Date) {
            date = game.date.toISOString().split('T')[0]; // Convierte el objeto Date a formato YYYY-MM-DD
        } else {
            console.error('Formato de game.date no reconocido:', game.date);
            return res.status(400).json({ message: 'Formato de fecha no válido.' });
        }

        if (typeof game.time === 'string') {
            time = game.time.trim(); // Si es una cadena, elimina espacios
        } else {
            console.error('Formato de game.time no reconocido:', game.time);
            return res.status(400).json({ message: 'Formato de hora no válido.' });
        }

        // Combina la fecha y la hora para crear un objeto Date válido
        const dateTime = new Date(`${date}T${time}`);
        if (isNaN(dateTime)) {
            console.error('Fecha u hora inválida:', { date, time });
            return res.status(400).json({ message: 'Fecha u hora inválida en el partido.' });
        }

        // Formatea la fecha y la hora manualmente
        const day = dateTime.getDate();
        const month = dateTime.toLocaleString('es-ES', { month: 'long' });
        const year = dateTime.getFullYear();
        const hours = dateTime.getHours();
        const minutes = dateTime.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHour = hours % 12 || 12;

        const formattedDate = `el día ${day} de ${month} del ${year}`;
        const formattedTime = `a las ${formattedHour}:${minutes} ${period}`;

        // Configurar el transporte de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Crear el mensaje de correo
        const mailOptions = {
            from: `"Soporte Refzone" <${process.env.EMAIL_USER}>`,
            to: assignedReferee.email,
            subject: '¡Felicidades! Has sido asignado a un partido',
            text: `¡Felicidades, ${assignedReferee.nombre}! 
Has sido asignado al partido "${game.name}" que se llevará a cabo ${formattedDate} ${formattedTime}.
Por favor, asegúrate de estar presente en la ubicación: ${game.location}.
Si tienes alguna duda, no dudes en contactarnos.

¡Gracias por ser parte de Refzone!`,
            html: `<p>¡Felicidades, <strong>${assignedReferee.nombre}</strong>!</p>
<p>Has sido asignado al partido <strong>"${game.name}"</strong> que se llevará a cabo <strong>${formattedDate}</strong> <strong>${formattedTime}</strong>.</p>
<p>Por favor, asegúrate de estar presente en la ubicación: <strong>${game.location}</strong>.</p>
<p>Si tienes alguna duda, no dudes en contactarnos.</p>
<p>¡Gracias por ser parte de Refzone!</p>`,
        };

        // Enviar el correo
        try {
            await transporter.sendMail(mailOptions);
            console.log('Correo enviado con éxito');
        } catch (error) {
            console.error('Error al enviar el correo:', error);
        }

        // Responder al cliente
        res.status(200).json({ message: 'Árbitro asignado correctamente y correo enviado.' });
    } catch (error) {
        console.error('Error al asignar árbitro o enviar correo:', error);
        res.status(500).json({ message: 'Error al asignar árbitro o enviar correo.' });
    }
});


// Obtener postulados de un partido
router.get('/:id/postulados', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('postulados', 'nombre email _id');
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
    const { name, date, time, location } = req.body;
    const gameId = req.params.id;

    try {
        const updatedGame = await Game.findByIdAndUpdate(gameId, { name, date, time, location }, { new: true });
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
router.get('/stats', async (req, res) => {
    try {
        const total = await Game.countDocuments();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];

        const upcoming = await Game.countDocuments({ 
            $or: [
                { date: { $gt: today } },
                { 
                    date: { $eq: today },
                    time: { $gte: currentTime }
                }
            ]
        });

        // Solo null o no existe, NO string vacío
        const needsReferee = await Game.countDocuments({ $or: [{ arbitro: null }, { arbitro: { $exists: false } }] });

        res.json({ total, upcoming, needsReferee });
    } catch (err) {
        console.error("Error en /games/stats:", err);
        res.status(500).json({ total: 0, upcoming: 0, needsReferee: 0, error: err.message });
    }
});

// Obtener estadísticas de juegos
router.get('/stats', async (req, res) => {
    try {
        // Obtener estadísticas básicas
        const totalGames = await Game.countDocuments();
        // Puedes personalizar estas estadísticas según necesites
        res.json({
            totalGames,
            message: 'Estadísticas obtenidas correctamente'
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
app.use('/api/games', gameRoutes);
