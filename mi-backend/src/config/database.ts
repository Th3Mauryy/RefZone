import mongoose from 'mongoose';
import crearOrganizadorPorDefecto from './initOrganizador';
import crearCanchaGolwin from './initCancha';
import migrarEstadioACancha from './migrateEstadioToCancha';

/**
 * Conexión a MongoDB
 */
export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/refzone');
    console.log('✅ Conexión exitosa a MongoDB Atlas');
    
    // Ejecutar configuraciones de inicio
    await runInitialSetup();
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB Atlas:', error);
    throw error;
  }
}

/**
 * Ejecuta configuraciones iniciales después de conectar a la base de datos
 */
async function runInitialSetup(): Promise<void> {
  try {
    await crearOrganizadorPorDefecto();
    await migrarEstadioACancha();
    await crearCanchaGolwin();
  } catch (configError) {
    console.warn('⚠️ Error cargando configuraciones:', configError);
  }
}

export default mongoose;
