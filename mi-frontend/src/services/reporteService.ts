// @ts-nocheck
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
        // DD/MM/YYYY
        fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      } else {
        // MM/DD/YYYY
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
    case 'Programado': return '#22c55e'; // verde
    case 'En curso': return '#3b82f6'; // azul
    case 'Finalizado': return '#f59e0b'; // amarillo/naranja
    case 'Cancelado': return '#ef4444'; // rojo
    default: return '#6b7280'; // gris
  }
};

export const descargarReportePDF = async (
  mes: number,
  ano: number
): Promise<void> => {
  const mesNombre = getMesNombre(mes);
  
  try {
    // Obtener datos del backend
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
    
    // Abrir en nueva ventana para imprimir/guardar como PDF
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(htmlContent);
      ventana.document.close();
      
      // Esperar a que cargue el contenido y luego imprimir
      setTimeout(() => {
        ventana.print();
      }, 500);
      
      showSuccess('Reporte generado correctamente');
    } else {
      showError('No se pudo abrir la ventana de impresión. Verifica que no estén bloqueados los popups.');
    }
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
      <td>${formatearFecha(p.fecha)}</td>
      <td>${p.nombre}</td>
      <td>${p.hora || 'N/A'}</td>
      <td>${p.ubicacion || cancha.nombre}</td>
      <td>${p.arbitro}</td>
      <td style="color: ${getEstadoColor(p.estado)}; font-weight: bold;">${p.estado}</td>
    </tr>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Partidos - ${cancha.nombre} - ${periodo.mes} ${periodo.anio}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 5px;
        }
        .header h2 {
          font-size: 22px;
          font-weight: normal;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #22c55e;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #22c55e;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #22c55e;
          padding: 15px 20px;
          margin-bottom: 20px;
        }
        .info-box p {
          margin: 5px 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .stat-card {
          text-align: center;
          padding: 15px;
          border-radius: 8px;
          color: white;
        }
        .stat-card.total { background: #3b82f6; }
        .stat-card.con-arbitro { background: #22c55e; }
        .stat-card.sin-arbitro { background: #f59e0b; }
        .stat-card.programados { background: #22c55e; }
        .stat-card.en-curso { background: #3b82f6; }
        .stat-card.finalizados { background: #f59e0b; }
        .stat-card.cancelados { background: #ef4444; }
        .stat-card .number {
          font-size: 32px;
          font-weight: bold;
        }
        .stat-card .label {
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.9;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background: #22c55e;
          color: white;
          padding: 12px 10px;
          text-align: left;
          font-size: 13px;
          text-transform: uppercase;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        tr:hover {
          background: #f3f4f6;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          color: #6b7280;
          font-size: 12px;
        }
        @media print {
          body { background: white; }
          .container { box-shadow: none; }
          .header { 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .stat-card {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          th {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>RefZone - Reporte de Partidos</h1>
          <h2>${cancha.nombre}</h2>
          <p>${periodo.mes} de ${periodo.anio}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">Información de la cancha:</div>
            <div class="info-box">
              <p><strong>Dirección:</strong> ${cancha.direccion}</p>
              <p><strong>Contacto:</strong> ${cancha.telefono}</p>
              <p><strong>Email:</strong> ${cancha.email}</p>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Resumen del período:</div>
            <div class="stats-grid">
              <div class="stat-card total">
                <div class="number">${estadisticas.total}</div>
                <div class="label">Total partidos</div>
              </div>
              <div class="stat-card con-arbitro">
                <div class="number">${estadisticas.conArbitro}</div>
                <div class="label">Con árbitro</div>
              </div>
              <div class="stat-card sin-arbitro">
                <div class="number">${estadisticas.sinArbitro}</div>
                <div class="label">Sin árbitro</div>
              </div>
              <div class="stat-card programados">
                <div class="number">${estadisticas.programados}</div>
                <div class="label">Programados</div>
              </div>
              <div class="stat-card en-curso">
                <div class="number">${estadisticas.enCurso}</div>
                <div class="label">En curso</div>
              </div>
              <div class="stat-card finalizados">
                <div class="number">${estadisticas.finalizados}</div>
                <div class="label">Finalizados</div>
              </div>
              <div class="stat-card cancelados">
                <div class="number">${estadisticas.cancelados}</div>
                <div class="label">Cancelados</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Lista de partidos:</div>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Hora</th>
                  <th>Ubicación</th>
                  <th>Árbitro</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${partidosHTML}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="footer">
          <p>Reporte generado el ${new Date().toLocaleString('es-MX', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p>RefZone - Gestión de Partidos Deportivos</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default {
  descargarReportePDF,
};
