import React, { useState, useEffect, useContext, useMemo } from 'react';
import AuthContext from '../app/AuthContext';
import '../styles/dashboardOrganizador.css';

export default function DashboardOrganizador() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameForm, setGameForm] = useState({ 
    name: '', 
    date: '', 
    time: '', 
    location: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [viewMode, setViewMode] = useState('tabla');
  const [statsData, setStatsData] = useState({
    total: 0,
    conArbitro: 0,
    sinArbitro: 0
  });
  
  const [reporteModal, setReporteModal] = useState({
    open: false,
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    cargando: false
  });

  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  const años = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);

  // Cargar partidos
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchGames();
  }, [isAuthenticated]);
  
  // Actualizar estadísticas cuando cambian los partidos
  useEffect(() => {
    if (games.length > 0) {
      const stats = {
        total: games.length,
        conArbitro: games.filter(game => game.arbitro).length,
        sinArbitro: games.filter(game => !game.arbitro).length
      };
      setStatsData(stats);
    }
  }, [games]);

  // Función para obtener los partidos
  async function fetchGames() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No hay token disponible");
        return;
      }
      
      const response = await fetch('/api/games/cancha', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener partidos: ${response.status}`);
      }
      
      const data = await response.json();
      setGames(data);
      console.log("Partidos cargados:", data.length);
    } catch (error) {
      console.error("Error al cargar partidos:", error);
      alert("Error al cargar los partidos. Por favor, intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }

  // Función para abrir el modal de crear/editar partido
  function handleOpenDialog(game = null) {
    if (game) {
      setEditingGame(game._id);
      setGameForm({
        name: game.name,
        date: game.date,
        time: game.time,
        location: game.location || ''
      });
    } else {
      setEditingGame(null);
      setGameForm({ 
        name: '', 
        date: '', 
        time: '', 
        location: ''
      });
    }
    setDialogOpen(true);
  }

  // Función para manejar los cambios en el formulario
  function handleInputChange(e) {
    const { name, value } = e.target;
    setGameForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

  // Función para crear o editar un partido
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validar formulario
    if (!gameForm.name || !gameForm.date || !gameForm.time) {
      alert("Por favor completa los campos requeridos");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("No tienes autorización. Por favor inicia sesión nuevamente.");
        return;
      }
      
      let url = '/api/games';
      let method = 'POST';
      
      if (editingGame) {
        url = `/api/games/${editingGame}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameForm),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error al ${editingGame ? 'actualizar' : 'crear'} el partido: ${response.status}`);
      }
      
      // Actualizar la lista de partidos
      fetchGames();
      
      // Cerrar el modal
      setDialogOpen(false);
      
    } catch (error) {
      console.error(`Error al ${editingGame ? 'actualizar' : 'crear'} partido:`, error);
      alert(`Error al ${editingGame ? 'actualizar' : 'crear'} el partido. Por favor, intenta de nuevo.`);
    }
  }

  // Función para eliminar un partido
  async function handleDeleteGame(gameId) {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este partido?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("No tienes autorización. Por favor inicia sesión nuevamente.");
        return;
      }
      
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar el partido: ${response.status}`);
      }
      
      // Actualizar la lista de partidos
      fetchGames();
      
    } catch (error) {
      console.error("Error al eliminar partido:", error);
      alert("Error al eliminar el partido. Por favor, intenta de nuevo.");
    }
  }

  // Función para formatear la fecha
  function formatDate(dateString) {
    try {
      if (typeof dateString !== 'string') return 'Fecha inválida';
      
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day?.split('T')[0] || day}/${month}/${year}`;
      } else if (dateString.includes('/')) {
        // Si ya está en formato dd/mm/yyyy
        return dateString;
      }
      
      return dateString;
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return dateString;
    }
  }

  // Función para mostrar el estado del partido (programado, en curso, finalizado)
  function getEstadoPartido(date, time) {
    try {
      const ahora = new Date();
      let fechaPartido;
      
      if (typeof date === 'string') {
        if (date.includes('-')) {
          fechaPartido = new Date(date + 'T' + (time || '00:00'));
        } else if (date.includes('/')) {
          const partes = date.split('/');
          if (partes.length === 3) {
            if (parseInt(partes[0]) > 12) {
              // Formato DD/MM/YYYY
              fechaPartido = new Date(`${partes[2]}-${partes[1]}-${partes[0]}T${time || '00:00'}`);
            } else {
              // Formato MM/DD/YYYY
              fechaPartido = new Date(`${partes[2]}-${partes[0]}-${partes[1]}T${time || '00:00'}`);
            }
          }
        }
      }
      
      if (!fechaPartido || isNaN(fechaPartido)) {
        return { text: 'Programado', color: 'bg-blue-100 text-blue-800' };
      }
      
      const diferenciaMs = ahora - fechaPartido;
      const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
      
      if (diferenciaHoras < 0) {
        return { text: 'Programado', color: 'bg-blue-100 text-blue-800' };
      } else if (diferenciaHoras >= 0 && diferenciaHoras <= 1) {
        return { text: 'En curso', color: 'bg-yellow-100 text-yellow-800' };
      } else {
        return { text: 'Finalizado', color: 'bg-green-100 text-green-800' };
      }
    } catch (error) {
      console.error('Error al determinar estado del partido:', error);
      return { text: 'Programado', color: 'bg-blue-100 text-blue-800' };
    }
  }

  async function descargarReportePDF(mes = null, ano = null) {
    try {
      // Mostrar indicador de carga
      setReporteModal(prevState => ({ ...prevState, cargando: true }));
      
      // Si no se proporcionan mes/año, usar los del modal o fecha actual
      const mesNumero = mes || reporteModal.mes;
      const anoReporte = ano || reporteModal.ano;
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert('No tienes autorización. Por favor inicia sesión nuevamente.');
        setReporteModal(prevState => ({ ...prevState, cargando: false }));
        return;
      }
      
      // Convertir número del mes a nombre del mes en español
      const mesesNombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const mesNombre = mesesNombres[mesNumero - 1]; // Restamos 1 porque el arreglo empieza en 0
      
      console.log(`Generando reporte para ${mesNombre} de ${anoReporte}`);
      
      // Intentar obtener datos del servidor
      let reporteData;
      try {
        console.log(`Intentando obtener datos del reporte desde la API: /api/reportes/reporte-datos?mes=${mesNombre}&anio=${anoReporte}`);
        const response = await fetch(`/api/reportes/reporte-datos?mes=${mesNombre}&anio=${anoReporte}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos del reporte: ${response.status}`);
        }
        
        reporteData = await response.json();
        console.log('Datos del reporte obtenidos desde la API:', reporteData);
        console.log(`${reporteData.partidos.length} partidos obtenidos desde la API`);
        
      } catch (apiError) {
        console.error('Error al obtener datos del servidor:', apiError);
        alert('No se pudo conectar con el servidor para obtener los datos del reporte. Usando datos locales.');
        
        // Usar datos locales si falla la API
        reporteData = {
          cancha: {
            nombre: user.canchaAsignada?.nombre || 'Cancha sin nombre',
            direccion: user.canchaAsignada?.direccion || 'Dirección no disponible',
            telefono: user.canchaAsignada?.telefono || 'Teléfono no disponible',
            email: user.canchaAsignada?.email || 'Email no disponible'
          },
          periodo: {
            mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
            anio: anoReporte
          },
          partidos: games.filter(p => {
            // Filtrar por mes y año
            try {
              if (typeof p.date === 'string') {
                if (p.date.includes('-')) {
                  const [anio, mes] = p.date.split('-');
                  return parseInt(anio) === anoReporte && parseInt(mes) === mesNumero;
                } else if (p.date.includes('/')) {
                  const partes = p.date.split('/');
                  if (partes.length === 3) {
                    if (parseInt(partes[0]) > 12) {
                      return parseInt(partes[2]) === anoReporte && parseInt(partes[1]) === mesNumero;
                    } else {
                      return parseInt(partes[2]) === anoReporte && parseInt(partes[0]) === mesNumero;
                    }
                  }
                }
              }
              return false;
            } catch (error) {
              console.log('Error al filtrar por fecha:', error);
              return false;
            }
          }).map(p => ({
            id: p._id,
            nombre: p.name,
            fecha: p.date,
            hora: p.time,
            arbitro: p.arbitro ? (p.arbitro.nombre || p.arbitro.email || 'Sin nombre') : 'Sin asignar',
            tieneArbitro: !!p.arbitro,
            ubicacion: p.location || 'No especificada',
            estado: getEstadoPartido(p.date, p.time).text
          })),
          estadisticas: {
            total: games.length,
            conArbitro: games.filter(p => p.arbitro).length,
            sinArbitro: games.filter(p => !p.arbitro).length
          },
          fechaGeneracion: new Date()
        };
        console.log('Partidos filtrados para el reporte:', reporteData.partidos.length);
      }
      
      console.log('Datos del reporte obtenidos:', reporteData);

      // Usamos la función getEstadoPartido que ya existe en el componente
      // en lugar de definir una nueva función determinarEstadoPartido

    // Verificar si jsPDF está disponible
    if (typeof window.jsPDF !== 'function') {
      alert('Error: La biblioteca jsPDF no está disponible');
      setReporteModal(prevState => ({ ...prevState, cargando: false }));
      return;
    }    try {
      // Generar el PDF - jsPDF está definido globalmente en window.jsPDF por index.html
      const pdfDoc = new window.jsPDF();        // Título
        pdfDoc.setFontSize(18);
        pdfDoc.text('RefZone - Reporte de Partidos', 105, 20, {align: 'center'});
        
        // Nombre de la cancha
        pdfDoc.setFontSize(14);
        pdfDoc.text(`Cancha: ${reporteData.cancha.nombre}`, 105, 30, {align: 'center'});
        
        // Período
        pdfDoc.setFontSize(12);
        pdfDoc.text(`Periodo: ${reporteData.periodo.mes} de ${reporteData.periodo.anio}`, 105, 40, {align: 'center'});
        
        // Información de contacto
        pdfDoc.setFontSize(10);
        pdfDoc.text(`Dirección: ${reporteData.cancha.direccion}`, 20, 55);
        pdfDoc.text(`Contacto: ${reporteData.cancha.telefono}`, 20, 62);
        pdfDoc.text(`Email: ${reporteData.cancha.email}`, 20, 69);
        
        // Línea divisoria
        pdfDoc.line(20, 75, 190, 75);
        
        // Estadísticas
        pdfDoc.setFontSize(12);
        pdfDoc.text('Resumen:', 20, 85);
        pdfDoc.setFontSize(10);
        pdfDoc.text(`Total de partidos: ${reporteData.estadisticas.total}`, 25, 95);
        pdfDoc.text(`Con árbitro: ${reporteData.estadisticas.conArbitro}`, 25, 102);
        pdfDoc.text(`Sin árbitro: ${reporteData.estadisticas.sinArbitro}`, 25, 109);
        
        // Lista de partidos
        if (reporteData.partidos.length > 0) {
          pdfDoc.text('Lista de partidos:', 20, 120);
          
          // Encabezados de tabla
          pdfDoc.setFontSize(9);
          pdfDoc.text('Fecha', 20, 130);
          pdfDoc.text('Nombre', 50, 130);
          pdfDoc.text('Hora', 100, 130);
          pdfDoc.text('Árbitro', 120, 130);
          pdfDoc.text('Estado', 170, 130);
          
          // Línea debajo de encabezados
          pdfDoc.line(20, 132, 190, 132);
          
          // Datos de partidos
          pdfDoc.setFontSize(8);
          let y = 140;
          const rowHeight = 7;
          
          for (let i = 0; i < reporteData.partidos.length; i++) {
            const partido = reporteData.partidos[i];
            
            // Verificar si necesitamos una nueva página
            if (y > 270) {
              pdfDoc.addPage();
              y = 20;
              
              // Repetir encabezados
              pdfDoc.setFontSize(9);
              pdfDoc.text('Fecha', 20, y);
              pdfDoc.text('Nombre', 50, y);
              pdfDoc.text('Hora', 100, y);
              pdfDoc.text('Árbitro', 120, y);
              pdfDoc.text('Estado', 170, y);
              
              pdfDoc.line(20, y + 2, 190, y + 2);
              y += 10;
              pdfDoc.setFontSize(8);
            }
            
            // Formatear fecha
            let fechaFormateada = partido.fecha;
            try {
              if (typeof partido.fecha === 'string') {
                if (partido.fecha.includes('-')) {
                  const [anio, mes, dia] = partido.fecha.split('-');
                  fechaFormateada = `${dia.split('T')[0]}/${mes}/${anio}`;
                }
              }
            } catch (formatError) {
              // Usar la fecha sin formatear
              console.log('Error al formatear fecha:', formatError);
            }
            
            // Imprimir datos
            pdfDoc.text(fechaFormateada, 20, y);
            pdfDoc.text(partido.nombre?.substring(0, 25) || 'Sin nombre', 50, y);
            pdfDoc.text(partido.hora || '', 100, y);
            pdfDoc.text(partido.arbitro?.substring(0, 20) || 'Sin asignar', 120, y);
            pdfDoc.text(partido.estado || 'Programado', 170, y);
            
            y += rowHeight;
          }
        } else {
          pdfDoc.setFontSize(11);
          pdfDoc.text('No hay partidos registrados para este período.', 20, 130);
        }
        
        // Pie de página
        pdfDoc.setFontSize(8);
        const fechaGeneracion = new Date();
        pdfDoc.text(
          `Generado el ${fechaGeneracion.getDate()}/${fechaGeneracion.getMonth() + 1}/${fechaGeneracion.getFullYear()} a las ${fechaGeneracion.getHours()}:${String(fechaGeneracion.getMinutes()).padStart(2, '0')}`,
          105, 
          280, 
          {align: 'center'}
        );
        
        // Guardar PDF
        pdfDoc.save(`reporte-partidos-${reporteData.cancha.nombre.replace(/\s+/g, '-')}-${mesNombre}-${anoReporte}.pdf`);
        
        // Cerrar modal
        setReporteModal(prevState => ({ ...prevState, open: false, cargando: false }));
        
      } catch (pdfError) {
        console.error('Error al generar PDF:', pdfError);
        alert(`Error al generar el PDF: ${pdfError.message}`);
        setReporteModal(prevState => ({ ...prevState, cargando: false }));
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      alert(`Error al generar el reporte: ${error.message || 'Error desconocido'}`);
      setReporteModal(prevState => ({ ...prevState, cargando: false }));
    }
  }

  const hasGames = games?.length > 0;

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [games]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="container mx-auto">
          <div className="flex items-center justify-between py-4">
            {/* Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-gray-800">RefZone Admin</h1>
                  <p className="text-sm text-gray-600">
                    {user?.canchaAsignada ? (
                      <span className="text-green-600 font-medium">{user.canchaAsignada.nombre}</span>
                    ) : (
                      "Panel de Organizador"
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setReporteModal(prevState => ({ ...prevState, open: true }))}
                className="btn-outline-secondary flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generar Reporte
              </button>
              <button 
                onClick={() => handleOpenDialog()}
                className="btn-primary"
              >
                Crear Partido
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card bg-white">
            <div className="stat-card-value">{statsData.total}</div>
            <div className="stat-card-title">Total Partidos</div>
            <div className="stat-card-icon bg-blue-50 text-blue-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="stat-card bg-white">
            <div className="stat-card-value">{statsData.conArbitro}</div>
            <div className="stat-card-title">Con Árbitro</div>
            <div className="stat-card-icon bg-green-50 text-green-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-card bg-white">
            <div className="stat-card-value">{statsData.sinArbitro}</div>
            <div className="stat-card-title">Sin Árbitro</div>
            <div className="stat-card-icon bg-yellow-50 text-yellow-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="stat-card bg-white">
            <div className="stat-card-value">
              {Math.round((statsData.conArbitro / (statsData.total || 1)) * 100)}%
            </div>
            <div className="stat-card-title">Asignación</div>
            <div className="stat-card-icon bg-indigo-50 text-indigo-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button 
              onClick={() => setViewMode('tabla')}
              className={`px-3 py-1 rounded-md ${viewMode === 'tabla' ? 'bg-primary text-white' : 'text-gray-600'}`}
            >
              <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('lista')}
              className={`px-3 py-1 rounded-md ${viewMode === 'lista' ? 'bg-primary text-white' : 'text-gray-600'}`}
            >
              <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('calendario')}
              className={`px-3 py-1 rounded-md ${viewMode === 'calendario' ? 'bg-primary text-white' : 'text-gray-600'}`}
            >
              <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Games List or Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
          </div>
        ) : !hasGames ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No tienes partidos registrados</h2>
            <p className="text-gray-600 mb-4">Crea tu primer partido para comenzar a gestionarlo</p>
            <button 
              onClick={() => handleOpenDialog()}
              className="btn-primary"
            >
              Crear Primer Partido
            </button>
          </div>
        ) : viewMode === 'tabla' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Árbitro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedGames.map((game) => {
                    const estado = getEstadoPartido(game.date, game.time);
                    
                    return (
                      <tr key={game._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{game.name}</div>
                          {game.location && (
                            <div className="text-xs text-gray-500">{game.location}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(game.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{game.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {game.arbitro ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <img 
                                  className="h-8 w-8 rounded-full" 
                                  src={game.arbitro.fotoPerfil || "/img-perfil/perfil1.png"} 
                                  alt="" 
                                />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {game.arbitro.nombre || game.arbitro.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estado.color}`}>
                            {estado.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleOpenDialog(game)} 
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteGame(game._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === 'lista' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedGames.map((game) => {
              const estado = getEstadoPartido(game.date, game.time);
              
              return (
                <div key={game._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{game.name}</h3>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estado.color}`}>
                      {estado.text}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-gray-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-900">{formatDate(game.date)}</p>
                        <p className="text-sm text-gray-500">{game.time}</p>
                      </div>
                    </div>
                    
                    {game.location && (
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-gray-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-900">{game.location}</p>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-gray-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        {game.arbitro ? (
                          <div className="flex items-center">
                            <img 
                              className="h-6 w-6 rounded-full mr-2" 
                              src={game.arbitro.fotoPerfil || "/img-perfil/perfil1.png"} 
                              alt="" 
                            />
                            <p className="text-sm text-gray-900">{game.arbitro.nombre || game.arbitro.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-yellow-600">Sin árbitro asignado</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleOpenDialog(game)} 
                      className="btn-text-primary text-sm"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteGame(game._id)}
                      className="btn-text-danger text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-gray-600">Vista de calendario próximamente</p>
          </div>
        )}
      </main>

      {/* Dialog - Create/Edit Game */}
      {dialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingGame ? 'Editar Partido' : 'Crear Nuevo Partido'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre*
                </label>
                <input
                  type="text"
                  name="name"
                  value={gameForm.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ej: Semifinal Liga Local"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha*
                </label>
                <input
                  type="date"
                  name="date"
                  value={gameForm.date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora*
                </label>
                <input
                  type="time"
                  name="time"
                  value={gameForm.time}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="location"
                  value={gameForm.location}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ej: Cancha Norte, Campo 2"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="btn-outline-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingGame ? 'Guardar Cambios' : 'Crear Partido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Reporte PDF */}
      {reporteModal.open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                Generar Reporte
              </h3>
            </div>
            <div className="p-5">
              <p className="text-gray-600 mb-4">
                Selecciona el período para generar el reporte de partidos
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mes
                  </label>
                  <select 
                    className="form-select"
                    value={reporteModal.mes}
                    onChange={(e) => setReporteModal(prevState => ({ ...prevState, mes: parseInt(e.target.value) }))}
                  >
                    {meses.map(mes => (
                      <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <select 
                    className="form-select"
                    value={reporteModal.ano}
                    onChange={(e) => setReporteModal(prevState => ({ ...prevState, ano: parseInt(e.target.value) }))}
                  >
                    {años.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  disabled={reporteModal.cargando}
                  onClick={() => setReporteModal(prevState => ({ ...prevState, open: false }))}
                  className="btn-outline-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => descargarReportePDF()}
                  disabled={reporteModal.cargando}
                  className="btn-primary relative"
                >
                  {reporteModal.cargando ? (
                    <>
                      <span className="opacity-0">Generar PDF</span>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <div className="spinner-sm"></div>
                      </span>
                    </>
                  ) : (
                    'Generar PDF'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
