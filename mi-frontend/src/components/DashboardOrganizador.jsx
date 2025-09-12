import React, { useEffect, useMemo, useState } from "react";

const initialGame = { name: "", date: "", time: "", location: "" };

export default function DashboardOrganizador() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Agregar Partido");
  const [currentGame, setCurrentGame] = useState(initialGame);
  const [editingId, setEditingId] = useState(null);

  const [postuladosModal, setPostuladosModal] = useState({ open: false, postulados: [], gameId: null });
  const [reporteModal, setReporteModal] = useState({ open: false, mes: new Date().getMonth() + 1, ano: new Date().getFullYear(), cargando: false });

  const [stats, setStats] = useState({ total: 0, upcoming: 0, needsReferee: 0 });
  const [user, setUser] = useState(null);

  // Verificar sesión
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No hay token disponible");
          window.location.href = "/";
          return;
        }

        // Primero intenta verificar la sesión
        try {
          const res = await fetch("/api/usuarios/check-session", {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          
          if (res.ok) {
            const data = await res.json();
            
            if (data?.userId) {
              // Si tiene role organizador o no tiene role, permitir acceso
              if (data.role === 'organizador') {
                setUser(data);
                
                // Cargar información de la cancha asignada
                loadCanchaAsignada();
                return; // Salir si todo está bien
              } else {
                console.log("Usuario no es organizador, redirigiendo...");
                if (data.role === 'arbitro') {
                  window.location.href = "/dashboard";
                  return;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error en verificación inicial:", error);
          // Continuar con perfil local si hay error de conexión
        }
        
        // Si llegamos aquí, algo falló en la verificación, pero seguiremos con datos locales
        const userEmail = localStorage.getItem("userEmail");
        const userId = localStorage.getItem("userId");
        
        if (userId) {
          console.log("Usando datos de usuario almacenados localmente");
          setUser({
            userId: userId,
            nombre: "Organizador", // Default
            email: userEmail || "",
            role: "organizador"
          });
          
          // Intentar cargar la cancha asignada de todos modos
          loadCanchaAsignada();
        } else {
          // Si no hay datos ni en servidor ni local, redirigir a login
          console.error("No se pudo obtener información del usuario");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error);
        // No redirigimos automáticamente para evitar ciclos de redirección
      }
    })();
  }, []);
  
  // Función para cargar la cancha asignada al organizador
  async function loadCanchaAsignada() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        const res = await fetch("/api/canchas/user/assigned", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.hasCancha) {
            setUser(prev => ({ 
              ...prev, 
              canchaAsignada: data.cancha 
            }));
          }
        } else {
          console.log("No se pudo cargar la cancha, pero continuamos:", await res.text());
        }
      } catch (fetchError) {
        console.error("Error de red al cargar cancha:", fetchError);
        // Intentar con la ruta sin /api/ como fallback
        try {
          const resFallback = await fetch("/canchas/user/assigned", {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          
          if (resFallback.ok) {
            const data = await resFallback.json();
            if (data.hasCancha) {
              setUser(prev => ({ ...prev, canchaAsignada: data.cancha }));
            }
          }
        } catch (fallbackError) {
          console.error("Error también en fallback de cancha:", fallbackError);
        }
      }
    } catch (error) {
      console.error("Error general al cargar cancha asignada:", error);
      // No hacemos nada crítico, continuamos con la UI
    }
  }

  // Cargar datos
  useEffect(() => {
    loadGames();
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch("/api/games/stats", { 
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include" 
      });
      const data = await res.json();
      setStats({
        total: Number(data?.total) || 0,
        upcoming: Number(data?.upcoming) || 0,
        needsReferee: Number(data?.needsReferee) || 0,
      });
    } catch {
      setStats({ total: 0, upcoming: 0, needsReferee: 0 });
    }
  }

  async function loadGames() {
    setLoading(true);
    setError("");
    try {
      console.log("Cargando partidos para el organizador desde /api/games");
      const res = await fetch("/api/games", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Error al cargar partidos: ${res.status} ${await res.text()}`);
      }
      
      const data = await res.json();
      console.log("Partidos obtenidos para el organizador:", data);
      
      // No necesitamos agregar valores predeterminados ya que los organizadores siempre tendrán su cancha asignada
      setGames(Array.isArray(data) ? data : []);
    } catch (error) { 
      console.error("Error al cargar los partidos:", error);
      setError(`Error al cargar los partidos: ${error.message}`);
      
      // Intentar con la ruta sin /api/ como fallback
      try {
        console.log("Intentando fallback: /games");
        const fallbackRes = await fetch("/games", {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          },
          credentials: "include",
        });
        
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          console.log("Partidos obtenidos desde fallback:", fallbackData);
          
          // No necesitamos agregar valores predeterminados ya que los organizadores siempre tendrán su cancha asignada
          setGames(Array.isArray(fallbackData) ? fallbackData : []);
          setError(""); // Limpiar error si el fallback fue exitoso
        }
      } catch (fallbackError) {
        console.error("También falló el fallback:", fallbackError);
        setGames([]);
      }
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setCurrentGame(initialGame);
    setEditingId(null);
    setModalTitle("Agregar Partido");
    setModalOpen(true);
  }

  function openEditModal(game) {
    setCurrentGame({
      name: game?.name || "",
      date: game?.date ? String(game.date).split("T")[0] : "",
      time: game?.time || "",
      location: game?.location || "",
    });
    setEditingId(game?._id || null);
    setModalTitle("Editar Partido");
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/games/${editingId}` : "/api/games";
      
      // Crear una copia del objeto currentGame para modificarlo
      const gameToSave = { ...currentGame };
      
      // Agregar la cancha asignada al usuario si estamos creando un nuevo partido
      if (!editingId && user?.canchaAsignada?._id) {
        gameToSave.canchaId = user.canchaAsignada._id;
        console.log("Añadiendo cancha al partido:", user.canchaAsignada.nombre);
      }
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include",
        body: JSON.stringify(gameToSave),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Error al guardar el partido");
      setModalOpen(false);
      setEditingId(null);
      setCurrentGame(initialGame);
      
      // Recargar partidos y estadísticas
      await loadGames();
      await loadStats();
    } catch (err) {
      alert(err.message || "Error al conectar con el servidor");
    }
  }

  async function handleDelete(gameId) {
    if (!window.confirm("¿Eliminar este partido?")) return;
    try {
      const res = await fetch(`/api/games/${gameId}`, { 
        method: "DELETE", 
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Error al eliminar el partido");
      
      // Recargar partidos y estadísticas
      await loadGames();
      await loadStats();
    } catch (err) {
      alert(err.message || "Error al conectar con el servidor");
    }
  }

  async function openPostulados(gameId) {
    try {
      const res = await fetch(`/api/games/${gameId}/postulados`, { 
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include" 
      });
      const data = await res.json();
      setPostuladosModal({ open: true, postulados: data?.postulados || [], gameId });
    } catch {
      alert("Error al cargar postulados");
    }
  }

  async function assignArbitro(gameId, arbitroId) {
    try {
      const res = await fetch(`/api/games/${gameId}/assign`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include",
        body: JSON.stringify({ arbitroId }),
      });
      if (!res.ok) throw new Error("Error al asignar árbitro");
      setPostuladosModal({ open: false, postulados: [], gameId: null });
      await loadGames();
    } catch (err) {
      alert(err.message || "Error al conectar con el servidor");
    }
  }

  function formatDate(input) {
    if (!input) return "";
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
      const [y, m, d] = input.split("T")[0].split("-");
      return `${d}/${m}/${y}`;
    }
    const d = new Date(input);
    return isNaN(d) ? "" : d.toLocaleDateString("es-MX");
  }

  function formatTime(time) {
    if (!time) return "";
    const [hStr, m] = String(time).split(":");
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  function logout() {
    // Intentamos hacer logout en el servidor, pero no bloqueamos si falla
    try {
      fetch("/api/usuarios/logout", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include" 
      }).catch(error => {
        console.log("Error en logout (no crítico):", error);
      });
    } catch (error) {
      console.error("Error al intentar logout:", error);
    } finally {
      // Siempre limpiamos localStorage y redirigimos
      console.log("Cerrando sesión y limpiando datos locales");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("nombre");
      // Redirigir a la página de login
      window.location.href = "/";
    }
  }

  async function descargarReportePDF(mes = null, ano = null) {
    try {
      // Mostrar indicador de carga
      setReporteModal(prevState => ({ ...prevState, cargando: true }));
      
      // Si no se proporcionan mes/año, usar los del modal o fecha actual
      const mesNumero = mes || reporteModal.mes;
      const anoReporte = ano || reporteModal.ano;
      
      // Convertir número del mes a nombre del mes en español
      const mesesNombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const mesNombre = mesesNombres[mesNumero - 1]; // Restamos 1 porque el arreglo empieza en 0
      
      console.log(`Generando reporte para ${mesNombre} de ${anoReporte}`);
      
      // Variable para almacenar los partidos filtrados
      let partidosFiltrados = [];
      let reporteDesdeAPI = false;
      
      // Intentar obtener datos del servidor primero (incluye historial)
      try {
        const token = localStorage.getItem("token");
        const url = `/api/reportes/reporte-datos?mes=${mesNombre}&anio=${anoReporte}`;
        
        console.log('Intentando obtener datos del reporte desde la API:', url);
        const res = await fetch(url, {
          headers: { 
            "Authorization": `Bearer ${token}`
          },
          credentials: "include"
        });
        
        if (res.ok) {
          const dataAPI = await res.json();
          console.log('Datos del reporte obtenidos desde la API:', dataAPI);
          
          // Si obtenemos datos desde la API, ya contienen tanto partidos activos como históricos
          if (dataAPI && Array.isArray(dataAPI.partidos)) {
            partidosFiltrados = dataAPI.partidos;
            reporteDesdeAPI = true;
            console.log(`${partidosFiltrados.length} partidos obtenidos desde la API`);
          }
        } else {
          console.log('No se pudieron obtener datos desde la API, error:', await res.text());
        }
      } catch (apiError) {
        console.error('Error al obtener datos de la API:', apiError);
      }
      
      // Si no pudimos obtener datos de la API, filtrar los partidos localmente
      if (!reporteDesdeAPI) {
        console.log('Usando datos locales para generar el reporte...');
        
        // Filtrar partidos por mes y año
        partidosFiltrados = games.filter(partido => {
          try {
            if (typeof partido.date === 'string') {
              // Intentar extraer el mes y año de la fecha
              if (partido.date.includes('-')) {
                // Formato YYYY-MM-DD
                const [anio, mes] = partido.date.split('-');
                return parseInt(anio) === anoReporte && parseInt(mes) === mesNumero;
              } else if (partido.date.includes('/')) {
                // Formato DD/MM/YYYY o MM/DD/YYYY
                const partes = partido.date.split('/');
                if (partes.length === 3) {
                  // Asumimos DD/MM/YYYY 
                  if (parseInt(partes[0]) > 12) {
                    return parseInt(partes[2]) === anoReporte && parseInt(partes[1]) === mesNumero;
                  } else {
                    // Formato MM/DD/YYYY
                    return parseInt(partes[2]) === anoReporte && parseInt(partes[0]) === mesNumero;
                  }
                }
              }
            }
            // Si no podemos determinar la fecha, no incluimos el partido
            return false;
          } catch (e) {
            console.error('Error al filtrar partido:', e);
            return false; // No incluir el partido si hay error
          }
        });
      }
      
      console.log(`Partidos filtrados para el reporte: ${partidosFiltrados.length}`);
      
      // Obtener información de la cancha desde user.canchaAsignada
      if (!user?.canchaAsignada) {
        alert('No tienes una cancha asignada. No se puede generar el reporte.');
        setReporteModal(prevState => ({ ...prevState, cargando: false }));
        return;
      }
      
      // Crear objeto reporteData manualmente
      const reporteData = {
        cancha: {
          nombre: user.canchaAsignada.nombre || 'Cancha sin nombre',
          direccion: user.canchaAsignada.direccion || 'Dirección no disponible',
          telefono: user.canchaAsignada.telefono || 'Teléfono no disponible',
          email: user.canchaAsignada.email || 'Email no disponible'
        },
        periodo: {
          mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
          anio: anoReporte
        },
        partidos: partidosFiltrados.map(p => {
          // Determinar el estado del partido de manera simplificada
          let estado = 'Programado';
          if (p.estado) {
            estado = p.estado; // Usar el estado ya calculado si está disponible
          }
          
          return {
            id: p._id,
            nombre: p.name,
            fecha: p.date,
            hora: p.time,
            ubicacion: p.location || user.canchaAsignada.direccion || 'Sin ubicación',
            arbitro: p.arbitro ? (p.arbitro.nombre || p.arbitro.email || 'Sin nombre') : 'Sin asignar',
            tieneArbitro: !!p.arbitro,
            estado: estado
          };
        }),
        fechaInicio: `1/${mesNumero}/${anoReporte}`,
        fechaFin: `${new Date(anoReporte, mesNumero, 0).getDate()}/${mesNumero}/${anoReporte}`,
        nombreCancha: user.canchaAsignada.nombre || 'Todas',
        estadisticas: {
          total: partidosFiltrados.length,
          conArbitro: partidosFiltrados.filter(p => p.arbitro).length,
          sinArbitro: partidosFiltrados.filter(p => !p.arbitro).length,
          programados: partidosFiltrados.filter(p => !p.estado || p.estado === 'Programado').length,
          enCurso: partidosFiltrados.filter(p => p.estado === 'En curso').length,
          finalizados: partidosFiltrados.filter(p => p.estado === 'Finalizado').length,
          cancelados: partidosFiltrados.filter(p => p.estado === 'Cancelado').length
        },
        fechaGeneracion: new Date()
      };
      
      console.log('Datos del reporte preparados:', reporteData);
      
      // Verificar que jsPDF esté disponible (ya configurado en index.html como window.jsPDF)
      if (!window.jsPDF) {
        console.error('Error: jsPDF no está disponible. Asegúrate de que index.html incluye el script de jsPDF.');
        alert('Error: No se encontró la biblioteca para generar PDFs.');
        setReporteModal(prevState => ({ ...prevState, cargando: false }));
        return;
      }
      
      // Crear un nuevo documento PDF (formato A4 vertical)
      const doc = new window.jsPDF();
      
      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // CABECERA DEL DOCUMENTO
      // Fondo de color para el encabezado
      doc.setFillColor(26, 93, 26); // Verde oscuro
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Título del reporte
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // Texto blanco
      doc.setFontSize(22);
      doc.text('RefZone - Reporte de Partidos', pageWidth / 2, 16, { align: 'center' });
      
      // Nombre de la cancha
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 93, 26); // Verde oscuro
      doc.setFontSize(18);
      doc.text(reporteData.cancha.nombre, pageWidth / 2, margin + 20, { align: 'center' });
      
      // Periodo del reporte
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51); // Gris oscuro
      doc.setFontSize(12);
      doc.text(`${reporteData.periodo.mes} de ${reporteData.periodo.anio}`, pageWidth / 2, margin + 30, { align: 'center' });
      
      // Línea separadora
      doc.setDrawColor(26, 93, 26); // Verde oscuro
      doc.setLineWidth(0.5);
      doc.line(margin, margin + 35, pageWidth - margin, margin + 35);
      
      // INFORMACIÓN DE LA CANCHA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51); // Gris oscuro
      doc.text('Información de la cancha:', margin, margin + 45);
      
      // Cuadro para la información
      doc.setFillColor(249, 249, 249); // Gris muy claro
      doc.setDrawColor(204, 204, 204); // Gris claro
      doc.roundedRect(margin, margin + 50, pageWidth - (margin * 2), 35, 3, 3, 'FD');
      
      // Detalles de la cancha
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51); // Gris oscuro
      doc.text(`Dirección: ${reporteData.cancha.direccion}`, margin + 5, margin + 60);
      doc.text(`Contacto: ${reporteData.cancha.telefono}`, margin + 5, margin + 70);
      doc.text(`Email: ${reporteData.cancha.email}`, margin + 5, margin + 80);
      
      // ESTADÍSTICAS DEL REPORTE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Resumen del período:', margin, margin + 100);
      
      // Estadísticas básicas
      const yStats = margin + 110;
      
      // Total de partidos
      doc.setFillColor(26, 93, 26); // Verde oscuro
      doc.roundedRect(margin, yStats, 40, 25, 3, 3, 'F');
      doc.setTextColor(255, 255, 255); // Blanco
      doc.setFontSize(9);
      doc.text('Total partidos', margin + 20, yStats + 10, { align: 'center' });
      doc.setFontSize(16);
      doc.text(reporteData.estadisticas.total.toString(), margin + 20, yStats + 20, { align: 'center' });
      
      // Con árbitro
      doc.setFillColor(76, 175, 80); // Verde
      doc.roundedRect(margin + 50, yStats, 40, 25, 3, 3, 'F');
      doc.setTextColor(255, 255, 255); // Blanco
      doc.setFontSize(9);
      doc.text('Con árbitro', margin + 70, yStats + 10, { align: 'center' });
      doc.setFontSize(16);
      doc.text(reporteData.estadisticas.conArbitro.toString(), margin + 70, yStats + 20, { align: 'center' });
      
      // Sin árbitro
      doc.setFillColor(255, 152, 0); // Naranja
      doc.roundedRect(margin + 100, yStats, 40, 25, 3, 3, 'F');
      doc.setTextColor(255, 255, 255); // Blanco
      doc.setFontSize(9);
      doc.text('Sin árbitro', margin + 120, yStats + 10, { align: 'center' });
      doc.setFontSize(16);
      doc.text(reporteData.estadisticas.sinArbitro.toString(), margin + 120, yStats + 20, { align: 'center' });
      
      // Finalizados
      doc.setFillColor(33, 150, 243); // Azul
      doc.roundedRect(margin + 150, yStats, 40, 25, 3, 3, 'F');
      doc.setTextColor(255, 255, 255); // Blanco
      doc.setFontSize(9);
      doc.text('Finalizados', margin + 170, yStats + 10, { align: 'center' });
      doc.setFontSize(16);
      doc.text(reporteData.estadisticas.finalizados.toString(), margin + 170, yStats + 20, { align: 'center' });
      
      // TABLA DE PARTIDOS
      if (reporteData.partidos && reporteData.partidos.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51); // Gris oscuro
        doc.text('Lista de partidos:', margin, margin + 150);
        
        // Tabla con diseño simplificado
        const tableTop = margin + 160;
        let y = tableTop;
        
        // Encabezados
        doc.setFillColor(26, 93, 26); // Verde oscuro
        doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255); // Blanco
        
        // Columnas de la tabla
        const col1 = margin + 3;        // Fecha
        const col2 = margin + 30;       // Nombre
        const col3 = margin + 85;       // Hora
        const col4 = margin + 110;      // Ubicación
        const col5 = margin + 150;      // Árbitro
        
        doc.text('Fecha', col1, y + 6);
        doc.text('Nombre', col2, y + 6);
        doc.text('Hora', col3, y + 6);
        doc.text('Ubicación', col4, y + 6);
        doc.text('Árbitro', col5, y + 6);
        
        y += 10; // Avanzar a la primera fila de datos
        
        // Función para formatear fecha
        function formatDate(dateStr) {
          if (!dateStr) return 'N/A';
          
          try {
            if (dateStr.includes('-')) {
              const [año, mes, dia] = dateStr.split('-');
              return `${dia.split('T')[0]}/${mes}/${año}`;
            } else if (dateStr.includes('/')) {
              return dateStr;
            }
            return dateStr;
          } catch {
            return dateStr;
          }
        }
        
        // Altura de fila
        const rowHeight = 8;
        
        // Dibujar filas de datos
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 51, 51); // Gris oscuro
        
        for (const partido of reporteData.partidos) {
          // Nueva página si no hay espacio
          if (y > pageHeight - margin - 20) {
            doc.addPage();
            y = margin + 20;
            
            // Repetir encabezados en la nueva página
            doc.setFillColor(26, 93, 26); // Verde oscuro
            doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255); // Blanco
            
            doc.text('Fecha', col1, y + 6);
            doc.text('Nombre', col2, y + 6);
            doc.text('Hora', col3, y + 6);
            doc.text('Ubicación', col4, y + 6);
            doc.text('Árbitro', col5, y + 6);
            
            y += 10;
          }
          
          // Alternar colores de fondo para las filas
          const isEven = reporteData.partidos.indexOf(partido) % 2 === 0;
          doc.setFillColor(isEven ? 249 : 255, isEven ? 249 : 255, isEven ? 249 : 255);
          doc.rect(margin, y, pageWidth - margin * 2, rowHeight, 'F');
          
          // Datos del partido
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 51, 51); // Gris oscuro
          
          doc.text(formatDate(partido.fecha), col1, y + 5);
          doc.text(partido.nombre || 'Sin nombre', col2, y + 5);
          doc.text(partido.hora || 'N/A', col3, y + 5);
          doc.text(partido.ubicacion || 'N/A', col4, y + 5);
          doc.text(partido.arbitro || 'Sin asignar', col5, y + 5);
          
          y += rowHeight;
        }
      } else {
        // Mensaje si no hay partidos
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(102, 102, 102); // Gris medio
        doc.setFontSize(11);
        doc.text('No hay partidos registrados para este período.', margin, margin + 150);
      }
      
      // PIE DE PÁGINA
      // Línea separadora
      doc.setDrawColor(26, 93, 26); // Verde oscuro
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Texto del pie
      const fechaStr = new Date().toLocaleDateString();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102); // Gris medio
      doc.text(`Reporte generado el ${fechaStr}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 93, 26); // Verde oscuro
      doc.text('RefZone - Sistema de Gestión Deportiva', pageWidth / 2, pageHeight - 7, { align: 'center' });
      
      // Guardar el PDF
      const nombreArchivo = `reporte-partidos-${reporteData.cancha.nombre.replace(/\s+/g, '-')}-${mesNombre}-${anoReporte}.pdf`;
      doc.save(nombreArchivo);
      
      // Cerrar modal
      setReporteModal(prevState => ({ ...prevState, open: false, cargando: false }));
      console.log('Reporte PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar reporte:', error);
      alert(`Error al generar el reporte: ${error.message || 'Error desconocido'}. Inténtalo de nuevo.`);
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

            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800">{user?.name || "Administrador"}</p>
                  <p className="text-xs text-gray-600">Organizador Principal</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="btn btn-ghost btn-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
                </svg>
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">Gestión de Partidos</h2>
              <p className="text-gray-600">Administra los partidos de fútbol 7 y asigna árbitros</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-3">
                <button 
                  onClick={() => setReporteModal({ ...reporteModal, open: true })}
                  className="btn btn-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Historial de Partidos
                </button>
                <button 
                  onClick={openAddModal}
                  className="btn btn-primary"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  Agregar Partido
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Partidos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximos Partidos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Sin Árbitro</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.needsReferee}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Games Table */}
        {!loading && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-display font-semibold text-gray-800">Lista de Partidos</h3>
              <p className="text-sm text-gray-600 mt-1">
                {hasGames ? `${games.length} partidos registrados` : 'No hay partidos registrados'}
              </p>
            </div>
            <div className="card-body p-0">
              {!hasGames ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">No hay partidos registrados</h4>
                  <p className="text-gray-600 mb-4">Comienza agregando tu primer partido de fútbol 7</p>
                  <button 
                    onClick={openAddModal}
                    className="btn btn-primary"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                    Agregar Primer Partido
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha y Hora</th>
                        <th>Nombre del Partido</th>
                        <th>Ubicación</th>
                        <th>Cancha</th>
                        <th>Árbitro Asignado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGames.map((game) => (
                        <tr key={game._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{formatDate(game.date)}</span>
                              <span className="badge badge-primary text-xs">{formatTime(game.time)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                              </div>
                              <span className="font-medium text-gray-900">{game.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-gray-700">{game.location}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8c0 .817-.665 1.5-1.5 1.5a.5.5 0 00-.5.5v2a.5.5 0 00.5.5h2a.5.5 0 00.5-.5V12a.5.5 0 00-.5-.5 1.5 1.5 0 01-1.5-1.5V9c0-.817.665-1.5 1.5-1.5h1c.828 0 1.5-.672 1.5-1.5S11.328 4.5 10.5 4.5H10c-.828 0-1.5.672-1.5 1.5v1a.5.5 0 01-.5.5 2.5 2.5 0 00-2.5 2.5c0 .664.193 1.321.57 1.881.74 1.096 1.934 1.759 3.43 1.759 1.6 0 3-1.9 3-3.5" clipRule="evenodd"/>
                              </svg>
                              <span className="text-blue-700">
                                {game.canchaId && game.canchaId.nombre ? game.canchaId.nombre : "No disponible"}
                              </span>
                            </div>
                          </td>
                          <td>
                            {game.arbitro ? (
                              <span className="badge badge-success">
                                {game.arbitro.nombre || game.arbitro.email}
                              </span>
                            ) : (
                              <span className="badge badge-warning">Sin asignar</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <button 
                                className="btn btn-sm btn-outline" 
                                onClick={() => openEditModal(game)}
                              >
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                </svg>
                                Editar
                              </button>
                              
                              <button 
                                className="btn btn-sm btn-danger" 
                                onClick={() => handleDelete(game._id)}
                              >
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd"/>
                                </svg>
                                Eliminar
                              </button>
                              
                              {!game.arbitro && (
                                <button 
                                  className="btn btn-sm btn-secondary" 
                                  onClick={() => openPostulados(game._id)}
                                >
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12a1 1 0 000 2h2a1 1 0 100-2H9zm-4-7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1H5zm0 2v8h10V7H5z"/>
                                  </svg>
                                  Ver Postulados
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal agregar/editar */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-display font-semibold text-gray-800">{modalTitle}</h3>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setModalOpen(false)}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Nombre del Partido</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    placeholder="Ej: Liga Regional - Fecha 5"
                    value={currentGame.name}
                    onChange={(e) => setCurrentGame({ ...currentGame, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="date" className="form-label">Fecha</label>
                    <input
                      type="date"
                      id="date"
                      className="form-input"
                      value={currentGame.date}
                      onChange={(e) => setCurrentGame({ ...currentGame, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="time" className="form-label">Hora</label>
                    <input
                      type="time"
                      id="time"
                      className="form-input"
                      value={currentGame.time}
                      onChange={(e) => setCurrentGame({ ...currentGame, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location" className="form-label">Ubicación</label>
                  <input
                    type="text"
                    id="location"
                    className="form-input"
                    placeholder="Ej: Cancha Municipal, Col. Centro"
                    value={currentGame.location}
                    onChange={(e) => setCurrentGame({ ...currentGame, location: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    className="btn btn-ghost" 
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingId ? "Guardar Cambios" : "Agregar Partido"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal postulados */}
      {postuladosModal.open && (
        <div className="modal-overlay" onClick={() => setPostuladosModal({ open: false, postulados: [], gameId: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-display font-semibold text-gray-800">Árbitros Postulados</h3>
            </div>
            <div className="modal-body">
              {postuladosModal.postulados.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-gray-600">No hay postulados para este partido.</p>
                  <p className="text-sm text-gray-500 mt-2">Los árbitros aparecerán aquí cuando se postulen</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {postuladosModal.postulados.map((arbitro) => (
                    <div key={arbitro._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                          {arbitro.imagenPerfil ? (
                            <img 
                              src={arbitro.imagenPerfil} 
                              alt={arbitro.nombre} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{arbitro.nombre || arbitro.email}</p>
                          <p className="text-sm text-gray-600">Árbitro Certificado</p>
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => assignArbitro(postuladosModal.gameId, arbitro._id)}
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Asignar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-ghost" 
                onClick={() => setPostuladosModal({ open: false, postulados: [], gameId: null })}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal selección de reporte */}
      {reporteModal.open && (
        <div className="modal-overlay" onClick={() => !reporteModal.cargando && setReporteModal({ ...reporteModal, open: false })}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-display font-semibold text-gray-800">Generar Reporte PDF</h3>
              {!reporteModal.cargando && (
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setReporteModal({ ...reporteModal, open: false })}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="modal-body">
              {reporteModal.cargando ? (
                <div className="text-center py-8 space-y-4">
                  <div className="flex justify-center">
                    <svg className="w-12 h-12 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="font-medium text-gray-800">Generando reporte PDF...</p>
                  <p className="text-sm text-gray-600">El reporte se descargará automáticamente cuando esté listo.</p>
                  <p className="text-xs text-gray-500">Por favor espere, esto puede tomar unos momentos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Selecciona el periodo para generar el reporte de partidos de tu cancha.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Mes</label>
                      <select 
                        className="form-input"
                        value={reporteModal.mes}
                        onChange={(e) => setReporteModal({ ...reporteModal, mes: parseInt(e.target.value) })}
                      >
                        <option value={1}>Enero</option>
                        <option value={2}>Febrero</option>
                        <option value={3}>Marzo</option>
                        <option value={4}>Abril</option>
                        <option value={5}>Mayo</option>
                        <option value={6}>Junio</option>
                        <option value={7}>Julio</option>
                        <option value={8}>Agosto</option>
                        <option value={9}>Septiembre</option>
                        <option value={10}>Octubre</option>
                        <option value={11}>Noviembre</option>
                        <option value={12}>Diciembre</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Año</label>
                      <select 
                        className="form-input"
                        value={reporteModal.ano}
                        onChange={(e) => setReporteModal({ ...reporteModal, ano: parseInt(e.target.value) })}
                      >
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - 2 + i;
                          return (
                            <option key={year} value={year}>{year}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                      </svg>
                      <div>
                        <h4 className="font-medium text-blue-900">¿Qué incluye el reporte?</h4>
                        <ul className="text-sm text-blue-800 mt-1 space-y-1">
                          <li>• Partidos activos y próximos</li>
                          <li>• Historial de partidos del periodo</li>
                          <li>• Estadísticas de completados/cancelados</li>
                          <li>• Información de árbitros asignados</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <div className="flex justify-end space-x-3">
                {!reporteModal.cargando && (
                  <>
                    <button 
                      className="btn btn-ghost" 
                      onClick={() => setReporteModal({ ...reporteModal, open: false })}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => descargarReportePDF()}
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Generar PDF
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

