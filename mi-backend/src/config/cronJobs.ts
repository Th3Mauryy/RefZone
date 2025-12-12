import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Game from '../models/Game';
import HistorialPartido from '../models/HistorialPartido';

interface GameDateTime {
  formattedDate: string;
  formattedTime: string;
}

/**
 * Formatea fecha y hora de un partido para emails
 */
function formatGameDateTime(game: any): GameDateTime {
  const dateTime = new Date(`${game.date}T${game.time}`);
  if (isNaN(dateTime.getTime())) {
    return { formattedDate: 'Fecha no disponible', formattedTime: 'Hora no disponible' };
  }
  
  const day = dateTime.getDate();
  const month = dateTime.toLocaleString('es-ES', { month: 'long' });
  const year = dateTime.getFullYear();
  const hours = dateTime.getHours();
  const minutes = dateTime.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHour = hours % 12 || 12;
  
  return {
    formattedDate: `el día ${day} de ${month} del ${year}`,
    formattedTime: `a las ${formattedHour}:${minutes} ${period}`
  };
}

/**
 * Crea el transporter de nodemailer
 */
function createEmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Procesa y archiva un partido finalizado
 */
async function archivarPartido(partido: any, transporter: nodemailer.Transporter): Promise<void> {
  const { formattedDate, formattedTime } = formatGameDateTime(partido);
  const emailPromises: Promise<any>[] = [];
  
  // Email al árbitro
  if (partido.arbitro) {
    const arbitroMailOptions = {
      from: `"Soporte Refzone" <${process.env.EMAIL_USER}>`,
      to: partido.arbitro.email,
      subject: 'Partido Finalizado y Archivado - RefZone',
      html: `<p>Hola <strong>${partido.arbitro.nombre}</strong>,</p>
<p>Te informamos que el partido <strong>"${partido.name}"</strong> programado para <strong>${formattedDate}</strong> <strong>${formattedTime}</strong> en <strong>${partido.location}</strong> ha sido <span style="color: blue; font-weight: bold;">finalizado y archivado</span> automáticamente del sistema.</p>
<p>Esperamos que el partido haya transcurrido exitosamente.</p>
<p>¡Gracias por ser parte de RefZone!</p>
<p>Saludos,<br>Equipo RefZone</p>`
    };
    emailPromises.push(transporter.sendMail(arbitroMailOptions));
  }
  
  // Emails a postulados
  if (partido.postulados?.length > 0) {
    partido.postulados.forEach((postulado: any) => {
      const postuladoMailOptions = {
        from: `"Soporte Refzone" <${process.env.EMAIL_USER}>`,
        to: postulado.email,
        subject: 'Partido Finalizado y Archivado - RefZone',
        html: `<p>Hola <strong>${postulado.nombre}</strong>,</p>
<p>Te informamos que el partido <strong>"${partido.name}"</strong> para el cual te habías postulado, programado para <strong>${formattedDate}</strong> <strong>${formattedTime}</strong> en <strong>${partido.location}</strong>, ha sido <span style="color: blue; font-weight: bold;">finalizado y archivado</span> automáticamente del sistema.</p>
<p>¡Gracias por tu interés en participar!</p>
<p>Saludos,<br>Equipo RefZone</p>`
      };
      emailPromises.push(transporter.sendMail(postuladoMailOptions));
    });
  }
  
  // Extraer mes y año
  const [year, month] = partido.date.split('-').map(Number);
  
  // Mover al historial
  const historialPartido = new HistorialPartido({
    originalId: partido._id,
    nombre: partido.name,
    fecha: partido.date,
    hora: partido.time,
    ubicacion: partido.location,
    arbitro: partido.arbitro?._id || null,
    arbitroNombre: partido.arbitro?.nombre || 'Sin asignar',
    estado: 'Finalizado',
    canchaId: partido.canchaId || null,
    razonEliminacion: 'automatica',
    mesPartido: month,
    anoPartido: year
  });
  
  await historialPartido.save();
  await Game.findByIdAndDelete(partido._id);
  
  try {
    await Promise.all(emailPromises);
    console.log(`✅ Partido ${partido.name} archivado en historial y correos enviados`);
  } catch (emailError) {
    console.error('⚠️ Error al enviar correos de finalización:', emailError);
  }
}

/**
 * Verifica y elimina partidos que ya pasaron
 */
async function verificarPartidosParaEliminacion(): Promise<void> {
  try {
    console.log('🔍 Verificando partidos para auto-eliminación...');
    
    const ahora = new Date();
    const transporter = createEmailTransporter();
    
    const partidos = await Game.find()
      .populate('arbitro', 'nombre email')
      .populate('postulados', 'nombre email');
    
    for (const partido of partidos) {
      try {
        const p = partido as any;
        
        if (typeof p.date !== 'string' || typeof p.time !== 'string') {
          continue;
        }
        
        const fechaPartido = new Date(`${p.date}T${p.time}`);
        
        if (isNaN(fechaPartido.getTime())) {
          continue;
        }
        
        // Agregar 1 hora a la fecha del partido
        const fechaEliminacion = new Date(fechaPartido.getTime() + (60 * 60 * 1000));
        
        if (ahora >= fechaEliminacion) {
          console.log(`🗑️ Auto-eliminando partido: ${p.name} (programado para ${fechaPartido})`);
          await archivarPartido(p, transporter);
        }
      } catch (error) {
        const p = partido as any;
        console.error(`❌ Error procesando partido ${p.name}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error en tarea de auto-eliminación:', error);
  }
}

/**
 * Inicia el cron job para auto-eliminación de partidos
 */
export function iniciarAutoEliminacionPartidos(): void {
  // Ejecutar cada 30 minutos
  cron.schedule('*/30 * * * *', verificarPartidosParaEliminacion);
  console.log('⏰ Tarea de auto-eliminación de partidos iniciada (cada 30 minutos)');
}
