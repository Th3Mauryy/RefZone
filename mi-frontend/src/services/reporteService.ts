// @ts-nocheck
import { showError, showSuccess, showWarning } from '../utils/toast';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const getMesNombre = (mes: number): string => {
  return MESES[mes - 1] || '';
};

export const descargarReportePDF = async (
  mes: number,
  ano: number
): Promise<void> => {
  const mesNombre = getMesNombre(mes);
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/reportes/reporte-pdf?mes=${mesNombre}&anio=${ano}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        if (response.status === 404 || error.message?.includes('No hay partidos')) {
          showWarning('No hay partidos en el mes seleccionado');
        } else {
          showError(error.message || 'Error al generar el reporte');
        }
      } else {
        showError('Error al generar el reporte');
      }
      throw new Error('Error al generar el reporte');
    }
    
    // Descargar el PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${mesNombre}_${ano}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showSuccess('Reporte descargado correctamente');
  } catch (error: any) {
    console.error('Error descargando reporte:', error);
    throw error;
  }
};

export default {
  descargarReportePDF,
};
