// @ts-nocheck
import html2pdf from 'html2pdf.js';
import { showError, showSuccess, showWarning } from '../utils/toast';

interface PartidoReporte {
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

interface DatosReporte {
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
  fechaGeneracion: string;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const getMesNombre = (mes: number): string => {
  return MESES[mes - 1] || '';
};

const formatearFecha = (fechaStr: string): string => {
  if (!fechaStr) return 'N/A';
  
  let fecha: Date;
  if (fechaStr.includes('-')) {
    fecha = new Date(fechaStr + 'T00:00:00');
  } else if (fechaStr.includes('/')) {
    const partes = fechaStr.split('/');
    if (partes.length === 3) {
      if (parseInt(partes[0]) > 12) {
        fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      } else {
        fecha = new Date(parseInt(partes[2]), parseInt(partes[0]) - 1, parseInt(partes[1]));
      }
    } else {
      return fechaStr;
    }
  } else {
    return fechaStr;
  }
  
  if (isNaN(fecha.getTime())) return fechaStr;
  
  const day = fecha.getDate().toString().padStart(2, '0');
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const year = fecha.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case 'Programado': return '#22c55e';
    case 'En curso': return '#3b82f6';
    case 'Finalizado': return '#f59e0b';
    case 'Cancelado': return '#ef4444';
    default: return '#6b7280';
  }
};

export const descargarReportePDF = async (
  mes: number,
  ano: number
): Promise<void> => {
  const mesNombre = getMesNombre(mes);
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/reportes/reporte-datos?mes=${mesNombre}&anio=${ano}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 404 || error.message?.includes('No hay partidos')) {
        showWarning('No hay partidos en el mes seleccionado');
      } else {
        showError(error.message || 'Error al obtener datos del reporte');
      }
      throw new Error(error.message || 'Error al obtener datos');
    }
    
    const datos: DatosReporte = await response.json();
    
    if (!datos.partidos || datos.partidos.length === 0) {
      showWarning('No hay partidos en el mes seleccionado');
      throw new Error('No hay partidos');
    }
    
    // Generar HTML del reporte
    const htmlContent = generarHTMLReporte(datos);
    
    // Crear elemento temporal
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    const element = container.querySelector('.container') as HTMLElement;
    
    // Configuración de html2pdf
    const opt = {
      margin: 10,
      filename: `Reporte_${mesNombre}_${ano}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generar y descargar PDF
    await html2pdf().set(opt).from(element).save();
    
    // Limpiar elemento temporal
    document.body.removeChild(container);
    
    showSuccess('Reporte descargado correctamente');
  } catch (error: any) {
    console.error('Error generando reporte:', error);
    if (!error.message?.includes('No hay partidos')) {
      showError('Error al generar el reporte');
    }
    throw error;
  }
};

function generarHTMLReporte(datos: DatosReporte): string {
  const { cancha, periodo, partidos, estadisticas } = datos;
  
  const partidosHTML = partidos.map(p => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${formatearFecha(p.fecha)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${p.nombre}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${p.hora || 'N/A'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${p.ubicacion || cancha.nombre}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${p.arbitro}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: ${getEstadoColor(p.estado)}; font-weight: bold;">${p.estado}</td>
    </tr>
  `).join('');
  
  return `
    <div class="container" style="max-width: 800px; margin: 0 auto; background: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="font-size: 28px; margin: 0 0 5px 0;">RefZone - Reporte de Partidos</h1>
        <h2 style="font-size: 22px; font-weight: normal; margin: 0 0 5px 0;">${cancha.nombre}</h2>
        <p style="font-size: 16px; opacity: 0.9; margin: 0;">${periodo.mes} de ${periodo.anio}</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="margin-bottom: 30px;">
          <div style="font-size: 18px; font-weight: bold; color: #22c55e; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #22c55e;">Información de la cancha:</div>
          <div style="background: #f8f9fa; border-left: 4px solid #22c55e; padding: 15px 20px;">
            <p style="margin: 5px 0;"><strong>Dirección:</strong> ${cancha.direccion}</p>
            <p style="margin: 5px 0;"><strong>Contacto:</strong> ${cancha.telefono}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${cancha.email}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <div style="font-size: 18px; font-weight: bold; color: #22c55e; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #22c55e;">Resumen del período:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 100px; text-align: center; padding: 15px; border-radius: 8px; color: white; background: #3b82f6;">
              <div style="font-size: 28px; font-weight: bold;">${estadisticas.total}</div>
              <div style="font-size: 11px; text-transform: uppercase;">Total</div>
            </div>
            <div style="flex: 1; min-width: 100px; text-align: center; padding: 15px; border-radius: 8px; color: white; background: #22c55e;">
              <div style="font-size: 28px; font-weight: bold;">${estadisticas.conArbitro}</div>
              <div style="font-size: 11px; text-transform: uppercase;">Con árbitro</div>
            </div>
            <div style="flex: 1; min-width: 100px; text-align: center; padding: 15px; border-radius: 8px; color: white; background: #f59e0b;">
              <div style="font-size: 28px; font-weight: bold;">${estadisticas.sinArbitro}</div>
              <div style="font-size: 11px; text-transform: uppercase;">Sin árbitro</div>
            </div>
            <div style="flex: 1; min-width: 100px; text-align: center; padding: 15px; border-radius: 8px; color: white; background: #22c55e;">
              <div style="font-size: 28px; font-weight: bold;">${estadisticas.programados}</div>
              <div style="font-size: 11px; text-transform: uppercase;">Programados</div>
            </div>
            <div style="flex: 1; min-width: 100px; text-align: center; padding: 15px; border-radius: 8px; color: white; background: #3b82f6;">
              <div style="font-size: 28px; font-weight: bold;">${estadisticas.enCurso}</div>
              <div style="font-size: 11px; text-transform: uppercase;">En curso</div>
            </div>
            <div style="flex: 1; min-width: 100px; text-align: center; padding: 15px; border-radius: 8px; color: white; background: #f59e0b;">
              <div style="font-size: 28px; font-weight: bold;">${estadisticas.finalizados}</div>
              <div style="font-size: 11px; text-transform: uppercase;">Finalizados</div>
            </div>
            <div style="flex: 1; min-width: 100px; text-align: center; padding: 15px; border-radius: 8px; color: white; background: #ef4444;">
              <div style="font-size: 28px; font-weight: bold;">${estadisticas.cancelados}</div>
              <div style="font-size: 11px; text-transform: uppercase;">Cancelados</div>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <div style="font-size: 18px; font-weight: bold; color: #22c55e; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #22c55e;">Lista de partidos:</div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="background: #22c55e; color: white; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase;">Fecha</th>
                <th style="background: #22c55e; color: white; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase;">Nombre</th>
                <th style="background: #22c55e; color: white; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase;">Hora</th>
                <th style="background: #22c55e; color: white; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase;">Ubicación</th>
                <th style="background: #22c55e; color: white; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase;">Árbitro</th>
                <th style="background: #22c55e; color: white; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${partidosHTML}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #f8f9fa; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Reporte generado el ${new Date().toLocaleString('es-MX', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p style="margin: 5px 0 0 0;">RefZone - Gestión de Partidos Deportivos</p>
      </div>
    </div>
  `;
}

export default {
  descargarReportePDF,
};
