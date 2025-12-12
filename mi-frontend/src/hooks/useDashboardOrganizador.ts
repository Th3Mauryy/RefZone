// @ts-nocheck
// TODO: Agregar tipos estrictos a este archivo durante una futura refactorización
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { showSuccess, showError, showWarning, showInfo } from '../utils/toast';
import logger from '../utils/logger';
import type L from 'leaflet';

// ============================================
// TYPES
// ============================================
export interface Arbitro {
  _id: string;
  nombre?: string;
  email?: string;
  imagenPerfil?: string | null;
  calificacionPromedio?: number;
  totalCalificaciones?: number;
  edad?: number;
  contacto?: string;
  experiencia?: string;
}

export interface Game {
  _id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  ubicacionId?: string;
  arbitro?: Arbitro | null;
  postulados?: Arbitro[];
  estado?: string;
  canchaId?: { _id: string; nombre: string } | null;
}

export interface Ubicacion {
  _id: string;
  nombre: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
}

export interface CanchaAsignada {
  _id: string;
  nombre: string;
  direccion?: string;
  email?: string;
  telefono?: string;
}

export interface User {
  userId?: string;
  nombre?: string;
  name?: string;
  email?: string;
  role?: string;
  imagenPerfil?: string | null;
  canchaAsignada?: CanchaAsignada;
}

export interface HistorialPartido {
  _id: string;
  nombre?: string;
  fecha?: string;
  hora?: string;
  creadorId?: { nombre?: string };
  calificacion?: number;
  comentario?: string;
}

export interface GameErrors {
  name?: string;
  date?: string;
  time?: string;
  location?: string;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  type: 'danger' | 'warning' | 'info';
}

export interface PostuladosModal {
  open: boolean;
  postulados: Arbitro[];
  gameId: string | null;
}

export interface HistorialModal {
  open: boolean;
  arbitro: Arbitro | null;
  historial: HistorialPartido[];
  loading: boolean;
}

export interface ReporteModal {
  open: boolean;
  mes: number;
  ano: number;
  cargando: boolean;
}

export interface ArbitroDetalleModal {
  open: boolean;
  arbitro: Arbitro | null;
}

export interface SustitucionModal {
  open: boolean;
  gameId: string | null;
  gameName: string;
  arbitroActual: Arbitro | null;
  postulados: Arbitro[];
  nuevoArbitroId: string;
  razon: string;
  loading: boolean;
}

export interface CalificacionModal {
  open: boolean;
  partido: { _id: string; nombre: string; fecha: string; hora: string } | null;
  arbitro: Arbitro | null;
  estrellas: number;
  comentario: string;
  loading: boolean;
}

export interface UbicacionModal {
  open: boolean;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  googleMapsUrl?: string;
  saving: boolean;
  editingId: string | null;
  marcadorColocado: boolean;
}

export interface Stats {
  total: number;
  upcoming: number;
  needsReferee: number;
}

// ============================================
// CONSTANTS
// ============================================
const initialGame = { name: "", date: "", time: "", location: "", ubicacionId: "" };

