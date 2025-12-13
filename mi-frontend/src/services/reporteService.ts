// @ts-nocheck
import { showError, showSuccess, showWarning } from '../utils/toast';

interface Game {
  _id?: string;
  name: string;
  date: string;
  time: string;
  location: string;
  ubicacionId?: string;
  arbitro?: {
    _id: string;
    nombre: string;
    apellido?: string;
  } | null;
  calificacionArbitro?: number;
  estado?: string;
}

interface User {
  _id: string;
  nombre?: string;
  apellido?: string;
  username?: string;
}

type JsPDF = new () => {
  internal: {
    pageSize: { width: number; height: number };
  };
  setFillColor: (r: number, g: number, b: number) => void;
  rect: (x: number, y: number, w: number, h: number, style: string) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setFontSize: (size: number) => void;
  setFont: (family: string, style?: string) => void;
  text: (text: string, x: number, y: number, options?: { align?: string }) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  addPage: () => void;
  save: (filename: string) => void;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  let date: Date;
  if (dateString.includes('/')) {
    // Formato DD/MM/YYYY
    const [day, month, year] = dateString.split('/').map(Number);
    date = new Date(year, month - 1, day);
  } else if (dateString.includes('-')) {
    // Formato YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateString);
  }
  
  return date.toLocaleDateString('es-MX', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric'
  });
};

const formatTime = (timeString: string): string => {
  if (!timeString) return 'N/A';
  const [hour, minute] = timeString.split(':').map(Number);
  const isPM = hour >= 12;
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
};

const getMesNombre = (mes: number): string => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes - 1] || '';
};

export const descargarReportePDF = async (
  mes: number,
  ano: number,
  games: Game[],
  user: User | null
): Promise<void> => {
  // Verificar que jsPDF está disponible
  const jsPDFConstructor = (window as unknown as { jsPDF?: JsPDF }).jsPDF;
  if (!jsPDFConstructor) {
    showError('Error: jsPDF no está disponible');
    throw new Error('jsPDF not available');
  }

  // Filtrar partidos del mes seleccionado
  console.log('Games recibidos:', games.length, games);
  const partidosMes = games.filter(g => {
    // El campo es 'date' no 'fecha'
    if (!g.date) return false;
    
    // Parsear la fecha correctamente
    let dateObj: Date;
    if (g.date.includes('/')) {
      // Formato DD/MM/YYYY
      const [day, month, year] = g.date.split('/').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else if (g.date.includes('-')) {
      // Formato YYYY-MM-DD
      const [year, month, day] = g.date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(g.date);
    }
    
    const matchMonth = dateObj.getMonth() + 1 === mes;
    const matchYear = dateObj.getFullYear() === ano;
    console.log(`Partido ${g.name}: date=${g.date}, mes=${dateObj.getMonth() + 1}, año=${dateObj.getFullYear()}, match=${matchMonth && matchYear}`);
    return matchMonth && matchYear;
  });

  console.log('Partidos filtrados:', partidosMes.length);

  if (partidosMes.length === 0) {
    showWarning('No hay partidos en el mes seleccionado');
    throw new Error('No games in selected month');
  }

  try {
    const doc = new jsPDFConstructor();
    const pageWidth = doc.internal.pageSize.width;
    let currentY = 20;
    const lineHeight = 8;

    // Header con fondo verde
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RefZone', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporte de Partidos - ${getMesNombre(mes)} ${ano}`, pageWidth / 2, 30, { align: 'center' });

    currentY = 55;

    // Información del organizador
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Organizador:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(user?.nombre && user?.apellido 
      ? `${user.nombre} ${user.apellido}` 
      : user?.username || 'No identificado', 45, currentY);

    currentY += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de generación:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      timeZone: 'America/Mexico_City'
    }), 60, currentY);

    currentY += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Total de partidos:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(partidosMes.length.toString(), 52, currentY);

    currentY += lineHeight + 5;

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 10;

    // Resumen estadístico
    const partidosConArbitro = partidosMes.filter(p => p.arbitro);
    const partidosSinArbitro = partidosMes.filter(p => !p.arbitro);
    const promedioCalificacion = partidosConArbitro.filter(p => p.calificacionArbitro)
      .reduce((acc, p, _, arr) => acc + (p.calificacionArbitro || 0) / arr.length, 0);

    doc.setFillColor(245, 245, 245);
    doc.rect(15, currentY - 5, pageWidth - 30, 25, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen:', 20, currentY + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(`Con árbitro: ${partidosConArbitro.length}`, 20, currentY + 12);
    doc.text(`Sin árbitro: ${partidosSinArbitro.length}`, 70, currentY + 12);
    if (promedioCalificacion > 0) {
      doc.text(`Promedio calificación: ${promedioCalificacion.toFixed(1)} ⭐`, 120, currentY + 12);
    }

    currentY += 30;

    // Detalle de partidos
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('Detalle de Partidos', 15, currentY);
    currentY += 10;

    // Ordenar partidos por fecha
    const partidosOrdenados = [...partidosMes].sort((a, b) => {
      const getDate = (dateStr: string) => {
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/').map(Number);
          return new Date(year, month - 1, day).getTime();
        } else if (dateStr.includes('-')) {
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day).getTime();
        }
        return new Date(dateStr).getTime();
      };
      return getDate(a.date) - getDate(b.date);
    });

    partidosOrdenados.forEach((partido, index) => {
      // Nueva página si no hay espacio
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Fondo alternado
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, currentY - 4, pageWidth - 30, 30, 'F');
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(`${index + 1}. ${partido.name}`, 20, currentY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      currentY += 7;
      doc.text(`📅 ${formatDate(partido.date)}`, 25, currentY);
      doc.text(`🕐 ${formatTime(partido.time)}`, 70, currentY);
      
      currentY += 7;
      doc.text(`📍 ${partido.location || 'Sin ubicación'}`, 25, currentY);
      
      currentY += 7;
      const arbitroNombre = partido.arbitro 
        ? `${partido.arbitro.nombre}${partido.arbitro.apellido ? ' ' + partido.arbitro.apellido : ''}`
        : 'Sin asignar';
      doc.text(`⚽ Árbitro: ${arbitroNombre}`, 25, currentY);
      
      if (partido.calificacionArbitro) {
        doc.text(`⭐ ${partido.calificacionArbitro}/5`, 120, currentY);
      }

      currentY += 12;
    });

    // Pie de página
    const totalPages = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado por RefZone', pageWidth / 2, totalPages - 10, { align: 'center' });

    // Descargar
    doc.save(`RefZone_Reporte_${getMesNombre(mes)}_${ano}.pdf`);
    showSuccess('Reporte descargado correctamente');
  } catch (error) {
    console.error('Error generando PDF:', error);
    showError('Error al generar el reporte PDF');
    throw error;
  }
};

export default {
  descargarReportePDF,
};
