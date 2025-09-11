const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const es = require('date-fns/locale/es');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

/**
 * Genera un reporte PDF de los partidos de una cancha para un mes y año específicos
 * @route GET /reporte-pdf
 * @param {string} mes - Mes para el reporte (nombre del mes en español)
 * @param {string} anio - Año para el reporte (4 dígitos)
 * @param {string} canchaId - ID de la cancha (opcional, si no se proporciona se usa la cancha del usuario)
 */
router.get('/reporte-pdf', verifyToken, async (req, res) => {
    try {
        const { mes, anio } = req.query;
        let { canchaId } = req.query;
        
        if (!mes || !anio) {
            return res.status(400).json({ message: 'Mes y año son requeridos' });
        }
        
        // Si no se proporciona canchaId, usar la del organizador
        if (!canchaId) {
            const user = await User.findById(req.user.id).populate('canchaAsignada');
            if (!user || !user.canchaAsignada) {
                return res.status(400).json({ message: 'No tiene una cancha asignada' });
            }
            canchaId = user.canchaAsignada._id;
        }
        
        // Convertir mes de nombre a número (1-12)
        const meses = {
            'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
            'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
        };
        
        const mesNormalizado = mes.toLowerCase();
        const mesNumero = meses[mesNormalizado];
        
        if (!mesNumero) {
            return res.status(400).json({ message: 'Mes inválido' });
        }
        
        // Crear consulta para el rango de fechas
        const anioNum = parseInt(anio);
        
        // Convertir mes a formato de 2 dígitos (01, 02, etc.)
        const mesPadded = mesNumero.toString().padStart(2, '0');
        
        // Encontrar todos los partidos de esa cancha en ese mes y año
        const partidos = await Game.find({ 
            canchaId, 
            date: {
                $regex: new RegExp(`${anioNum}-${mesPadded}|${mesPadded}/${anioNum}|${mesPadded}/${String(anioNum).slice(2)}|${anioNum}/${mesPadded}`)
            }
        })
        .populate('arbitro', 'nombre email')
        .sort({ date: 1, time: 1 });
        
        // Obtener la información de la cancha
        const Cancha = require('../models/Cancha');
        const cancha = await Cancha.findById(canchaId);
        if (!cancha) {
            return res.status(404).json({ message: 'Cancha no encontrada' });
        }
        
        // Crear el PDF
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4'
        });
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-partidos-${cancha.nombre.replace(/\s+/g, '-')}-${mesNormalizado}-${anioNum}.pdf`);
        
        // Pipe the PDF document to the response
        doc.pipe(res);
        
        // Agregar encabezado
        doc.fontSize(22).font('Helvetica-Bold').text(`RefZone - Reporte de Partidos`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).font('Helvetica').text(`${cancha.nombre}`, { align: 'center' });
        doc.fontSize(14).font('Helvetica').text(`${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${anioNum}`, { align: 'center' });
        doc.moveDown(1);
        
        // Agregar información de la cancha
        doc.fontSize(12).font('Helvetica-Bold').text('Información de la cancha:');
        doc.fontSize(10).font('Helvetica').text(`Dirección: ${cancha.direccion || 'No disponible'}`);
        doc.fontSize(10).font('Helvetica').text(`Contacto: ${cancha.telefono || 'No disponible'}`);
        doc.fontSize(10).font('Helvetica').text(`Email: ${cancha.email || 'No disponible'}`);
        doc.moveDown(1);
        
        // Agregar resumen
        doc.fontSize(12).font('Helvetica-Bold').text('Resumen del período:');
        doc.fontSize(10).font('Helvetica').text(`Total de partidos: ${partidos.length}`);
        
        const partidosConArbitro = partidos.filter(p => p.arbitro);
        doc.fontSize(10).font('Helvetica').text(`Partidos con árbitro asignado: ${partidosConArbitro.length}`);
        doc.fontSize(10).font('Helvetica').text(`Partidos sin árbitro: ${partidos.length - partidosConArbitro.length}`);
        doc.moveDown(1.5);
        
        // Agregar tabla de partidos
        if (partidos.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').text('Lista de partidos:');
            doc.moveDown(0.5);
            
            // Crear encabezados de tabla
            const tableTop = doc.y;
            const tableLeft = 50;
            const colWidths = [80, 140, 100, 160];
            const rowHeight = 20;
            
            // Dibujar encabezados
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Fecha', tableLeft, tableTop);
            doc.text('Nombre', tableLeft + colWidths[0], tableTop);
            doc.text('Hora', tableLeft + colWidths[0] + colWidths[1], tableTop);
            doc.text('Árbitro', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
            
            // Dibujar línea separadora
            doc.moveTo(tableLeft, tableTop + 15)
               .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop + 15)
               .stroke();
            
            // Función para formatear fecha
            function formatearFecha(fechaStr) {
                // Maneja diferentes formatos de fecha
                let fecha;
                if (fechaStr.includes('-')) {
                    // Formato YYYY-MM-DD
                    fecha = new Date(fechaStr);
                } else {
                    // Intenta otros formatos
                    const partes = fechaStr.split('/');
                    if (partes.length === 3) {
                        // Asume MM/DD/YYYY o DD/MM/YYYY
                        if (parseInt(partes[0]) > 12) {
                            // DD/MM/YYYY
                            fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
                        } else {
                            // MM/DD/YYYY
                            fecha = new Date(`${partes[2]}-${partes[0]}-${partes[1]}`);
                        }
                    } else {
                        // Devuelve la fecha original si no puede parsearla
                        return fechaStr;
                    }
                }
                
                if (isNaN(fecha.getTime())) return fechaStr;
                
                return format(fecha, 'dd/MM/yyyy', { locale: es });
            }
            
            // Dibujar filas de datos
            doc.font('Helvetica');
            let y = tableTop + 25;
            
            for (const partido of partidos) {
                // Verificar si necesitamos una nueva página
                if (y + rowHeight > doc.page.height - 50) {
                    doc.addPage();
                    y = 50; // Reiniciar Y en la nueva página
                    
                    // Volver a dibujar encabezados en la nueva página
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
                
                const fechaFormateada = formatearFecha(partido.date);
                doc.text(fechaFormateada, tableLeft, y);
                doc.text(partido.name, tableLeft + colWidths[0], y);
                doc.text(partido.time, tableLeft + colWidths[0] + colWidths[1], y);
                
                const arbitroNombre = partido.arbitro ? 
                    (partido.arbitro.nombre || partido.arbitro.email) : 
                    'Sin asignar';
                doc.text(arbitroNombre, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
                
                y += rowHeight;
            }
        } else {
            doc.fontSize(12).font('Helvetica-Oblique').text('No hay partidos registrados para este período.');
        }
        
        // Agregar pie de página
        doc.moveDown(2);
        const fechaGeneracion = new Date();
        doc.fontSize(8).font('Helvetica-Oblique').text(
            `Reporte generado el ${format(fechaGeneracion, 'dd/MM/yyyy HH:mm:ss', { locale: es })}`, 
            { align: 'center' }
        );
        
        // Finalizar el documento
        doc.end();
        
    } catch (error) {
        console.error('Error al generar el reporte PDF:', error);
        res.status(500).json({ message: 'Error al generar el reporte PDF', error: error.message });
    }
});

module.exports = router;
