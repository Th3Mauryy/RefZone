import Game from '../models/Game';
import User from '../models/User';
import Cancha from '../models/Cancha';
import HistorialPartido from '../models/HistorialPartido';

// ============================================
// TIPOS
// ============================================
export interface MesesMap {
  [key: string]: number;
}

export interface PartidoReporte {
  id: string;
  nombre: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  cancha: string;
  arbitro: string;
  tieneArbitro: boolean;
  estado: string;
  esHistorial: boolean;
}

export interface DatosReporte {
  cancha: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
  };
  periodo: {
    mes: string;
    anio: number;
  };
  partidos: PartidoReporte[];
  estadisticas: {
    total: number;
    conArbitro: number;
    sinArbitro: number;
    programados: number;
    enCurso: number;
    finalizados: number;
    cancelados: number;
  };
  fechaGeneracion: Date;
}

// ============================================
// CONSTANTES
// ============================================
export const MESES: MesesMap = {
  'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
  'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Determina el estado actual de un partido basado en fecha y hora
 */
export function determinarEstadoPartido(fechaStr: string, horaStr: string): string {
  try {
    const ahora = new Date();
    let fechaPartido: Date | undefined;
    
    if (typeof fechaStr === 'string') {
      if (fechaStr.includes('-')) {
        fechaPartido = new Date(fechaStr + 'T' + (horaStr || '00:00'));
      } else if (fechaStr.includes('/')) {
        const partes = fechaStr.split('/');
        if (partes.length === 3) {
          if (parseInt(partes[0]) > 12) {
            fechaPartido = new Date(`${partes[2]}-${partes[1]}-${partes[0]}T${horaStr || '00:00'}`);
          } else {
            fechaPartido = new Date(`${partes[2]}-${partes[0]}-${partes[1]}T${horaStr || '00:00'}`);
          }
        }
      }
    }
    
    if (!fechaPartido || isNaN(fechaPartido.getTime())) {
      return 'Programado';
    }
    
    const diferenciaMs = ahora.getTime() - fechaPartido.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
    
    if (diferenciaHoras < 0) {
      return 'Programado';
    } else if (diferenciaHoras >= 0 && diferenciaHoras <= 1) {
      return 'En curso';
    } else {
      return 'Finalizado';
    }
  } catch (error) {
    console.error('Error al determinar estado del partido:', error);
    return 'Programado';
  }
}

/**
 * Formatea una fecha para mostrar
 */
export function formatearFecha(fechaStr: string): string {
  let fecha: Date;
  if (fechaStr.includes('-')) {
    fecha = new Date(fechaStr);
  } else {
    const partes = fechaStr.split('/');
    if (partes.length === 3) {
      if (parseInt(partes[0]) > 12) {
        fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
      } else {
        fecha = new Date(`${partes[2]}-${partes[0]}-${partes[1]}`);
      }
    } else {
      return fechaStr;
    }
  }
  
  if (isNaN(fecha.getTime())) return fechaStr;
  
  const day = fecha.getDate().toString().padStart(2, '0');
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const year = fecha.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Obtiene la cancha asignada de un usuario
 */
export async function getCanchaUsuario(userId: string): Promise<string | null> {
  const user = await User.findById(userId).populate('canchaAsignada');
  if (!user || !user.canchaAsignada) {
    return null;
  }
  return (user.canchaAsignada as any)._id.toString();
}

/**
 * Valida y obtiene el número del mes
 */
export function validarMes(mes: string): number | null {
  const mesNormalizado = mes.toLowerCase();
  return MESES[mesNormalizado] || null;
}

// ============================================
// SERVICIOS PRINCIPALES
// ============================================

/**
 * Obtiene los datos para el reporte de partidos
 */
export async function obtenerDatosReporte(
  canchaId: string,
  mes: string,
  anio: number
): Promise<DatosReporte | null> {
  const mesNumero = validarMes(mes);
  if (!mesNumero) return null;
  
  const mesPadded = mesNumero.toString().padStart(2, '0');
  
  // Buscar partidos activos
  const partidosActivos = await Game.find({ 
    canchaId, 
    date: {
      $regex: new RegExp(`${anio}-${mesPadded}|${mesPadded}/${anio}|${mesPadded}/${String(anio).slice(2)}|${anio}/${mesPadded}`)
    }
  })
  .populate('arbitro', 'nombre email')
  .sort({ date: 1, time: 1 });

  // Buscar partidos históricos
  const partidosHistoricos = await HistorialPartido.find({
    canchaId,
    mesPartido: mesNumero,
    anoPartido: anio
  })
  .populate('arbitro', 'nombre email')
  .sort({ date: 1, time: 1 });
  
  // Obtener cancha
  const cancha = await Cancha.findById(canchaId);
  if (!cancha) return null;
  
  // Combinar y formatear partidos
  const todosPartidos: PartidoReporte[] = [
    ...partidosActivos.map((p: any) => ({
      id: p._id.toString(),
      nombre: p.name,
      fecha: p.date,
      hora: p.time,
      ubicacion: p.location,
      cancha: cancha.nombre,
      arbitro: p.arbitro ? (p.arbitro.nombre || p.arbitro.email) : 'Sin asignar',
      tieneArbitro: !!p.arbitro,
      estado: determinarEstadoPartido(p.date, p.time),
      esHistorial: false
    })),
    ...partidosHistoricos.map((p: any) => ({
      id: p._id.toString(),
      nombre: p.nombre,
      fecha: p.fecha,
      hora: p.hora,
      ubicacion: p.ubicacion,
      cancha: cancha.nombre,
      arbitro: p.arbitroNombre || (p.arbitro ? (p.arbitro.nombre || p.arbitro.email) : 'Sin asignar'),
      tieneArbitro: !!p.arbitro,
      estado: p.estado || 'Finalizado',
      esHistorial: true
    }))
  ].sort((a, b) => {
    const fechaA = new Date(`${a.fecha}T${a.hora || '00:00'}`);
    const fechaB = new Date(`${b.fecha}T${b.hora || '00:00'}`);
    return fechaA.getTime() - fechaB.getTime();
  });
  
  return {
    cancha: {
      nombre: cancha.nombre,
      direccion: cancha.direccion || 'No disponible',
      telefono: cancha.telefono || 'No disponible',
      email: cancha.email || 'No disponible'
    },
    periodo: {
      mes: mes.charAt(0).toUpperCase() + mes.slice(1),
      anio
    },
    partidos: todosPartidos,
    estadisticas: {
      total: todosPartidos.length,
      conArbitro: todosPartidos.filter(p => p.tieneArbitro).length,
      sinArbitro: todosPartidos.filter(p => !p.tieneArbitro).length,
      programados: todosPartidos.filter(p => p.estado === 'Programado').length,
      enCurso: todosPartidos.filter(p => p.estado === 'En curso').length,
      finalizados: todosPartidos.filter(p => p.estado === 'Finalizado').length,
      cancelados: todosPartidos.filter(p => p.estado === 'Cancelado').length
    },
    fechaGeneracion: new Date()
  };
}

/**
 * Obtiene los partidos para el PDF
 */
export async function obtenerPartidosPDF(
  canchaId: string,
  mes: string,
  anio: number
): Promise<{ partidos: any[]; cancha: any } | null> {
  const mesNumero = validarMes(mes);
  if (!mesNumero) return null;
  
  const mesPadded = mesNumero.toString().padStart(2, '0');
  
  const partidos = await Game.find({ 
    canchaId, 
    date: {
      $regex: new RegExp(`${anio}-${mesPadded}|${mesPadded}/${anio}|${mesPadded}/${String(anio).slice(2)}|${anio}/${mesPadded}`)
    }
  })
  .populate('arbitro', 'nombre email')
  .sort({ date: 1, time: 1 });
  
  const cancha = await Cancha.findById(canchaId);
  if (!cancha) return null;
  
  return { partidos, cancha };
}
