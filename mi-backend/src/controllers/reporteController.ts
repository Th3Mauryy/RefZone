import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as reporteService from '../services/reporteService';

// ============================================
// REPORTE EN JSON
// ============================================
export async function getReporteDatos(req: Request, res: Response): Promise<void> {
  try {
    const { mes, anio } = req.query;
    let { canchaId } = req.query;
    
    if (!mes || !anio) {
      res.status(400).json({ message: 'Mes y año son requeridos' });
      return;
    }
    
    // Si no hay canchaId, obtener la del usuario
    if (!canchaId) {
      const userId = (req.user as any)?.id;
      const userCanchaId = await reporteService.getCanchaUsuario(userId);
      if (!userCanchaId) {
        res.status(400).json({ message: 'No tiene una cancha asignada' });
        return;
      }
      canchaId = userCanchaId;
    }
    
    // Validar mes
    if (!reporteService.validarMes(mes as string)) {
      res.status(400).json({ message: 'Mes inválido' });
      return;
    }
    
    const datos = await reporteService.obtenerDatosReporte(
      canchaId as string,
      mes as string,
      parseInt(anio as string)
    );
    
    if (!datos) {
      res.status(404).json({ message: 'Cancha no encontrada o mes inválido' });
      return;
    }
    
    res.json(datos);
  } catch (error) {
    const err = error as Error;
    console.error('Error al generar datos del reporte:', err);
    res.status(500).json({ message: 'Error al generar datos del reporte', error: err.message });
  }
}

// ============================================
// REPORTE EN PDF
// ============================================
export async function getReportePDF(req: Request, res: Response): Promise<void> {
  try {
    const { mes, anio } = req.query;
    let { canchaId } = req.query;
    
    if (!mes || !anio) {
      res.status(400).json({ message: 'Mes y año son requeridos' });
      return;
    }
    
    // Si no hay canchaId, obtener la del usuario
    if (!canchaId) {
      const userId = (req.user as any)?.id;
      const userCanchaId = await reporteService.getCanchaUsuario(userId);
      if (!userCanchaId) {
        res.status(400).json({ message: 'No tiene una cancha asignada' });
        return;
      }
      canchaId = userCanchaId;
    }
    
    // Validar mes
    if (!reporteService.validarMes(mes as string)) {
      res.status(400).json({ message: 'Mes inválido' });
      return;
    }
    
    const resultado = await reporteService.obtenerPartidosPDF(
      canchaId as string,
      mes as string,
      parseInt(anio as string)
    );
    
    if (!resultado) {
      res.status(404).json({ message: 'Cancha no encontrada' });
      return;
    }
    
    const { partidos, cancha } = resultado;
    const mesNormalizado = (mes as string).toLowerCase();
    const anioNum = parseInt(anio as string);
    
    // Crear PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename=reporte-partidos-${cancha.nombre.replace(/\s+/g, '-')}-${mesNormalizado}-${anioNum}.pdf`
    );
    
    doc.pipe(res);
    
    // Generar contenido del PDF
    generarContenidoPDF(doc, cancha, partidos, mes as string, anioNum);
    
    doc.end();
  } catch (error) {
    const err = error as Error;
    console.error('Error al generar el reporte PDF:', err);
    res.status(500).json({ message: 'Error al generar el reporte PDF', error: err.message });
  }
}

// ============================================
// RUTA DE PRUEBA
// ============================================
export function testReportes(_req: Request, res: Response): void {
  console.log('Ruta de prueba de reportes accedida');
  res.json({ message: 'API de reportes funcionando correctamente' });
}

// ============================================
// FUNCIONES AUXILIARES PARA PDF
// ============================================
function generarContenidoPDF(
  doc: PDFKit.PDFDocument,
  cancha: any,
  partidos: any[],
  mes: string,
  anio: number
): void {
  // Encabezado
  doc.fontSize(22).font('Helvetica-Bold').text('RefZone - Reporte de Partidos', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(16).font('Helvetica').text(cancha.nombre, { align: 'center' });
  doc.fontSize(14).font('Helvetica').text(
    `${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${anio}`, 
    { align: 'center' }
  );
  doc.moveDown(1);
  
  // Información de la cancha
  doc.fontSize(12).font('Helvetica-Bold').text('Información de la cancha:');
  doc.fontSize(10).font('Helvetica').text(`Dirección: ${cancha.direccion || 'No disponible'}`);
  doc.fontSize(10).font('Helvetica').text(`Contacto: ${cancha.telefono || 'No disponible'}`);
  doc.fontSize(10).font('Helvetica').text(`Email: ${cancha.email || 'No disponible'}`);
  doc.moveDown(1);
  
  // Resumen
  doc.fontSize(12).font('Helvetica-Bold').text('Resumen del período:');
  doc.fontSize(10).font('Helvetica').text(`Total de partidos: ${partidos.length}`);
  
  const partidosConArbitro = partidos.filter((p: any) => p.arbitro);
  doc.fontSize(10).font('Helvetica').text(`Partidos con árbitro asignado: ${partidosConArbitro.length}`);
  doc.fontSize(10).font('Helvetica').text(`Partidos sin árbitro: ${partidos.length - partidosConArbitro.length}`);
  doc.moveDown(1.5);
  
  // Tabla de partidos
  generarTablaPartidos(doc, partidos);
  
  // Pie de página
  doc.moveDown(2);
  const fechaGeneracion = new Date();
  doc.fontSize(8).font('Helvetica-Oblique').text(
    `Reporte generado el ${format(fechaGeneracion, 'dd/MM/yyyy HH:mm:ss', { locale: es })}`, 
    { align: 'center' }
  );
}

function generarTablaPartidos(doc: PDFKit.PDFDocument, partidos: any[]): void {
  if (partidos.length === 0) {
    doc.fontSize(12).font('Helvetica-Oblique').text('No hay partidos registrados para este período.');
    return;
  }
  
  doc.fontSize(12).font('Helvetica-Bold').text('Lista de partidos:');
  doc.moveDown(0.5);
  
  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidths = [80, 140, 100, 160];
  const rowHeight = 20;
  
  // Encabezados
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Fecha', tableLeft, tableTop);
  doc.text('Nombre', tableLeft + colWidths[0], tableTop);
  doc.text('Hora', tableLeft + colWidths[0] + colWidths[1], tableTop);
  doc.text('Árbitro', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
  
  doc.moveTo(tableLeft, tableTop + 15)
     .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop + 15)
     .stroke();
  
  doc.font('Helvetica');
  let y = tableTop + 25;
  
  for (const partido of partidos) {
    if (y + rowHeight > doc.page.height - 50) {
      doc.addPage();
      y = 50;
      
      // Repetir encabezados en nueva página
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Fecha', tableLeft, y);
      doc.text('Nombre', tableLeft + colWidths[0], y);
      doc.text('Hora', tableLeft + colWidths[0] + colWidths[1], y);
      doc.text('Árbitro', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
      
      doc.moveTo(tableLeft, y + 15)
         .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y + 15)
         .stroke();
      
      y += 25;
      doc.font('Helvetica');
    }
    
    const p = partido as any;
    const fechaFormateada = reporteService.formatearFecha(p.date);
    doc.text(fechaFormateada, tableLeft, y);
    doc.text(p.name, tableLeft + colWidths[0], y);
    doc.text(p.time, tableLeft + colWidths[0] + colWidths[1], y);
    
    const arbitroNombre = p.arbitro ? 
      (p.arbitro.nombre || p.arbitro.email) : 
      'Sin asignar';
    doc.text(arbitroNombre, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
    
    y += rowHeight;
  }
}
