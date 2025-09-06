const User = require('../models/User');

async function crearOrganizadorPorDefecto() {
    const emailOrganizador = (process.env.DEFAULT_ORGANIZER_EMAIL || 'organizador@gmail.com').trim().toLowerCase();
    const passwordOrganizador = process.env.DEFAULT_ORGANIZER_PASSWORD || '12345';

    const existingOrganizer = await User.findOne({ email: emailOrganizador });
    if (!existingOrganizer) {
        const newOrganizer = new User({
            email: emailOrganizador,
            password: passwordOrganizador,
            nombre: 'Organizador Principal',
            edad: 30,
            contacto: '+1234567890',
            experiencia: 'admin',
            role: 'organizador'
        });
        await newOrganizer.save();
        console.log('Organizador por defecto creado');
    } else {
        console.log('El organizador por defecto ya existe');
    }
}

module.exports = crearOrganizadorPorDefecto;