// ============================================
// HOOK
// ============================================
export function useDashboardOrganizador() {
  // Games State
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Agregar Partido");
  const [currentGame, setCurrentGame] = useState(initialGame);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gameErrors, setGameErrors] = useState<GameErrors>({});

  // Various Modal States
  const [postuladosModal, setPostuladosModal] = useState<PostuladosModal>({ 
    open: false, postulados: [], gameId: null 
  });
  const [historialModal, setHistorialModal] = useState<HistorialModal>({ 
    open: false, arbitro: null, historial: [], loading: false 
  });
  const [reporteModal, setReporteModal] = useState<ReporteModal>({ 
    open: false, mes: new Date().getMonth() + 1, ano: new Date().getFullYear(), cargando: false 
  });
  const [arbitroDetalleModal, setArbitroDetalleModal] = useState<ArbitroDetalleModal>({ 
    open: false, arbitro: null 
  });
  const [sustitucionModal, setSustitucionModal] = useState<SustitucionModal>({ 
    open: false, gameId: null, gameName: '', arbitroActual: null,
    postulados: [], nuevoArbitroId: '', razon: '', loading: false 
  });
  const [calificacionModal, setCalificacionModal] = useState<CalificacionModal>({
    open: false, partido: null, arbitro: null, estrellas: 0, comentario: '', loading: false
  });
  const [pendientesCalificacion, setPendientesCalificacion] = useState<Array<{ _id: string; nombre?: string; arbitro?: Arbitro }>>([]);
  
  // Ubicaciones State
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacionModal, setUbicacionModal] = useState<UbicacionModal>({ 
    open: false, nombre: '', direccion: '', latitud: null, longitud: null,
    googleMapsUrl: '', saving: false, editingId: null, marcadorColocado: false
  });
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false, title: '', message: '', onConfirm: null, type: 'danger'
  });

  // User & Stats
  const [stats, setStats] = useState<Stats>({ total: 0, upcoming: 0, needsReferee: 0 });
  const [user, setUser] = useState<User | null>(null);

  // ============================================
  // USER FUNCTIONS
  // ============================================
  const loadCanchaAsignada = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch("/api/canchas/user/assigned", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.hasCancha) {
          setUser(prev => ({ ...prev, canchaAsignada: data.cancha }));
        }
      }
    } catch (error) {
      logger.error("Error al cargar cancha asignada:", error);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }

      const cachedUserId = localStorage.getItem("userId");
      const cachedUserRole = localStorage.getItem("userRole");
      const cachedUserName = localStorage.getItem("userName");
      const cachedUserImage = localStorage.getItem("userImage");
      
      if (cachedUserId && cachedUserRole === 'organizador') {
        setUser({
          userId: cachedUserId,
          nombre: cachedUserName || "Organizador",
          role: cachedUserRole,
          imagenPerfil: cachedUserImage || null
        });
        loadCanchaAsignada();
        return;
      }

      const res = await fetch("/api/usuarios/check-session", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data?.userId && data.role === 'organizador') {
          setUser(data);
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
      } else if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userImage");
        showError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        setTimeout(() => { window.location.href = "/"; }, 2000);
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      logger.error("Error al verificar sesión:", error);
      window.location.href = "/";
    }
  }, [loadCanchaAsignada]);

  const logout = useCallback(() => {
    try {
      fetch("/api/usuarios/logout", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include" 
      }).catch(() => {});
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("nombre");
      window.location.href = "/";
    }
  }, []);

  // ============================================
  // GAMES FUNCTIONS
  // ============================================
  const loadStats = useCallback(async () => {
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
  }, []);

  const loadGames = useCallback(async () => {
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
  }, []);

  const verificarPartidosFinalizados = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/verificar-partidos", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.finalizados > 0) {
          await loadGames();
          await loadStats();
        }
        
        if (data.pendientesCalificacion && data.pendientesCalificacion.length > 0) {
          setPendientesCalificacion(data.pendientesCalificacion);
          
          if (!calificacionModal.open) {
            const primerPendiente = data.pendientesCalificacion[0];
            setCalificacionModal({
              open: true,
              partido: primerPendiente,
              arbitro: primerPendiente.arbitro,
              estrellas: 0,
              comentario: '',
              loading: false
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error al verificar partidos:", error);
    }
  }, [calificacionModal.open, loadGames, loadStats]);

  const openAddModal = useCallback(() => {
    setCurrentGame(initialGame);
    setEditingId(null);
    setModalTitle("Agregar Partido");
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((game: Game) => {
    setCurrentGame({
      name: game?.name || "",
      date: game?.date ? String(game.date).split("T")[0] : "",
      time: game?.time || "",
      location: game?.location || "",
      ubicacionId: (game?.ubicacionId as any)?._id || game?.ubicacionId || "",
    });
    setEditingId(game?._id || null);
    setModalTitle("Editar Partido");
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: GameErrors = {};
    if (!currentGame.name || currentGame.name.trim().length < 3) {
      errors.name = "⚠️ El nombre del partido debe tener al menos 3 caracteres.";
    }
    if (!currentGame.date) errors.date = "⚠️ La fecha es obligatoria.";
    if (!currentGame.time) errors.time = "⚠️ La hora es obligatoria.";
    if (!currentGame.ubicacionId && !currentGame.location) {
      errors.location = "⚠️ Debes seleccionar una ubicación.";
    }
    
    if (Object.keys(errors).length > 0) {
      setGameErrors(errors);
      showWarning('⚠️ Por favor completa todos los campos correctamente.');
      return;
    }
    
    try {
      const gameDateTime = new Date(`${currentGame.date}T${currentGame.time}`);
      if (gameDateTime < new Date()) {
        showWarning('⚠️ No puedes crear o editar un partido con fecha pasada');
        return;
      }
      
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/games/${editingId}` : "/api/games";
      
      const gameToSave = { ...currentGame };
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
      
      showSuccess(editingId ? '✅ Partido actualizado exitosamente' : '✅ Partido creado exitosamente');
      
      setModalOpen(false);
      setEditingId(null);
      setCurrentGame(initialGame);
      setGameErrors({});
      
      await Promise.all([loadGames(), loadStats()]);
    } catch (err) {
      showError(err.message || "❌ Error al conectar con el servidor");
    }
  }, [currentGame, editingId, user, loadGames, loadStats]);

  const handleDelete = useCallback((gameId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '⚽ Eliminar Partido',
      message: '¿Estás seguro de eliminar este partido?\n\nEsta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/games/${gameId}`, { 
            method: "DELETE", 
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
          });
          if (!res.ok) throw new Error("Error al eliminar");
          await Promise.all([loadGames(), loadStats()]);
          showSuccess('✅ Partido eliminado exitosamente');
        } catch (err) {
          showError(err.message || "❌ Error al eliminar el partido");
        }
      }
    });
  }, [loadGames, loadStats]);

  // ============================================
  // ARBITRO FUNCTIONS
  // ============================================
  const openPostulados = useCallback(async (gameId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}/postulados`, { 
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        credentials: "include" 
      });
      const data = await res.json();
      setPostuladosModal({ open: true, postulados: data?.postulados || [], gameId });
    } catch {
      showError("❌ Error al cargar postulados");
    }
  }, []);

  const assignArbitro = useCallback(async (gameId: string, arbitroId: string) => {
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
      loadGames();
    } catch (err) {
      showError(err.message || "❌ Error al asignar");
    }
  }, [loadGames]);

  const loadHistorialArbitro = useCallback(async (arbitro: Arbitro) => {
    setHistorialModal({ open: true, arbitro, historial: [], loading: true });
    
    try {
      const res = await fetch(`/api/games/arbitro/${arbitro._id}/historial`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      if (!res.ok) throw new Error("Error al cargar historial");
      
      const data = await res.json();
      setHistorialModal(prev => ({ 
        ...prev, arbitro: data.arbitro, historial: data.historial || [], loading: false 
      }));
    } catch {
      setHistorialModal(prev => ({ ...prev, loading: false }));
      showError("❌ No se pudo cargar el historial del árbitro");
    }
  }, []);

  const openSustitucionModal = useCallback(async (game: Game) => {
    try {
      const res = await fetch(`/api/games/${game._id}/postulados`, { 
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        credentials: "include" 
      });
      const data = await res.json();
      
      const postuladosDisponibles = (data?.postulados || []).filter(
        (p: Arbitro) => String(p._id) !== String(game.arbitro?._id)
      );
      
      setSustitucionModal({ 
        open: true, 
        gameId: game._id,
        gameName: game.name,
        arbitroActual: game.arbitro || null,
        postulados: postuladosDisponibles,
        nuevoArbitroId: '', 
        razon: '', 
        loading: false 
      });
    } catch (error) {
      logger.error("Error al cargar postulados para sustitución:", error);
      showError("❌ Error al cargar la lista de árbitros disponibles");
    }
  }, []);

  const confirmSustitucion = useCallback(async () => {
    const { gameId, nuevoArbitroId, razon, loading } = sustitucionModal;
    
    if (loading) return;
    if (!nuevoArbitroId) {
      showWarning("⚠️ Por favor, selecciona un árbitro para la sustitución");
      return;
    }
    if (!razon || razon.trim().length < 10) {
      showWarning("⚠️ La razón debe tener al menos 10 caracteres");
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
      if (!res.ok) throw new Error(data.message || "Error al sustituir árbitro");
      
      setSustitucionModal({ 
        open: false, gameId: null, gameName: '', arbitroActual: null,
        postulados: [], nuevoArbitroId: '', razon: '', loading: false 
      });
      
      await loadGames();
      showSuccess(`✅ Sustitución exitosa!`);
    } catch (err) {
      logger.error("Error al sustituir:", err);
      showError(err.message || "❌ Error al conectar con el servidor");
      setSustitucionModal(prev => ({ ...prev, loading: false }));
    }
  }, [sustitucionModal, loadGames]);

  const confirmDesasignacion = useCallback(async () => {
    const { gameId, razon, loading } = sustitucionModal;
    
    if (loading) return;
    if (!razon || razon.trim().length < 10) {
      showWarning("⚠️ La razón debe tener al menos 10 caracteres");
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: '⚠️ Desasignar Árbitro',
      message: '¿Estás seguro de desasignar al árbitro?',
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
          if (!res.ok) throw new Error(data.message || `Error del servidor (${res.status})`);
          
          setSustitucionModal({ 
            open: false, gameId: null, gameName: '', arbitroActual: null,
            postulados: [], nuevoArbitroId: '', razon: '', loading: false 
          });
          
          await loadGames();
          showSuccess(`✅ Desasignación exitosa!`);
        } catch (err) {
          logger.error("Error al desasignar:", err);
          showError(`❌ Error al desasignar árbitro: ${err.message}`);
          setSustitucionModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  }, [sustitucionModal, loadGames]);

  // ============================================
  // CALIFICACION FUNCTIONS
  // ============================================
  const abrirModalCalificacion = useCallback((partido: any) => {
    setCalificacionModal({
      open: true,
      partido: partido,
      arbitro: partido.arbitro,
      estrellas: 0,
      comentario: '',
      loading: false
    });
  }, []);

  const calificarArbitro = useCallback(async () => {
    const { partido, arbitro, estrellas, comentario } = calificacionModal;
    
    if (estrellas === 0) {
      showWarning('⚠️ Por favor selecciona una calificación de 1 a 5 estrellas');
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
          partidoId: partido?._id,
          arbitroId: arbitro?._id,
          estrellas,
          comentario: comentario.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al calificar árbitro');

      showSuccess(`✅ Calificación registrada exitosamente!`);

      setCalificacionModal({
        open: false, partido: null, arbitro: null, estrellas: 0, comentario: '', loading: false
      });

      setPendientesCalificacion(prev => prev.filter(p => p._id !== partido?._id));

      const restantes = pendientesCalificacion.filter(p => p._id !== partido?._id);
      if (restantes.length > 0) {
        setTimeout(() => abrirModalCalificacion(restantes[0]), 500);
      }
    } catch (error) {
      logger.error('Error al calificar:', error);
      showError(`❌ Error al calificar árbitro: ${error.message}`);
      setCalificacionModal(prev => ({ ...prev, loading: false }));
    }
  }, [calificacionModal, pendientesCalificacion, abrirModalCalificacion]);

  // ============================================
  // UBICACIONES FUNCTIONS
  // ============================================
  const loadUbicaciones = useCallback(async () => {
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
  }, []);

  const openUbicacionModal = useCallback(async (ubicacion: Ubicacion | null = null) => {
    if (ubicacion) {
      let direccion = ubicacion.direccion || '';
      
      if (!direccion && ubicacion.latitud && ubicacion.longitud) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${ubicacion.latitud}&lon=${ubicacion.longitud}`
          );
          const data = await response.json();
          if (data && data.display_name) direccion = data.display_name;
        } catch (error) {
          logger.error('Error obteniendo dirección:', error);
        }
      }
      
      setUbicacionModal({ 
        open: true, nombre: ubicacion.nombre, direccion,
        latitud: ubicacion.latitud || null, longitud: ubicacion.longitud || null,
        googleMapsUrl: '', saving: false, editingId: ubicacion._id, marcadorColocado: true
      });
    } else {
      setUbicacionModal({ 
        open: true, nombre: '', direccion: '', latitud: null, longitud: null,
        googleMapsUrl: '', saving: false, editingId: null, marcadorColocado: false
      });
    }
  }, []);

  const saveUbicacion = useCallback(async () => {
    if (!ubicacionModal.nombre.trim()) {
      showWarning('⚠️ Por favor ingresa el nombre de la cancha');
      return;
    }
    if (!ubicacionModal.direccion || ubicacionModal.direccion.trim().length < 10) {
      showWarning('⚠️ Por favor ingresa una dirección completa');
      return;
    }
    if (!ubicacionModal.latitud || !ubicacionModal.longitud) {
      showWarning('⚠️ Por favor haz clic en el mapa para marcar la ubicación');
      return;
    }
    if (!ubicacionModal.marcadorColocado) {
      showWarning('⚠️ Por favor confirma la ubicación antes de guardar');
      return;
    }

    const nombreExistente = ubicaciones.some(
      ub => ub.nombre.toLowerCase().trim() === ubicacionModal.nombre.toLowerCase().trim() 
            && ub._id !== ubicacionModal.editingId
    );

    if (nombreExistente) {
      showError(`❌ Ya existe una ubicación con el nombre "${ubicacionModal.nombre}"`);
      return;
    }

    setUbicacionModal(prev => ({ ...prev, saving: true }));

    try {
      const token = localStorage.getItem("token");
      const isEditing = ubicacionModal.editingId;
      const url = isEditing ? `/api/ubicaciones/${ubicacionModal.editingId}` : "/api/ubicaciones";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: ubicacionModal.nombre.trim(),
          direccion: ubicacionModal.direccion.trim(),
          latitud: ubicacionModal.latitud,
          longitud: ubicacionModal.longitud,
          googleMapsUrl: `https://www.google.com/maps?q=${ubicacionModal.latitud},${ubicacionModal.longitud}`,
          canchaId: user?.canchaAsignada?._id
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        showError(data.message || "❌ Error al guardar ubicación");
        setUbicacionModal(prev => ({ ...prev, saving: false }));
        return;
      }

      await Promise.all([loadUbicaciones(), loadGames()]);
      
      setUbicacionModal({ 
        open: false, nombre: '', direccion: '', latitud: null, longitud: null,
        googleMapsUrl: '', saving: false, editingId: null, marcadorColocado: false 
      });
      showSuccess(isEditing ? '✅ Ubicación actualizada' : '✅ Ubicación agregada');
    } catch (error) {
      logger.error("Error al guardar ubicación:", error);
      showError('❌ Error al guardar la ubicación');
      setUbicacionModal(prev => ({ ...prev, saving: false }));
    }
  }, [ubicacionModal, ubicaciones, user, loadUbicaciones, loadGames]);

  const deleteUbicacion = useCallback((ubicacionId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '🗑️ Eliminar Ubicación',
      message: '¿Estás seguro de eliminar esta ubicación?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`/api/ubicaciones/${ubicacionId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (!res.ok) throw new Error("Error al eliminar ubicación");

          await loadUbicaciones();
          showSuccess('✅ Ubicación eliminada exitosamente');
        } catch (error) {
          logger.error("Error al eliminar ubicación:", error);
          showError('❌ Error al eliminar la ubicación');
        }
      }
    });
  }, [loadUbicaciones]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const formatDate = useCallback((input: string | Date | null) => {
    if (!input) return "";
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
      const [y, m, d] = input.split("T")[0].split("-");
      return `${d}/${m}/${y}`;
    }
    const date = new Date(input);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-MX");
  }, []);

  const formatTime = useCallback((time: string | null) => {
    if (!time) return "";
    const [hStr, m] = String(time).split(":");
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }, []);

  const haIniciado = useCallback((game: Game) => {
    try {
      if (!game.date || !game.time) return false;

      let fechaPartido: Date;
      
      if (game.date.includes('/')) {
        const [dia, mes, ano] = game.date.split('/').map(Number);
        const [hora, minutos] = game.time.split(':').map(Number);
        fechaPartido = new Date(ano, mes - 1, dia, hora, minutos);
      } else if (game.date.includes('-')) {
        fechaPartido = new Date(game.date + 'T' + game.time);
      } else {
        fechaPartido = new Date(game.date + ' ' + game.time);
      }
      
      if (isNaN(fechaPartido.getTime())) return false;
      
      return new Date() >= fechaPartido;
    } catch {
      return false;
    }
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const hasGames = games?.length > 0;

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [games]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    const handleFocus = () => loadUserData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadUserData]);

  useEffect(() => {
    loadGames();
    loadStats();
    loadUbicaciones();
    verificarPartidosFinalizados();
    
    const intervalo = setInterval(() => {
      verificarPartidosFinalizados();
    }, 30000);
    
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map effect
  useEffect(() => {
    if (!ubicacionModal.open) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      const mapElement = document.getElementById('ubicacion-map');
      if (!mapElement) return;

      if (mapRef.current) {
        if (ubicacionModal.latitud && ubicacionModal.longitud) {
          mapRef.current.setView([ubicacionModal.latitud, ubicacionModal.longitud], 16);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([ubicacionModal.latitud, ubicacionModal.longitud]);
          } else {
            const marker = window.L.marker([ubicacionModal.latitud, ubicacionModal.longitud], { draggable: true }).addTo(mapRef.current);
            markerRef.current = marker;
            
            marker.on('dragend', function(e: any) {
              const pos = e.target.getLatLng();
              setUbicacionModal(prev => ({ ...prev, latitud: pos.lat, longitud: pos.lng, marcadorColocado: false }));
            });
          }
        }
        return;
      }

      const map = window.L.map('ubicacion-map').setView([19.2433, -103.7250], 13);
      mapRef.current = map;

      window.L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Maps'
      }).addTo(map);

      if (ubicacionModal.latitud && ubicacionModal.longitud) {
        map.setView([ubicacionModal.latitud, ubicacionModal.longitud], 16);
        const marker = window.L.marker([ubicacionModal.latitud, ubicacionModal.longitud], { draggable: true }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', function(e: any) {
          const pos = e.target.getLatLng();
          setUbicacionModal(prev => ({ ...prev, latitud: pos.lat, longitud: pos.lng, marcadorColocado: false }));
        });
      }

      map.on('click', function(e: any) {
        const { lat, lng } = e.latlng;
        
        if (markerRef.current) markerRef.current.remove();

        const marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        setUbicacionModal(prev => ({ ...prev, latitud: lat, longitud: lng, marcadorColocado: false }));

        marker.on('dragend', function(evt: any) {
          const pos = evt.target.getLatLng();
          setUbicacionModal(prev => ({ ...prev, latitud: pos.lat, longitud: pos.lng, marcadorColocado: false }));
        });
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [ubicacionModal.open, ubicacionModal.latitud, ubicacionModal.longitud]);

  return {
    // State
    games,
    loading,
    user,
    stats,
    ubicaciones,
    hasGames,
    sortedGames,
    pendientesCalificacion,
    
    // Modal States
    modalOpen, setModalOpen,
    modalTitle,
    currentGame, setCurrentGame,
    editingId,
    gameErrors, setGameErrors,
    postuladosModal, setPostuladosModal,
    historialModal, setHistorialModal,
    reporteModal, setReporteModal,
    arbitroDetalleModal, setArbitroDetalleModal,
    sustitucionModal, setSustitucionModal,
    calificacionModal, setCalificacionModal,
    ubicacionModal, setUbicacionModal,
    confirmModal, setConfirmModal,
    
    // User Actions
    logout,
    
    // Game Actions
    openAddModal,
    openEditModal,
    handleSave,
    handleDelete,
    loadGames,
    loadStats,
    
    // Arbitro Actions
    openPostulados,
    assignArbitro,
    loadHistorialArbitro,
    openSustitucionModal,
    confirmSustitucion,
    confirmDesasignacion,
    
    // Calificacion Actions
    abrirModalCalificacion,
    calificarArbitro,
    
    // Ubicacion Actions
    openUbicacionModal,
    saveUbicacion,
    deleteUbicacion,
    loadUbicaciones,
    
    // Utilities
    formatDate,
    formatTime,
    haIniciado,
    
    // Refs
    mapRef,
    markerRef,
  };
}
