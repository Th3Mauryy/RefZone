import nodemailer from 'nodemailer';

// Crear transporter reutilizable
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });
  }
  return transporter;
}

// ============================================
// TEMPLATES DE EMAIL
// ============================================
const templates = {
  cancellation: (nombre: string, gameName: string, date: string, time: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">Partido Cancelado</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>El partido <strong>"${gameName}"</strong> ha sido <strong>cancelado</strong>.</p>
      <p><strong>Fecha:</strong> ${date} a las ${time}</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">Equipo RefZone</p>
    </div>
  `,
  
  assignment: (nombre: string, gameName: string, date: string, time: string, location: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">¡Felicidades!</h2>
      <p>¡Felicidades, <strong>${nombre}</strong>!</p>
      <p>Has sido asignado al partido <strong>"${gameName}"</strong>.</p>
      <p><strong>Fecha:</strong> ${date} a las ${time}</p>
      <p><strong>Ubicación:</strong> ${location}</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">Equipo RefZone</p>
    </div>
  `,
  
  substitutionOld: (nombre: string, gameName: string, razon: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ffc107;">Sustitución en partido</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Has sido sustituido en el partido <strong>"${gameName}"</strong>.</p>
      <p><strong>Razón:</strong> ${razon}</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">Equipo RefZone</p>
    </div>
  `,
  
  substitutionNew: (nombre: string, gameName: string, date: string, time: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">¡Felicidades!</h2>
      <p>¡Felicidades, <strong>${nombre}</strong>!</p>
      <p>Has sido asignado al partido <strong>"${gameName}"</strong>.</p>
      <p><strong>Fecha:</strong> ${date} a las ${time}</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">Equipo RefZone</p>
    </div>
  `,
  
  unassignment: (nombre: string, gameName: string, date: string, time: string, razon: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ffc107;">Has sido desasignado</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Has sido desasignado del partido <strong>"${gameName}"</strong>.</p>
      <p><strong>Fecha:</strong> ${date} a las ${time}</p>
      <p><strong>Razón:</strong> ${razon}</p>
      <p>Puedes volver a postularte si lo deseas.</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">Equipo RefZone</p>
    </div>
  `,

  passwordReset: (nombre: string, resetUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #007bff;">Recuperar Contraseña</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
      <p style="margin-top: 20px; color: #666;">Este enlace expirará en 1 hora.</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">Equipo RefZone</p>
    </div>
  `,

  welcome: (nombre: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">¡Bienvenido a RefZone!</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <p>Ya puedes empezar a postularte para arbitrar partidos.</p>
      <hr style="border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">Equipo RefZone</p>
    </div>
  `
};

// ============================================
// FUNCIONES DE ENVÍO
// ============================================
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await getTransporter().sendMail({
      from: `"Soporte RefZone" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
}

// ============================================
// EMAILS DE PARTIDOS
// ============================================
export function sendCancellationEmails(game: any): void {
  setImmediate(async () => {
    try {
      const emailPromises: Promise<boolean>[] = [];

      // Emails a postulados
      if (game.postulados?.length > 0) {
        game.postulados.forEach((postulado: any) => {
          emailPromises.push(
            sendEmail(
              postulado.email,
              'Partido Cancelado - RefZone',
              templates.cancellation(postulado.nombre, game.name, game.date, game.time)
            )
          );
        });
      }

      // Email al árbitro
      if (game.arbitro) {
        emailPromises.push(
          sendEmail(
            game.arbitro.email,
            'Partido Cancelado - RefZone',
            templates.cancellation(game.arbitro.nombre, game.name, game.date, game.time)
          )
        );
      }

      await Promise.allSettled(emailPromises);
      console.log('✅ Emails de cancelación enviados');
    } catch (error) {
      console.error('Error emails cancelación:', error);
    }
  });
}

export function sendAssignmentEmail(referee: any, game: any): void {
  setImmediate(async () => {
    try {
      await sendEmail(
        referee.email,
        '¡Felicidades! Has sido asignado a un partido',
        templates.assignment(referee.nombre, game.name, game.date, game.time, game.location)
      );
      console.log('✅ Email de asignación enviado');
    } catch (error) {
      console.error('Error email asignación:', error);
    }
  });
}

export function sendSubstitutionEmails(game: any, anterior: any, nuevo: any, razon: string): void {
  setImmediate(async () => {
    try {
      await Promise.allSettled([
        sendEmail(
          anterior.email,
          'Sustitución en partido - RefZone',
          templates.substitutionOld(anterior.nombre, game.name, razon)
        ),
        sendEmail(
          nuevo.email,
          '¡Felicidades! Has sido asignado a un partido',
          templates.substitutionNew(nuevo.nombre, game.name, game.date, game.time)
        )
      ]);
      console.log('✅ Emails de sustitución enviados');
    } catch (error) {
      console.error('Error emails sustitución:', error);
    }
  });
}

export function sendUnassignmentEmail(arbitro: any, game: any, razon: string): void {
  setImmediate(async () => {
    try {
      await sendEmail(
        arbitro.email,
        'Has sido desasignado de un partido - RefZone',
        templates.unassignment(arbitro.nombre, game.name, game.date, game.time, razon)
      );
      console.log('✅ Correo de desasignación enviado');
    } catch (error) {
      console.error('Error email desasignación:', error);
    }
  });
}

// ============================================
// EMAILS DE AUTENTICACIÓN
// ============================================
export async function sendPasswordResetEmail(email: string, nombre: string, resetUrl: string): Promise<boolean> {
  return sendEmail(
    email,
    'Recuperar Contraseña - RefZone',
    templates.passwordReset(nombre, resetUrl)
  );
}

export async function sendWelcomeEmail(email: string, nombre: string): Promise<boolean> {
  return sendEmail(
    email,
    '¡Bienvenido a RefZone!',
    templates.welcome(nombre)
  );
}

// Exportar templates para uso en otros lugares
export { templates };
