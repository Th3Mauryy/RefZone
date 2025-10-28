import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import logger from "../utils/logger";

const initialGame = { name: "", date: "", time: "", location: "", ubicacionId: "" };

export default function DashboardOrganizador() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Agregar Partido");
  const [currentGame, setCurrentGame] = useState(initialGame);
  const [editingId, setEditingId] = useState(null);

  const [postuladosModal, setPostuladosModal] = useState({ open: false, postulados: [], gameId: null });
  const [reporteModal, setReporteModal] = useState({ open: false, mes: new Date().getMonth() + 1, ano: new Date().getFullYear(), cargando: false });
  const [arbitroDetalleModal, setArbitroDetalleModal] = useState({ open: false, arbitro: null });
  const [sustitucionModal, setSustitucionModal] = useState({ 
    open: false, 
    gameId: null, 
    gameName: '', 
    arbitroActual: null,
    postulados: [], 
    nuevoArbitroId: '', 
    razon: '', 
    loading: false 
  });

  // Estado para modal de calificación
  const [calificacionModal, setCalificacionModal] = useState({
    open: false,
    partido: null,
    arbitro: null,
    estrellas: 0,
    comentario: '',
    loading: false
  });

  // Estado para partidos pendientes de calificar
  const [pendientesCalificacion, setPendientesCalificacion] = useState([]);

  // Estados para ubicaciones
  const [ubicaciones, setUbicaciones] = useState([]);
  const [ubicacionModal, setUbicacionModal] = useState({ 
    open: false, 
    nombre: '', 
    direccion: '',
    latitud: null,
    longitud: null,
    saving: false, 
    editingId: null 
  });
  const mapRef = useRef(null); // Referencia para el mapa de Leaflet
  const markerRef = useRef(null); // Referencia para el marcador

  const [stats, setStats] = useState({ total: 0, upcoming: 0, needsReferee: 0 });
  const [user, setUser] = useState(null);

  // Función para cargar la cancha asignada al organizador
  const loadCanchaAsignada = useCallback(async () => {
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
          logger.log("No se pudo cargar la cancha, pero continuamos:", await res.text());
        }
      } catch (fetchError) {
        logger.error("Error de red al cargar cancha:", fetchError);
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
          logger.error("Error también en fallback de cancha:", fallbackError);
        }
      }
    } catch (error) {
      logger.error("Error general al cargar cancha asignada:", error);
      // No hacemos nada crítico, continuamos con la UI
    }
  }, []);

  // Función para cargar datos del usuario - OPTIMIZADA
  const loadUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }

      // Usar datos en caché si están disponibles
      const cachedUserId = localStorage.getItem("userId");
      const cachedUserRole = localStorage.getItem("userRole");
      const cachedUserName = localStorage.getItem("userName");
      const cachedUserImage = localStorage.getItem("userImage");
      
      if (cachedUserId && cachedUserRole === 'organizador') {
        // Cargar desde caché inmediatamente
        setUser({
          userId: cachedUserId,
          nombre: cachedUserName || "Organizador",
          role: cachedUserRole,
          imagenPerfil: cachedUserImage || null
        });
        
        // Cargar cancha en segundo plano
        loadCanchaAsignada();
        return;
      }

      // Si no hay caché, verificar con el servidor
      const res = await fetch("/api/usuarios/check-session", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data?.userId && data.role === 'organizador') {
          setUser(data);
          
          // Guardar en caché
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("userRole", data.role);
          localStorage.setItem("userName", data.nombre);
          if (data.imagenPerfil) {
            localStorage.setItem("userImage", data.imagenPerfil);
          }
          
          loadCanchaAsignada();
        } else if (data.role === 'arbitro') {
          window.location.href = "/dashboard";
        }
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      logger.error("Error al verificar sesión:", error);
      window.location.href = "/";
    }
  }, [loadCanchaAsignada]);

  // Verificar sesión al cargar
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Recargar datos cuando la ventana vuelve a tener foco (ej: después de editar perfil)
  useEffect(() => {
    const handleFocus = () => {
      logger.log("Ventana recuperó el foco, recargando datos del usuario...");
      loadUserData();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadUserData]);

  // Cargar datos
  useEffect(() => {
    loadGames();
    loadStats();
    loadUbicaciones();
    verificarPartidosFinalizados(); // Verificar y finalizar partidos automáticamente
    
    // ⏰ Verificar partidos finalizados cada 30 segundos automáticamente
    const intervalo = setInterval(() => {
      logger.log('🔄 Verificando partidos finalizados automáticamente...');
      verificarPartidosFinalizados();
    }, 30000); // 30 segundos
    
    // Limpiar intervalo cuando se desmonte el componente
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicializar mapa de Leaflet cuando se abre el modal
  useEffect(() => {
    if (!ubicacionModal.open) {
      // Limpiar mapa cuando se cierra el modal
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    // Esperar a que el DOM se actualice
    const timer = setTimeout(() => {
      const mapElement = document.getElementById('ubicacion-map');
      if (!mapElement || mapRef.current) return;

      // Inicializar el mapa centrado en Colima, México
      const map = window.L.map('ubicacion-map').setView([19.2433, -103.7250], 13);
      mapRef.current = map;

      // Usar Google Hybrid (satelital + etiquetas) - mejor calidad y más actual
      window.L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Maps'
      }).addTo(map);

      // Si hay coordenadas en el estado (editando o después de buscar), centrar y colocar marcador
      if (ubicacionModal.latitud && ubicacionModal.longitud) {
        const lat = ubicacionModal.latitud;
        const lng = ubicacionModal.longitud;
        map.setView([lat, lng], 16);
        const marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        // Actualizar coordenadas cuando se arrastra el marcador
        marker.on('dragend', function(e) {
          const pos = e.target.getLatLng();
          setUbicacionModal(prev => ({
            ...prev,
            latitud: pos.lat,
            longitud: pos.lng
          }));
        });
      }

      // Manejar clicks en el mapa para colocar/mover el marcador
      map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        
        // Remover marcador anterior si existe
        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Crear nuevo marcador arrastrable
        const marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        // Actualizar estado con nuevas coordenadas
        setUbicacionModal(prev => ({
          ...prev,
          latitud: lat,
          longitud: lng
        }));

        // Actualizar coordenadas cuando se arrastra el marcador
        marker.on('dragend', function(e) {
          const pos = e.target.getLatLng();
          setUbicacionModal(prev => ({
            ...prev,
            latitud: pos.lat,
            longitud: pos.lng
          }));
        });
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [ubicacionModal.open, ubicacionModal.latitud, ubicacionModal.longitud]);

  // Cargar ubicaciones del organizador
  async function loadUbicaciones() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch("/api/ubicaciones", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUbicaciones(data || []);
      }
    } catch (error) {
      logger.error("Error ubicaciones:", error.message);
    }
  }

  // Abrir modal para agregar/editar ubicación
  async function openUbicacionModal(ubicacion = null) {
    if (ubicacion) {
      let direccion = ubicacion.direccion || '';
      
      // Si no tiene dirección pero sí tiene coordenadas, buscar la dirección
      if (!direccion && ubicacion.latitud && ubicacion.longitud) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${ubicacion.latitud}&lon=${ubicacion.longitud}`
          );
          const data = await response.json();
          if (data && data.display_name) {
            direccion = data.display_name;
          }
        } catch (error) {
          logger.error('Error obteniendo dirección:', error);
        }
      }
      
      setUbicacionModal({ 
        open: true, 
        nombre: ubicacion.nombre, 
        direccion: direccion,
        latitud: ubicacion.latitud || null,
        longitud: ubicacion.longitud || null,
        googleMapsUrl: ubicacion.googleMapsUrl || '',
        saving: false, 
        editingId: ubicacion._id 
      });
    } else {
      setUbicacionModal({ 
        open: true, 
        nombre: '', 
        direccion: '',
        latitud: null,
        longitud: null,
        googleMapsUrl: '',
        saving: false, 
        editingId: null 
      });
    }
  }

  // Guardar nueva ubicación o actualizar existente
  async function saveUbicacion() {
    try {
      if (!ubicacionModal.nombre.trim()) {
        alert('Por favor ingresa el nombre de la cancha');
        return;
      }

      // Validar que no exista otra ubicación con el mismo nombre
      const nombreExistente = ubicaciones.some(
        ub => ub.nombre.toLowerCase().trim() === ubicacionModal.nombre.toLowerCase().trim() 
              && ub._id !== ubicacionModal.editingId
      );

      if (nombreExistente) {
        alert(`❌ Ya existe una ubicación con el nombre "${ubicacionModal.nombre}". Por favor usa un nombre diferente.`);
        setUbicacionModal({ ...ubicacionModal, saving: false });
        return;
      }

      setUbicacionModal({ ...ubicacionModal, saving: true });

      // Si no hay dirección pero sí hay coordenadas, buscar la dirección
      let direccion = ubicacionModal.direccion?.trim() || '';
      if (!direccion && ubicacionModal.latitud && ubicacionModal.longitud) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${ubicacionModal.latitud}&lon=${ubicacionModal.longitud}`
          );
          const data = await response.json();
          if (data && data.display_name) {
            direccion = data.display_name;
          }
        } catch (error) {
          logger.error('Error obteniendo dirección automáticamente:', error);
          // Continuar sin dirección
        }
      }

      const token = localStorage.getItem("token");
      const isEditing = ubicacionModal.editingId;
      const url = isEditing ? `/api/ubicaciones/${ubicacionModal.editingId}` : "/api/ubicaciones";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: ubicacionModal.nombre.trim(),
          direccion: direccion,
          latitud: ubicacionModal.latitud,
          longitud: ubicacionModal.longitud,
          googleMapsUrl: ubicacionModal.latitud && ubicacionModal.longitud 
            ? `https://www.google.com/maps?q=${ubicacionModal.latitud},${ubicacionModal.longitud}`
            : null,
          canchaId: user?.canchaAsignada?._id
        }),
      });

      if (!res.ok) throw new Error("Error al guardar ubicación");

      // Recargar ubicaciones Y partidos para reflejar los cambios
      await Promise.all([loadUbicaciones(), loadGames()]);
      
      setUbicacionModal({ open: false, nombre: '', direccion: '', latitud: null, longitud: null, googleMapsUrl: '', saving: false, editingId: null });
      alert(isEditing ? '✅ Ubicación actualizada exitosamente' : '✅ Ubicación agregada exitosamente');
    } catch (error) {
      logger.error("Error al guardar ubicación:", error);
      alert('Error al guardar la ubicación');
      setUbicacionModal({ ...ubicacionModal, saving: false });
    }
  }

  // Eliminar ubicación
  async function deleteUbicacion(ubicacionId) {
    if (!confirm('¿Estás seguro de eliminar esta ubicación?')) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/ubicaciones/${ubicacionId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Error al eliminar ubicación");

      await loadUbicaciones();
      alert('✅ Ubicación eliminada exitosamente');
    } catch (error) {
      logger.error("Error al eliminar ubicación:", error);
      alert('Error al eliminar la ubicación');
    }
  }

  async function loadStats() {
    try {
      const res = await fetch("/api/games/stats", { 
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setStats({
        total: Number(data?.total) || 0,
        upcoming: Number(data?.upcoming) || 0,
        needsReferee: Number(data?.needsReferee) || 0
      });
    } catch {
      setStats({ total: 0, upcoming: 0, needsReferee: 0 });
    }
  }

  async function loadGames() {
    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setGames(Array.isArray(data) ? data : []);
      }
    } catch (error) { 
      logger.error("Error al cargar partidos:", error.message);
    } finally {
      setLoading(false);
    }
  }

  // Función para verificar partidos finalizados y obtener pendientes de calificación
  async function verificarPartidosFinalizados() {
    try {
      logger.log('🚀 Iniciando verificación de partidos finalizados...');
      logger.log('📍 Usuario actual:', user);
      logger.log('🏟️ Cancha asignada:', user?.canchaAsignada);
      
      const res = await fetch("/api/auth/verificar-partidos", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        logger.log('📊 Respuesta completa de verificación:', JSON.stringify(data, null, 2));
        
        if (data.finalizados > 0) {
          logger.log(`✅ ${data.finalizados} partido(s) finalizados automáticamente`);
          // Recargar lista de partidos para reflejar cambios
          await loadGames();
          await loadStats(); // También actualizar estadísticas
        } else {
          logger.log('ℹ️ No se finalizaron partidos automáticamente en esta verificación');
        }
        
        // Guardar partidos pendientes de calificación
        logger.log('🔍 Partidos pendientes de calificación recibidos:', data.pendientesCalificacion?.length || 0);
        
        if (data.pendientesCalificacion && Array.isArray(data.pendientesCalificacion)) {
          data.pendientesCalificacion.forEach((partido, idx) => {
            logger.log(`📋 Partido pendiente ${idx + 1}:`, {
              id: partido._id,
              nombre: partido.nombre,
              fecha: partido.fecha,
              hora: partido.hora,
              arbitro: partido.arbitro?.nombre || 'Sin nombre',
              calificado: partido.calificado
            });
          });
        }
        
        if (data.pendientesCalificacion && data.pendientesCalificacion.length > 0) {
          setPendientesCalificacion(data.pendientesCalificacion);
          
          // Solo abrir modal si no hay uno abierto ya
          if (!calificacionModal.open) {
            // Mostrar modal de calificación para el primer partido pendiente
            const primerPendiente = data.pendientesCalificacion[0];
            logger.log('⭐ Abriendo modal para calificar el partido:', primerPendiente.nombre);
            logger.log('👤 Árbitro a calificar:', primerPendiente.arbitro);
            
            setCalificacionModal({
              open: true,
              partido: primerPendiente,
              arbitro: primerPendiente.arbitro,
              estrellas: 0,
              comentario: '',
              loading: false
            });
          }
        } else {
          logger.log('ℹ️ No hay partidos pendientes de calificar para tu cancha');
          logger.log('💡 Verifica que:');
          logger.log('  - El partido haya pasado 1 hora desde su inicio');          logger.log('  - El partido tenga árbitro asignado');
          logger.log('  - El partido pertenezca a tu cancha');
        }
      } else {
        const errorText = await res.text();
        logger.error('❌ Error en respuesta del servidor:', errorText);
        logger.error('🔴 Status:', res.status, res.statusText);
      }
    } catch (error) {
      logger.error("❌ Error al verificar partidos:", error);
      logger.error('🔴 Stack:', error.stack);
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
      ubicacionId: game?.ubicacionId?._id || game?.ubicacionId || "",
    });
    setEditingId(game?._id || null);
    setModalTitle("Editar Partido");
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      // Validar fecha
      const gameDateTime = new Date(`${currentGame.date}T${currentGame.time}`);
      if (gameDateTime < new Date()) {
        alert('⚠️ No puedes crear o editar un partido con fecha pasada');
        return;
      }
      
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/games/${editingId}` : "/api/games";
      
      const gameToSave = { ...currentGame };
      
      // Agregar cancha si es nuevo partido
      if (!editingId && user?.canchaAsignada?._id) {
        gameToSave.canchaId = user.canchaAsignada._id;
      }
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(gameToSave)
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Error al guardar");
      
      setModalOpen(false);
      setEditingId(null);
      setCurrentGame(initialGame);
      
      // Recargar en paralelo
      await Promise.all([loadGames(), loadStats()]);
    } catch (err) {
      alert(err.message || "Error al conectar con el servidor");
    }
  }

  async function handleDelete(gameId) {
    if (!window.confirm("¿Eliminar este partido?")) return;
    try {
      const res = await fetch(`/api/games/${gameId}`, { 
        method: "DELETE", 
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      if (!res.ok) throw new Error("Error al eliminar");
      
      // Actualización optimista de UI
      setGames(prev => prev.filter(g => g._id !== gameId));
      loadStats(); // Recargar stats en background
    } catch (err) {
      alert(err.message || "Error al eliminar");
      loadGames(); // Recargar si falló
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
        body: JSON.stringify({ arbitroId })
      });
      
      if (!res.ok) throw new Error("Error al asignar");
      
      setPostuladosModal({ open: false, postulados: [], gameId: null });
      loadGames(); // Recargar en background
    } catch (err) {
      alert(err.message || "Error al asignar");
    }
  }

  // Función para abrir el modal de sustitución
  async function openSustitucionModal(game) {
    try {
      // Cargar los postulados del partido
      const res = await fetch(`/api/games/${game._id}/postulados`, { 
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include" 
      });
      const data = await res.json();
      
      // Filtrar el árbitro actual de la lista de postulados
      const postuladosDisponibles = (data?.postulados || []).filter(
        p => String(p._id) !== String(game.arbitro._id)
      );
      
      setSustitucionModal({ 
        open: true, 
        gameId: game._id,
        gameName: game.name,
        arbitroActual: game.arbitro,
        postulados: postuladosDisponibles,
        nuevoArbitroId: '', 
        razon: '', 
        loading: false 
      });
    } catch (error) {
      logger.error("Error al cargar postulados para sustitución:", error);
      alert("Error al cargar la lista de árbitros disponibles");
    }
  }

  // Función para confirmar sustitución
  async function confirmSustitucion() {
    const { gameId, nuevoArbitroId, razon, loading } = sustitucionModal;
    
    // Evitar llamadas duplicadas
    if (loading) {
      logger.log("Ya hay una operación en proceso, ignorando llamada duplicada");
      return;
    }
    
    // Validaciones
    if (!nuevoArbitroId) {
      alert("Por favor, selecciona un árbitro para la sustitución");
      return;
    }
    
    if (!razon || razon.trim().length < 10) {
      alert("La razón debe tener al menos 10 caracteres");
      return;
    }
    
    setSustitucionModal(prev => ({ ...prev, loading: true }));
    
    try {
      const res = await fetch(`/api/games/${gameId}/substitute`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include",
        body: JSON.stringify({ nuevoArbitroId, razon }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Error al sustituir árbitro");
      }
      
      // Cerrar modal PRIMERO
      setSustitucionModal({ 
        open: false, 
        gameId: null,
        gameName: '',
        arbitroActual: null,
        postulados: [], 
        nuevoArbitroId: '', 
        razon: '', 
        loading: false 
      });
      
      // Luego recargar partidos
      await loadGames();
      
      // Mostrar mensaje de éxito al final
      alert(`✅ Sustitución exitosa!\n\nÁrbitro anterior: ${data.arbitroAnterior}\nNuevo árbitro: ${data.nuevoArbitro}\n\nSe han enviado las notificaciones por email.`);
      
    } catch (err) {
      logger.error("Error al sustituir:", err);
      alert(err.message || "Error al conectar con el servidor");
      setSustitucionModal(prev => ({ ...prev, loading: false }));
    }
  }

  // Función para desasignar árbitro
  async function confirmDesasignacion() {
    const { gameId, razon, loading } = sustitucionModal;
    
    // Evitar llamadas duplicadas
    if (loading) {
      logger.log("Ya hay una operación en proceso, ignorando llamada duplicada");
      return;
    }
    
    // Validar razón
    if (!razon || razon.trim().length < 10) {
      alert("La razón debe tener al menos 10 caracteres");
      return;
    }
    
    const confirmacion = confirm(
      "¿Estás seguro de desasignar al árbitro?\n\n" +
      "El partido se reabrirá para que otros árbitros puedan postularse.\n" +
      "Se enviará un email al árbitro notificándole la desasignación."
    );
    
    if (!confirmacion) return;
    
    setSustitucionModal(prev => ({ ...prev, loading: true }));
    
    try {
      const res = await fetch(`/api/games/${gameId}/unassign`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include",
        body: JSON.stringify({ razon }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || `Error del servidor (${res.status})`);
      }
      
      // Cerrar modal PRIMERO
      setSustitucionModal({ 
        open: false, 
        gameId: null,
        gameName: '',
        arbitroActual: null,
        postulados: [], 
        nuevoArbitroId: '', 
        razon: '', 
        loading: false 
      });
      
      // Luego recargar partidos
      await loadGames();
      
      // Mostrar mensaje de éxito al final
      alert(`✅ Desasignación exitosa!\n\nÁrbitro removido: ${data.arbitroRemovido}\n\nEl partido está ahora abierto para nuevas postulaciones.\nSe ha enviado la notificación por email.`);
      
    } catch (err) {
      logger.error("Error al desasignar:", err);
      alert(`Error al desasignar árbitro:\n${err.message}`);
      setSustitucionModal(prev => ({ ...prev, loading: false }));
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

  // Función para verificar si un partido ya inició (bloquear edición/eliminación)
  // 🔒 IMPORTANTE: Esta función se usa para bloquear TODAS las acciones del organizador
  // cuando el partido ya llegó a su fecha y hora de inicio:
  // ✅ Editar partido
  // ✅ Eliminar partido  
  // ✅ Asignar árbitro (Ver Postulados)
  // ✅ Sustituir árbitro
  // ✅ Desasignar árbitro
  function haIniciado(game) {
    try {
      if (!game.date || !game.time) {
        logger.warn('Partido sin fecha u hora:', game);
        return false;
      }

      let fechaPartido;
      
      // Intentar parsear diferentes formatos de fecha
      if (game.date.includes('/')) {
        // Formato DD/MM/YYYY
        const [dia, mes, ano] = game.date.split('/').map(Number);
        const [hora, minutos] = game.time.split(':').map(Number);
        fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
      } else if (game.date.includes('-')) {
        // Formato YYYY-MM-DD o similar
        // Crear fecha directamente del formato ISO
        fechaPartido = new Date(game.date + 'T' + game.time);
      } else {
        // Intentar parsear directamente
        fechaPartido = new Date(game.date + ' ' + game.time);
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaPartido.getTime())) {
        logger.error('Fecha inválida parseada:', game.date, game.time);
        return false;
      }
      
      // Comparar con fecha actual
      const ahora = new Date();
      const haIniciado = ahora >= fechaPartido;
      
      // Log para debugging (puedes removerlo después)
      logger.log(`🕐 Verificando partido "${game.name}":`, {
        fechaPartido: fechaPartido.toLocaleString('es-MX'),
        ahora: ahora.toLocaleString('es-MX'),
        haIniciado: haIniciado,
        fechaOriginal: game.date,
        horaOriginal: game.time
      });
      
      return haIniciado;
    } catch (error) {
      logger.error('Error al verificar inicio de partido:', error, game);
      return false;
    }
  }

  // Función para abrir modal de calificación
  function abrirModalCalificacion(partido) {
    setCalificacionModal({
      open: true,
      partido: partido,
      arbitro: partido.arbitro,
      estrellas: 0,
      comentario: '',
      loading: false
    });
  }

  // Función para calificar árbitro
  async function calificarArbitro() {
    const { partido, arbitro, estrellas, comentario } = calificacionModal;
    
    if (estrellas === 0) {
      alert('⚠️ Por favor selecciona una calificación de 1 a 5 estrellas');
      return;
    }

    setCalificacionModal(prev => ({ ...prev, loading: true }));

    try {
      const res = await fetch('/api/auth/calificar-arbitro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          partidoId: partido._id,
          arbitroId: arbitro._id,
          estrellas: estrellas,
          comentario: comentario.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al calificar árbitro');
      }

      alert(`✅ Calificación registrada exitosamente!\n\nÁrbitro: ${arbitro.nombre}\nCalificación: ${estrellas} ⭐\nPromedio actual: ${data.arbitro.calificacionPromedio.toFixed(2)}/5.00`);

      // Cerrar modal
      setCalificacionModal({
        open: false,
        partido: null,
        arbitro: null,
        estrellas: 0,
        comentario: '',
        loading: false
      });

      // Remover de la lista de pendientes
      setPendientesCalificacion(prev => prev.filter(p => p._id !== partido._id));

      // Si hay más pendientes, mostrar el siguiente
      const restantes = pendientesCalificacion.filter(p => p._id !== partido._id);
      if (restantes.length > 0) {
        setTimeout(() => {
          abrirModalCalificacion(restantes[0]);
        }, 500);
      }

    } catch (error) {
      logger.error('Error al calificar:', error);
      alert(`❌ Error al calificar árbitro:\n${error.message}`);
      setCalificacionModal(prev => ({ ...prev, loading: false }));
    }
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
        logger.log("Error en logout (no crítico):", error);
      });
    } catch (error) {
      logger.error("Error al intentar logout:", error);
    } finally {
      // Siempre limpiamos localStorage y redirigimos
      logger.log("Cerrando sesión y limpiando datos locales");
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
      
      logger.log(`Generando reporte para ${mesNombre} de ${anoReporte}`);
      
      // Variable para almacenar los partidos filtrados
      let partidosFiltrados = [];
      let reporteDesdeAPI = false;
      
      // Intentar obtener datos del servidor primero (incluye historial)
      try {
        const token = localStorage.getItem("token");
        const url = `/api/reportes/reporte-datos?mes=${mesNombre}&anio=${anoReporte}`;
        
        logger.log('Intentando obtener datos del reporte desde la API:', url);
        const res = await fetch(url, {
          headers: { 
            "Authorization": `Bearer ${token}`
          },
          credentials: "include"
        });
        
        if (res.ok) {
          const dataAPI = await res.json();
          logger.log('Datos del reporte obtenidos desde la API:', dataAPI);
          
          // Si obtenemos datos desde la API, ya contienen tanto partidos activos como históricos
          if (dataAPI && Array.isArray(dataAPI.partidos)) {
            partidosFiltrados = dataAPI.partidos;
            reporteDesdeAPI = true;
            logger.log(`${partidosFiltrados.length} partidos obtenidos desde la API:`, partidosFiltrados);
            
            // Verificar estructura de cada partido
            partidosFiltrados.forEach((partido, idx) => {
              logger.log(`Partido ${idx + 1} desde API:`, {
                id: partido.id || partido._id,
                nombre: partido.nombre || partido.name,
                fecha: partido.fecha || partido.date,
                hora: partido.hora || partido.time,
                ubicacion: partido.ubicacion || partido.location,
                arbitro: partido.arbitro || (partido.arbitroId ? 'Asignado' : 'Sin asignar'),
                estado: partido.estado || 'Programado'
              });
            });
          }
        } else {
          logger.log('No se pudieron obtener datos desde la API, error:', await res.text());
        }
      } catch (apiError) {
        logger.error('Error al obtener datos de la API:', apiError);
      }
      
      // Si no pudimos obtener datos de la API, usar los partidos disponibles en el estado
      if (!reporteDesdeAPI) {
        logger.log('Usando datos locales para generar el reporte...');
        logger.log('Partidos disponibles en el estado local:', games.length);
        
        // Mostrar información detallada sobre los partidos para depuración
        games.forEach((partido, idx) => {
          logger.log(`Partido ${idx + 1} (local):`, {
            id: partido._id,
            nombre: partido.name,
            fecha: partido.date,
            hora: partido.time,
            ubicacion: partido.location,
            arbitro: partido.arbitro ? (partido.arbitro.nombre || partido.arbitro.email || 'Asignado') : 'Sin asignar',
            canchaId: partido.canchaId,
            tipo_fecha: typeof partido.date
          });
        });
        
        // Crear un nuevo array con los datos en el formato esperado para el reporte
        partidosFiltrados = games.map(partido => ({
          id: partido._id,
          nombre: partido.name,
          fecha: partido.date,
          hora: partido.time,
          ubicacion: partido.location || (user?.canchaAsignada?.direccion || 'Sin ubicación'),
          arbitro: partido.arbitro ? (
            typeof partido.arbitro === 'object' ? 
              (partido.arbitro.nombre || partido.arbitro.email || 'Árbitro asignado') :
              'Árbitro asignado'
          ) : 'Sin asignar',
          tieneArbitro: !!partido.arbitro,
          estado: partido.estado || 'Programado'
        }));
        
        logger.log('Partidos transformados para el PDF:', partidosFiltrados);
        
        // Filtrar por mes y año si hay suficientes partidos
        if (partidosFiltrados.length > 2) {
          // Función mejorada para parsear fechas en varios formatos
          const parseDate = (dateStr) => {
            if (!dateStr) return null;
            
            try {
              // Intentar convertir a fecha primero
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                return {
                  year: date.getFullYear(),
                  month: date.getMonth() + 1 // getMonth devuelve 0-11
                };
              }
              
              // Si es un string con formato YYYY-MM-DD
              if (typeof dateStr === 'string' && dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length >= 2) {
                  return {
                    year: parseInt(parts[0]),
                    month: parseInt(parts[1])
                  };
                }
              }
              
              // Si es un string con formato DD/MM/YYYY
              if (typeof dateStr === 'string' && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  // Formato DD/MM/YYYY
                  if (parseInt(parts[0]) <= 31) {
                    return {
                      year: parseInt(parts[2]),
                      month: parseInt(parts[1])
                    };
                  } 
                  // Formato MM/DD/YYYY
                  else {
                    return {
                      year: parseInt(parts[2]),
                      month: parseInt(parts[0])
                    };
                  }
                }
              }
              
              return null;
            } catch (e) {
              logger.error('Error al parsear fecha:', e);
              return null;
            }
          };
          
          // Filtrar partidos por mes y año con mejor manejo de errores
          const filtrados = partidosFiltrados.filter(partido => {
            try {
              const parsedDate = parseDate(partido.fecha);
              
              if (parsedDate) {
                return parsedDate.year === anoReporte && parsedDate.month === mesNumero;
              }
              
              return false;
            } catch (e) {
              logger.error('Error al filtrar partido:', e, partido);
              return false;
            }
          });
          
          // Solo usamos los filtrados si hay alguno
          if (filtrados.length > 0) {
            logger.log(`Filtrados ${filtrados.length} partidos para el mes ${mesNumero} y año ${anoReporte}`);
            partidosFiltrados = filtrados;
          }
        }
      }
      
      logger.log(`Partidos finales para el reporte: ${partidosFiltrados.length}`);
      
      // Obtener información de la cancha desde user.canchaAsignada
      if (!user?.canchaAsignada) {
        alert('No tienes una cancha asignada. No se puede generar el reporte.');
        setReporteModal(prevState => ({ ...prevState, cargando: false }));
        return;
      }

      // Si no hay partidos, mostrar un mensaje y cancelar la generación del PDF
      if (partidosFiltrados.length === 0) {
        logger.warn('No hay partidos registrados para el período seleccionado.');
        alert('No hay partidos registrados para el período seleccionado.');
        setReporteModal(prevState => ({ ...prevState, cargando: false }));
        return;
      }
      
      // Crear objeto reporteData con información detallada
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
          // Determinar el estado del partido de forma avanzada
          let estado = p.estado;
          
          if (!estado) {
            // Si no tiene estado asignado, lo determinamos según la fecha y hora
            const fechaPartido = new Date(p.fecha || p.date);
            const horaPartido = p.hora || p.time || '12:00';
            const [horas, minutos] = horaPartido.split(':').map(Number);
            
            fechaPartido.setHours(horas || 0, minutos || 0);
            
            const fechaActual = new Date();
            const diferenciaTiempo = fechaPartido.getTime() - fechaActual.getTime();
            const diferenciaHoras = diferenciaTiempo / (1000 * 60 * 60);
            
            // Nueva lógica para determinar estado basado en la hora del partido
            if (diferenciaHoras > 1) {
              estado = 'Programado'; // Más de 1 hora antes del inicio
            } else if (diferenciaHoras > -2) {
              estado = 'En curso';   // Desde 1 hora antes hasta 2 horas después
            } else {
              estado = 'Finalizado'; // Más de 2 horas después (asumiendo que un partido dura ~90 minutos)
            }
          }
          
          // Si está específicamente marcado como cancelado, mantener ese estado
          if (p.estado === 'Cancelado') {
            estado = 'Cancelado';
          }
          
          // Extraer los valores correctamente, ya sea que vengan de la API o del estado local
          return {
            id: p.id || p._id || 'ID-' + Math.random().toString(36).substr(2, 9),
            nombre: p.nombre || p.name || 'Partido sin nombre',
            fecha: p.fecha || p.date || `${anoReporte}-${mesNumero.toString().padStart(2, '0')}-01`,
            hora: p.hora || p.time || '12:00',
            ubicacion: p.ubicacion || p.location || user.canchaAsignada.direccion || 'Sin ubicación',
            arbitro: typeof p.arbitro === 'string' ? 
              p.arbitro : 
              (p.arbitro && typeof p.arbitro === 'object' ? 
                (p.arbitro.nombre || p.arbitro.email || 'Árbitro asignado') : 
                'Sin asignar'),
            tieneArbitro: p.tieneArbitro !== undefined ? p.tieneArbitro : !!p.arbitro,
            estado: estado
          };
        }),
        fechaInicio: `1/${mesNumero}/${anoReporte}`,
        fechaFin: `${new Date(anoReporte, mesNumero, 0).getDate()}/${mesNumero}/${anoReporte}`,
        nombreCancha: user.canchaAsignada.nombre || 'Todas',
        estadisticas: {
          total: partidosFiltrados.length,
          conArbitro: partidosFiltrados.filter(p => p.arbitro && p.arbitro !== 'Sin asignar').length,
          sinArbitro: partidosFiltrados.filter(p => !p.arbitro || p.arbitro === 'Sin asignar').length,
          programados: partidosFiltrados.filter(p => p.estado === 'Programado' || !p.estado).length,
          enCurso: partidosFiltrados.filter(p => p.estado === 'En curso').length,
          finalizados: partidosFiltrados.filter(p => p.estado === 'Finalizado').length,
          cancelados: partidosFiltrados.filter(p => p.estado === 'Cancelado').length
        },
        fechaGeneracion: new Date()
      };
      
      logger.log('Datos del reporte preparados:', reporteData);
      
      // Verificar que jsPDF esté disponible (ya configurado en index.html como window.jsPDF)
      if (!window.jsPDF) {
        logger.error('Error: jsPDF no está disponible. Asegúrate de que index.html incluye el script de jsPDF.');
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
      
      // Intentar cargar e incluir el logo
      try {
        // Logo base64 de respaldo (pequeño logo genérico)
        const logoBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMHMxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMm0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04czggMy41OCA4IDhzLTMuNTggOC04IDhtMy0xMmMtLjU1IDAtMS00LjQ1LTEtMXMuNDUgMSAxIDFzMS0uNDUgMS0xcy0uNDUtMS0xLTFtLTYgMGMtLjU1IDAtMS0uNDUtMS0xcy40NS0xIDEtMXMxIC40NSAxIDFzLS40NSAxLTEgMW0zIDEwYzIuNzYgMCA1LTIuMjQgNS01aC0yYzAgMS42NS0xLjM1IDMtMyAzcy0zLTEuMzUtMy0zaC0yYzAgMi43NiAyLjI0IDUgNSA1Ii8+PC9zdmc+';
        
        // Intentar agregar el logo
        try {
          doc.addImage(logoBase64, 'SVG', 10, 5, 15, 15);
        } catch (logoError) {
          logger.log('Error al añadir logo base64, continuando sin logo:', logoError);
        }
      } catch (e) {
        logger.log('Error al intentar añadir logo:', e);
        // Continuar sin logo
      }
      
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
          
          // Segunda fila de estadísticas - Estados
          const yStats2 = yStats + 30;
          
          // Programados
          doc.setFillColor(76, 175, 80); // Verde
          doc.roundedRect(margin, yStats2, 40, 25, 3, 3, 'F');
          doc.setTextColor(255, 255, 255); // Blanco
          doc.setFontSize(9);
          doc.text('Programados', margin + 20, yStats2 + 10, { align: 'center' });
          doc.setFontSize(16);
          doc.text(reporteData.estadisticas.programados.toString(), margin + 20, yStats2 + 20, { align: 'center' });
          
          // En curso
          doc.setFillColor(255, 152, 0); // Naranja
          doc.roundedRect(margin + 50, yStats2, 40, 25, 3, 3, 'F');
          doc.setTextColor(255, 255, 255); // Blanco
          doc.setFontSize(9);
          doc.text('En curso', margin + 70, yStats2 + 10, { align: 'center' });
          doc.setFontSize(16);
          doc.text(reporteData.estadisticas.enCurso.toString(), margin + 70, yStats2 + 20, { align: 'center' });
          
          // Finalizados
          doc.setFillColor(33, 150, 243); // Azul
          doc.roundedRect(margin + 100, yStats2, 40, 25, 3, 3, 'F');
          doc.setTextColor(255, 255, 255); // Blanco
          doc.setFontSize(9);
          doc.text('Finalizados', margin + 120, yStats2 + 10, { align: 'center' });
          doc.setFontSize(16);
          doc.text(reporteData.estadisticas.finalizados.toString(), margin + 120, yStats2 + 20, { align: 'center' });
          
          // Cancelados
          doc.setFillColor(244, 67, 54); // Rojo
          doc.roundedRect(margin + 150, yStats2, 40, 25, 3, 3, 'F');
          doc.setTextColor(255, 255, 255); // Blanco
          doc.setFontSize(9);
          doc.text('Cancelados', margin + 170, yStats2 + 10, { align: 'center' });
          doc.setFontSize(16);
          doc.text(reporteData.estadisticas.cancelados.toString(), margin + 170, yStats2 + 20, { align: 'center' });
          
          // Espacio adicional después de las estadísticas para evitar superposición
          
      // TABLA DE PARTIDOS
      if (reporteData.partidos && reporteData.partidos.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51); // Gris oscuro
        doc.text('Lista de partidos:', margin, margin + 170); // Reducido para dejar más espacio entre el título y la tabla
        
        // Tabla con diseño simplificado
        const tableTop = margin + 185; // Aumentado el espacio para que no se superponga
        let y = tableTop;
        
        // Columnas de la tabla - Definir primero para calcular el ancho total correctamente
        const col1 = margin + 3;        // Fecha
        const col2 = margin + 30;       // Nombre
        const col3 = margin + 75;       // Hora
        const col4 = margin + 95;       // Ubicación
        const col5 = margin + 135;      // Árbitro
        const col6 = margin + 170;      // Estado
        const tableWidth = pageWidth - margin * 2; // Ancho total de la tabla
        
        // Encabezados con ancho ajustado para cubrir todas las columnas incluido Estado
        doc.setFillColor(26, 93, 26); // Verde oscuro
        doc.rect(margin, y, tableWidth, 10, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255); // Blanco
        
        doc.text('Fecha', col1, y + 6);
        doc.text('Nombre', col2, y + 6);
        doc.text('Hora', col3, y + 6);
        doc.text('Ubicación', col4, y + 6);
        doc.text('Árbitro', col5, y + 6);
        doc.text('Estado', col6, y + 6);
        
        y += 10; // Avanzar a la primera fila de datos
        
        // Función para formatear fechas de forma consistente siempre a DD/MM/YYYY
        function formatDate(dateStr) {
          if (!dateStr) return 'N/A';
          
          try {
            // Convertir a objeto Date para cualquier formato de entrada
            let date;
            
            if (typeof dateStr === 'string') {
              // Manejar diferentes formatos de fecha en string
              if (dateStr.includes('-')) {
                // Formato ISO YYYY-MM-DD
                const [año, mes, dia] = dateStr.split('-');
                const diaParts = dia.split('T')[0]; // Remover parte de hora si existe
                date = new Date(`${año}-${mes}-${diaParts}T00:00:00`);
              } else if (dateStr.includes('/')) {
                // Puede ser DD/MM/YYYY o MM/DD/YYYY
                const parts = dateStr.split('/');
                if (parts[2] && parts[2].length === 4) {
                  // Asumimos que el año está al final (posición 2)
                  if (parseInt(parts[0]) > 12) {
                    // DD/MM/YYYY
                    date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  } else {
                    // Puede ser MM/DD/YYYY o DD/MM/YYYY, asumimos DD/MM/YYYY para estandarizar
                    date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  }
                } else {
                  // Formato inusual, intentamos parsear directamente
                  date = new Date(dateStr);
                }
              } else {
                // Otro formato, intentar parsear directamente
                date = new Date(dateStr);
              }
            } else if (dateStr instanceof Date) {
              date = dateStr;
            } else {
              // Número (timestamp) u otro formato
              date = new Date(dateStr);
            }
            
            // Verificar si la fecha es válida
            if (!isNaN(date.getTime())) {
              // Formatear siempre como DD/MM/YYYY
              const dia = String(date.getDate()).padStart(2, '0');
              const mes = String(date.getMonth() + 1).padStart(2, '0');
              const año = date.getFullYear();
              
              return `${dia}/${mes}/${año}`;
            }
            
            return 'N/A'; // Si no pudimos convertirla
          } catch (e) {
            logger.error('Error formateando fecha:', e);
            return 'N/A';
          }
        }
        
        // Altura de fila
        const rowHeight = 8;
        
        // Dibujar filas de datos
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 51, 51); // Gris oscuro
        
        logger.log('Dibujando partidos en el PDF:', reporteData.partidos.length);
        
        for (const partido of reporteData.partidos) {
          // Nueva página si no hay espacio
          if (y > pageHeight - margin - 20) {
            doc.addPage();
            y = margin + 20;
            
            // Repetir encabezados en la nueva página
            doc.setFillColor(26, 93, 26); // Verde oscuro
            doc.rect(margin, y, tableWidth, 10, 'F'); // Usar tableWidth para consistencia
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255); // Blanco
            
            doc.text('Fecha', col1, y + 6);
            doc.text('Nombre', col2, y + 6);
            doc.text('Hora', col3, y + 6);
            doc.text('Ubicación', col4, y + 6);
            doc.text('Árbitro', col5, y + 6);
            doc.text('Estado', col6, y + 6); // Añadir columna Estado en los encabezados de nuevas páginas
            
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
          
          // Evitar que el texto sea undefined y controlar longitud máxima para evitar desbordamientos
          const fechaTexto = formatDate(partido.fecha) || 'N/A';
          
          // Limitar longitud de textos largos para evitar desbordamiento
          let nombreTexto = partido.nombre || 'Sin nombre';
          if (nombreTexto.length > 20) nombreTexto = nombreTexto.substring(0, 17) + '...';
          
          const horaTexto = partido.hora || 'N/A';
          
          let ubicacionTexto = partido.ubicacion || 'N/A';
          if (ubicacionTexto.length > 15) ubicacionTexto = ubicacionTexto.substring(0, 12) + '...';
          
          let arbitroTexto = partido.arbitro || 'Sin asignar';
          if (arbitroTexto.length > 15) arbitroTexto = arbitroTexto.substring(0, 12) + '...';
          
          // Determinar el estado correcto del partido
          let estadoTexto = partido.estado || 'Programado';
          
          // Colorear el estado según su valor
          const colorEstado = {
            'Programado': '#4CAF50', // Verde
            'En curso': '#FF9800',   // Naranja
            'Finalizado': '#2196F3', // Azul
            'Cancelado': '#F44336'   // Rojo
          }[estadoTexto] || '#757575'; // Gris por defecto
          
          // Asegurarnos de que los textos no sean undefined antes de pasarlos a jsPDF
          try {
            doc.text(String(fechaTexto), col1, y + 5);
            doc.text(String(nombreTexto), col2, y + 5);
            doc.text(String(horaTexto), col3, y + 5);
            doc.text(String(ubicacionTexto), col4, y + 5);
            doc.text(String(arbitroTexto), col5, y + 5);
            
            // Guardar color actual, cambiar a color según estado, y luego restaurar
            const currentTextColor = doc.getTextColor();
            doc.setTextColor(colorEstado);
            doc.text(String(estadoTexto), col6, y + 5);
            doc.setTextColor(currentTextColor);
          } catch (e) {
            logger.error("Error al dibujar texto en PDF:", e);
          }
          
          y += rowHeight;
          
          // Registrar lo que estamos dibujando para depuración
          logger.log('Dibujado partido:', {
            fecha: fechaTexto,
            nombre: nombreTexto,
            hora: horaTexto,
            ubicacion: ubicacionTexto,
            arbitro: arbitroTexto
          });
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
      
      // Guardar el PDF con tipo MIME correcto
      const nombreArchivo = `reporte-partidos-${reporteData.cancha.nombre.replace(/\s+/g, '-')}-${mesNombre}-${anoReporte}.pdf`;
      
      // Usar método nativo de jsPDF para guardar el documento como PDF
      doc.save(nombreArchivo);
      
      // Cerrar modal
      setReporteModal(prevState => ({ ...prevState, open: false, cargando: false }));
      logger.log('Reporte PDF generado correctamente');
    } catch (error) {
      logger.error('Error al generar reporte:', error);
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
                    {user?.canchaAsignada && (
                      <span className="text-green-600 font-medium">{user.canchaAsignada.nombre}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <img 
                    src={user?.imagenPerfil || "/img/perfil1.png"} 
                    alt="Perfil" 
                    className="w-10 h-10 rounded-full border-2 border-primary-200 object-cover cursor-pointer transition-all duration-200 hover:border-primary-400 hover:shadow-md"
                    onClick={() => window.location.href = "/editar-perfil"}
                  />
                  {/* Indicador de edición */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-200">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800">{user?.nombre || user?.name || "Admin"}</p>
                  <p className="text-xs text-gray-600">Organizador</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <div className={`card ${pendientesCalificacion.length > 0 ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="card-body">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Por Calificar</p>
                  <p className="text-3xl font-bold text-gray-900">{pendientesCalificacion.length}</p>
                  {pendientesCalificacion.length > 0 && (
                    <button
                      onClick={() => abrirModalCalificacion(pendientesCalificacion[0])}
                      className="text-xs text-yellow-600 hover:text-yellow-700 font-medium mt-1 flex items-center"
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                      </svg>
                      Calificar ahora
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Mis Ubicaciones */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-gray-800">Mis Ubicaciones</h3>
                  <p className="text-sm text-gray-600">Gestiona las canchas donde organizas partidos</p>
                </div>
              </div>
              <button
                onClick={() => openUbicacionModal()}
                className="btn btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Nueva Ubicación
              </button>
            </div>

            {ubicaciones.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">No tienes ubicaciones guardadas</h4>
                <p className="text-gray-600 mb-4">Agrega ubicaciones para usarlas al crear partidos</p>
                <button
                  onClick={() => openUbicacionModal()}
                  className="btn btn-primary inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  Agregar Primera Ubicación
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ubicaciones.map((ubicacion) => (
                  <div key={ubicacion._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          <h4 className="text-base font-semibold text-gray-900 truncate">{ubicacion.nombre}</h4>
                        </div>
                        {ubicacion.direccion && (
                          <p className="text-xs text-gray-600 ml-7 mb-2 line-clamp-2" title={ubicacion.direccion}>
                            {ubicacion.direccion}
                          </p>
                        )}
                        {ubicacion.latitud && ubicacion.longitud && (
                          <a
                            href={`https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:text-primary-700 hover:underline ml-7 inline-flex items-center"
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                            </svg>
                            Ver en Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openUbicacionModal(ubicacion)}
                        className="flex-1 btn btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        title="Editar ubicación"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => deleteUbicacion(ubicacion._id)}
                        className="flex-1 btn btn-sm btn-danger"
                        title="Eliminar ubicación"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                              {(() => {
                                const ubicacion = ubicaciones.find(ub => ub.nombre === game.location);
                                if (ubicacion && ubicacion.latitud && ubicacion.longitud) {
                                  return (
                                    <a 
                                      href={`https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
                                      title="Ver en Google Maps"
                                    >
                                      {game.location}
                                      <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                                      </svg>
                                    </a>
                                  );
                                }
                                return <span className="text-gray-700">{game.location}</span>;
                              })()}
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
                              <button
                                onClick={() => setArbitroDetalleModal({ open: true, arbitro: game.arbitro })}
                                className="badge badge-success hover:bg-green-600 transition-colors cursor-pointer"
                              >
                                {game.arbitro.nombre || game.arbitro.email}
                              </button>
                            ) : (
                              <span className="badge badge-warning">Sin asignar</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <button 
                                className="btn btn-sm btn-outline" 
                                onClick={() => openEditModal(game)}
                                disabled={haIniciado(game)}
                                title={haIniciado(game) ? 'No se puede editar un partido que ya inició' : 'Editar partido'}
                              >
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                </svg>
                                Editar
                              </button>
                              
                              <button 
                                className="btn btn-sm btn-danger" 
                                onClick={() => handleDelete(game._id)}
                                title="Eliminar partido"
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
                                  disabled={haIniciado(game)}
                                  title={haIniciado(game) ? 'No se puede asignar árbitro a un partido que ya inició' : 'Ver árbitros postulados'}
                                >
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12a1 1 0 000 2h2a1 1 0 100-2H9zm-4-7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1H5zm0 2v8h10V7H5z"/>
                                  </svg>
                                  Ver Postulados
                                </button>
                              )}
                              
                              {game.arbitro && (
                                <button 
                                  className="btn btn-sm btn-warning" 
                                  onClick={() => openSustitucionModal(game)}
                                  disabled={haIniciado(game)}
                                  title={haIniciado(game) ? 'No se puede sustituir árbitro en un partido que ya inició' : 'Sustituir árbitro asignado'}
                                >
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                                  </svg>
                                  Sustituir Árbitro
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
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
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
                      min={new Date().toISOString().split('T')[0]}
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
                  <select
                    id="location"
                    className="form-input"
                    value={currentGame.ubicacionId || currentGame.location}
                    onChange={(e) => {
                      const selectedUbicacion = ubicaciones.find(ub => ub._id === e.target.value);
                      setCurrentGame({ 
                        ...currentGame, 
                        location: selectedUbicacion ? selectedUbicacion.nombre : '',
                        ubicacionId: e.target.value 
                      });
                    }}
                    required
                  >
                    <option value="">Selecciona una ubicación</option>
                    {ubicaciones.map((ub) => (
                      <option key={ub._id} value={ub._id}>
                        {ub.nombre}
                      </option>
                    ))}
                  </select>
                  {ubicaciones.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No tienes ubicaciones guardadas. <a href="#ubicaciones" className="text-primary-600 hover:underline">Agrega una aquí</a>
                    </p>
                  )}
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
                    <div key={arbitro._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {arbitro.imagenPerfil ? (
                            <img 
                              src={arbitro.imagenPerfil} 
                              alt={arbitro.nombre} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setArbitroDetalleModal({ open: true, arbitro })}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-left transition-colors truncate block"
                          >
                            {arbitro.nombre || arbitro.email || 'Árbitro'}
                          </button>
                          <p className="text-sm text-gray-600 truncate">{arbitro.email || 'Sin email'}</p>
                          <div className="flex items-center mt-1">
                            {arbitro.calificacionPromedio > 0 ? (
                              <>
                                {[...Array(5)].map((_, i) => (
                                  <svg 
                                    key={i} 
                                    className={`w-3 h-3 ${i < Math.round(arbitro.calificacionPromedio) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                  </svg>
                                ))}
                                <span className="text-xs text-gray-600 ml-1">
                                  {arbitro.calificacionPromedio.toFixed(2)} ({arbitro.totalCalificaciones})
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 italic">
                                Sin calificaciones
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary flex-shrink-0 ml-3" 
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

      {/* Modal de Sustitución de Árbitro */}
      {sustitucionModal.open && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-gradient-to-r from-red-500 to-red-600 text-white">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-display font-semibold text-white truncate">Gestionar Árbitro</h3>
                  <p className="text-xs md:text-sm text-red-100 truncate">Partido: {sustitucionModal.gameName}</p>
                </div>
              </div>
            </div>
            
            <div className="modal-body space-y-4">
              {/* Árbitro Actual */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-semibold text-red-800 text-sm mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span className="truncate">Árbitro Actual (será removido)</span>
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {sustitucionModal.arbitroActual?.imagenPerfil ? (
                      <img 
                        src={sustitucionModal.arbitroActual.imagenPerfil} 
                        alt={sustitucionModal.arbitroActual.nombre} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-red-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {sustitucionModal.arbitroActual?.nombre || sustitucionModal.arbitroActual?.email || 'Árbitro'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{sustitucionModal.arbitroActual?.email || 'Sin email'}</p>
                  </div>
                </div>
              </div>

              {/* Seleccionar Nuevo Árbitro */}
              <div>
                <label className="form-label text-sm">
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                  </svg>
                  Seleccionar Nuevo Árbitro (opcional)
                </label>
                {sustitucionModal.postulados.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-gray-600 font-medium text-sm">No hay árbitros disponibles</p>
                    <p className="text-xs text-gray-500 mt-1">No hay otros postulados para este partido</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sustitucionModal.postulados.map((arbitro) => (
                      <label 
                        key={arbitro._id}
                        className={`flex items-center justify-between p-2 border-2 rounded-lg cursor-pointer transition-all ${
                          sustitucionModal.nuevoArbitroId === arbitro._id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <input
                            type="radio"
                            name="nuevoArbitro"
                            value={arbitro._id}
                            checked={sustitucionModal.nuevoArbitroId === arbitro._id}
                            onChange={(e) => setSustitucionModal(prev => ({ ...prev, nuevoArbitroId: e.target.value }))}
                            className="form-radio text-green-600 flex-shrink-0"
                          />
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            {arbitro.imagenPerfil ? (
                              <img 
                                src={arbitro.imagenPerfil} 
                                alt={arbitro.nombre} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-green-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{arbitro.nombre || arbitro.email || 'Árbitro'}</p>
                            <p className="text-xs text-gray-600 truncate">{arbitro.email || 'Sin email'}</p>
                            {arbitro.calificacionPromedio > 0 ? (
                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <svg 
                                    key={i} 
                                    className={`w-3 h-3 ${i < Math.round(arbitro.calificacionPromedio) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                  </svg>
                                ))}
                                <span className="text-xs text-gray-600 ml-1">
                                  {arbitro.calificacionPromedio.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 italic mt-1 block">
                                Sin calificaciones
                              </span>
                            )}
                          </div>
                        </div>
                        {sustitucionModal.nuevoArbitroId === arbitro._id && (
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Razón de la Sustitución/Desasignación */}
              <div>
                <label className="form-label required text-sm">
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  Justificación (mínimo 10 caracteres)
                </label>
                <textarea
                  value={sustitucionModal.razon}
                  onChange={(e) => setSustitucionModal(prev => ({ ...prev, razon: e.target.value }))}
                  placeholder="Explica la razón de la sustitución o desasignación. Se enviará por email al árbitro."
                  className={`form-input resize-none text-sm ${sustitucionModal.razon.length > 0 && sustitucionModal.razon.length < 10 ? 'border-red-500' : ''}`}
                  rows="3"
                  disabled={sustitucionModal.loading}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {sustitucionModal.razon.length < 10 
                      ? `Faltan ${10 - sustitucionModal.razon.length} caracteres` 
                      : '✓ Longitud válida'}
                  </p>
                  <p className={`text-xs ${sustitucionModal.razon.length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                    {sustitucionModal.razon.length} / 10
                  </p>
                </div>
              </div>

              {/* Confirmación */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-blue-800 text-sm">Opciones disponibles</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      <strong>Sustituir:</strong> Asigna un nuevo árbitro de los postulados.<br />
                      <strong>Desasignar:</strong> Remueve al árbitro y reabre el partido para nuevas postulaciones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer flex-col sm:flex-row gap-2">
              <button 
                className="btn btn-warning w-full sm:w-auto text-sm order-3 sm:order-1"
                onClick={confirmDesasignacion}
                disabled={sustitucionModal.razon.trim().length < 10 || sustitucionModal.loading}
              >
                {sustitucionModal.loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    Solo Desasignar
                  </>
                )}
              </button>
              <button 
                className="btn btn-success w-full sm:w-auto text-sm order-2 sm:order-2"
                onClick={confirmSustitucion}
                disabled={!sustitucionModal.nuevoArbitroId || sustitucionModal.razon.trim().length < 10 || sustitucionModal.loading}
              >
                {sustitucionModal.loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Sustituir Árbitro
                  </>
                )}
              </button>
              <button 
                className="btn btn-danger w-full sm:w-auto text-sm order-1 sm:order-3" 
                onClick={() => setSustitucionModal({ open: false, gameId: null, gameName: '', arbitroActual: null, postulados: [], nuevoArbitroId: '', razon: '', loading: false })}
                disabled={sustitucionModal.loading}
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
                Cancelar
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

      {/* Modal Agregar/Editar Ubicación */}
      {ubicacionModal.open && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-display font-semibold text-gray-800">
                {ubicacionModal.editingId ? 'Editar Ubicación' : 'Agregar Nueva Ubicación'}
              </h3>
              {!ubicacionModal.saving && (
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setUbicacionModal({ open: false, nombre: '', direccion: '', latitud: null, longitud: null, googleMapsUrl: '', saving: false, editingId: null })}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div className="form-group">
                  <label htmlFor="ubicacion-nombre" className="form-label">Nombre de la Cancha</label>
                  <input
                    type="text"
                    id="ubicacion-nombre"
                    className="form-input"
                    placeholder="Ej: Cancha Municipal"
                    value={ubicacionModal.nombre}
                    onChange={(e) => setUbicacionModal({ ...ubicacionModal, nombre: e.target.value })}
                    disabled={ubicacionModal.saving}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ubicacion-direccion" className="form-label">
                    Dirección (Buscar en el mapa)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="ubicacion-direccion"
                      className="form-input pr-10"
                      placeholder="Ej: Calle Principal #123, Colima"
                      value={ubicacionModal.direccion}
                      onChange={(e) => setUbicacionModal({ ...ubicacionModal, direccion: e.target.value })}
                      disabled={ubicacionModal.saving}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!ubicacionModal.direccion) {
                          alert('Ingresa una dirección primero');
                          return;
                        }
                        try {
                          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ubicacionModal.direccion)}`);
                          const data = await response.json();
                          if (data && data.length > 0) {
                            const lat = parseFloat(data[0].lat);
                            const lng = parseFloat(data[0].lon);
                            
                            setUbicacionModal({
                              ...ubicacionModal,
                              latitud: lat,
                              longitud: lng,
                              direccion: data[0].display_name
                            });

                            // Centrar el mapa y colocar marcador
                            if (mapRef.current) {
                              mapRef.current.setView([lat, lng], 16);
                              
                              // Remover marcador anterior si existe
                              if (markerRef.current) {
                                markerRef.current.remove();
                              }
                              
                              // Crear nuevo marcador arrastrable
                              const marker = window.L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
                              markerRef.current = marker;

                              // Actualizar coordenadas cuando se arrastra el marcador
                              marker.on('dragend', function(e) {
                                const pos = e.target.getLatLng();
                                setUbicacionModal(prev => ({
                                  ...prev,
                                  latitud: pos.lat,
                                  longitud: pos.lng
                                }));
                              });
                            }
                            
                            alert('✅ Ubicación encontrada en el mapa');
                          } else {
                            alert('⚠️ No se encontró la ubicación. Intenta con otra dirección.');
                          }
                        } catch (error) {
                          logger.error('Error buscando ubicación:', error);
                          alert('Error al buscar la ubicación');
                        }
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700 transition-colors"
                      title="Buscar en el mapa"
                      disabled={ubicacionModal.saving}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                  {ubicacionModal.latitud && ubicacionModal.longitud && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Ubicación encontrada en el mapa
                    </p>
                  )}
                </div>
                {/* Mapa interactivo */}
                <div className="form-group">
                  <label className="form-label">
                    O selecciona en el mapa (clic para colocar marcador)
                  </label>
                  <div 
                    id="ubicacion-map" 
                    className="rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ height: '300px', width: '100%' }}
                  ></div>
                  {ubicacionModal.latitud && ubicacionModal.longitud && (
                    <p className="text-xs text-gray-500 mt-1">
                      📍 Coordenadas: {ubicacionModal.latitud.toFixed(6)}, {ubicacionModal.longitud.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="flex justify-end space-x-3">
                {!ubicacionModal.saving && (
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setUbicacionModal({ open: false, nombre: '', direccion: '', latitud: null, longitud: null, googleMapsUrl: '', saving: false, editingId: null })}
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  className="btn btn-primary" 
                  onClick={saveUbicacion}
                  disabled={ubicacionModal.saving}
                >
                  {ubicacionModal.saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {ubicacionModal.editingId ? 'Actualizando...' : 'Guardando...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      {ubicacionModal.editingId ? 'Actualizar' : 'Guardar'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Árbitro */}
      {arbitroDetalleModal.open && arbitroDetalleModal.arbitro && (
        <div className="modal-overlay" onClick={() => setArbitroDetalleModal({ open: false, arbitro: null })}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                  {arbitroDetalleModal.arbitro.imagenPerfil ? (
                    <img 
                      src={arbitroDetalleModal.arbitro.imagenPerfil} 
                      alt={arbitroDetalleModal.arbitro.nombre} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-display font-bold truncate">
                    {arbitroDetalleModal.arbitro.nombre || arbitroDetalleModal.arbitro.email || 'Árbitro'}
                  </h3>
                  <p className="text-blue-100 text-sm truncate">
                    {arbitroDetalleModal.arbitro.nombre ? arbitroDetalleModal.arbitro.email : 'Perfil de Árbitro'}
                  </p>
                </div>
              </div>
              <button 
                className="text-white hover:text-blue-100 transition-colors"
                onClick={() => setArbitroDetalleModal({ open: false, arbitro: null })}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Alerta si el perfil está incompleto */}
              {(!arbitroDetalleModal.arbitro.edad || !arbitroDetalleModal.arbitro.contacto || !arbitroDetalleModal.arbitro.experiencia) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Perfil incompleto:</strong> Este árbitro aún no ha completado toda su información de perfil.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Edad */}
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-semibold uppercase">Edad</p>
                      <p className="text-lg text-gray-900 font-bold">
                        {arbitroDetalleModal.arbitro.edad ? `${arbitroDetalleModal.arbitro.edad} años` : 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-green-600 font-semibold uppercase">Correo Electrónico</p>
                      <p className="text-sm text-gray-900 font-medium break-all">
                        {arbitroDetalleModal.arbitro.email || 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teléfono/Contacto */}
                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-orange-600 font-semibold uppercase">Teléfono de Contacto</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {arbitroDetalleModal.arbitro.contacto || 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Experiencia */}
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1zm-1 4a1 1 0 100-2H8a1 1 0 100 2h4z" clipRule="evenodd"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-purple-600 font-semibold uppercase mb-2">Experiencia Arbitrando</p>
                      {arbitroDetalleModal.arbitro.experiencia ? (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {arbitroDetalleModal.arbitro.experiencia}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No se ha proporcionado información de experiencia
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer bg-gray-50">
              <button 
                className="btn btn-primary" 
                onClick={() => setArbitroDetalleModal({ open: false, arbitro: null })}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Calificación de Árbitro */}
      {calificacionModal.open && calificacionModal.arbitro && (
        <div className="modal-overlay" onClick={() => !calificacionModal.loading && setCalificacionModal({ open: false, partido: null, arbitro: null, estrellas: 0, comentario: '', loading: false })}>
          <div className="modal-content max-w-lg w-full mx-4 my-4" onClick={(e) => e.stopPropagation()} style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="modal-header bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <h3 className="text-base sm:text-lg font-bold flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                Calificar Árbitro
              </h3>
            </div>
            <div className="modal-body overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
              {/* Información del partido */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-2 sm:p-3 mb-3 sm:mb-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-900 mb-1 text-xs sm:text-sm">📋 Partido Finalizado</h4>
                <p className="text-xs sm:text-sm text-blue-800 break-words">
                  <strong>{calificacionModal.partido.nombre}</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {calificacionModal.partido.fecha} - {calificacionModal.partido.hora}
                </p>
              </div>

              {/* Información del árbitro */}
              <div className="flex flex-col sm:flex-row items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 sm:border-4 border-white shadow-lg flex-shrink-0">
                  {calificacionModal.arbitro.imagenPerfil ? (
                    <img 
                      src={calificacionModal.arbitro.imagenPerfil} 
                      alt={calificacionModal.arbitro.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                      {calificacionModal.arbitro.nombre?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 break-words">{calificacionModal.arbitro.nombre}</h4>
                  <p className="text-xs text-gray-600 break-all">{calificacionModal.arbitro.email}</p>
                  {calificacionModal.arbitro.calificacionPromedio > 0 && (
                    <div className="flex items-center justify-center sm:justify-start mt-1">
                      <span className="text-xs text-gray-500 mr-1">Promedio:</span>
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-3 h-3 ${i < Math.round(calificacionModal.arbitro.calificacionPromedio) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-1">
                          ({calificacionModal.arbitro.calificacionPromedio.toFixed(1)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sistema de calificación por estrellas */}
              <div className="mb-3 sm:mb-4">
                <label className="form-label mb-2 text-xs sm:text-sm">
                  Calificación <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 p-2 sm:p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCalificacionModal(prev => ({ ...prev, estrellas: star }))}
                      disabled={calificacionModal.loading}
                      className="transition-all transform hover:scale-110 focus:outline-none disabled:opacity-50"
                    >
                      <svg 
                        className={`w-8 h-8 sm:w-10 sm:h-10 ${star <= calificacionModal.estrellas ? 'text-yellow-400' : 'text-gray-300'} transition-colors`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </button>
                  ))}
                </div>
                {calificacionModal.estrellas > 0 && (
                  <p className="text-center text-xs sm:text-sm text-gray-600 mt-1">
                    {calificacionModal.estrellas} de 5 estrellas
                  </p>
                )}
              </div>

              {/* Comentarios opcionales */}
              <div className="mb-2">
                <label className="form-label text-xs sm:text-sm mb-1">
                  Comentarios (opcional)
                </label>
                <textarea
                  className="form-input text-xs sm:text-sm p-2"
                  rows="2"
                  placeholder="Escribe aquí tus comentarios..."
                  value={calificacionModal.comentario}
                  onChange={(e) => setCalificacionModal(prev => ({ ...prev, comentario: e.target.value }))}
                  disabled={calificacionModal.loading}
                  maxLength="500"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {calificacionModal.comentario.length}/500
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <div className="flex flex-row justify-between sm:justify-end gap-3">
                {!calificacionModal.loading && (
                  <button 
                    className="btn btn-ghost flex-1 sm:flex-none text-xs sm:text-sm py-2" 
                    onClick={() => setCalificacionModal({ open: false, partido: null, arbitro: null, estrellas: 0, comentario: '', loading: false })}
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  className="btn btn-primary bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 flex-1 sm:flex-none text-xs sm:text-sm py-2" 
                  onClick={calificarArbitro}
                  disabled={calificacionModal.loading || calificacionModal.estrellas === 0}
                >
                  {calificacionModal.loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      Enviar Calificación
                    </>
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


