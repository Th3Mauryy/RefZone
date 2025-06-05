const User = require('../models/User');

async function crearOrganizadorPorDefecto() {
    const emailOrganizador = 'organizador@gmail.com';
    const passwordOrganizador = '12345';

    const existingOrganizer = await User.findOne({ email: emailOrganizador });
    if (!existingOrganizer) {
        const newOrganizer = new User({
            email: emailOrganizador,
            password: passwordOrganizador,
            role: 'organizador' // Fija el rol como organizador
        });
        await newOrganizer.save();
        console.log('Organizador por defecto creado');
    } else {
        console.log('El organizador por defecto ya existe');
    }
}

module.exports = crearOrganizadorPorDefecto;
