const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/refzone')
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    const User = require('../models/User');
    
    // Buscar usuario por email
    const user = await User.findOne({ email: 'mendoza.mauriciogbueno@gmail.com' });
    
    if (user) {
      console.log('\n📋 DATOS DEL USUARIO MAURICIO:');
      console.log('================================');
      console.log('ID:', user._id);
      console.log('Nombre:', user.nombre);
      console.log('Email:', user.email);
      console.log('Edad:', user.edad);
      console.log('Contacto:', user.contacto);
      console.log('Experiencia:', user.experiencia);
      console.log('Imagen Perfil:', user.imagenPerfil);
      console.log('Role:', user.role);
      console.log('\n================================');
      
      // Verificar qué campos están vacíos o son null
      const camposVacios = [];
      if (!user.edad) camposVacios.push('edad');
      if (!user.contacto) camposVacios.push('contacto');
      if (!user.experiencia) camposVacios.push('experiencia');
      if (!user.imagenPerfil) camposVacios.push('imagenPerfil');
      
      if (camposVacios.length > 0) {
        console.log('⚠️  CAMPOS VACÍOS O NULL:', camposVacios.join(', '));
      } else {
        console.log('✅ Todos los campos tienen datos');
      }
    } else {
      console.log('❌ Usuario no encontrado');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
