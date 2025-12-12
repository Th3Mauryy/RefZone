import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';
import { showSuccess, showError } from '../utils/toast';
import { 
  Cancha, 
  Ubicacion, 
  DashboardUser, 
  ButtonState,
  GameWithCancha 
} from '../types';

interface UseDashboardReturn {
  // State
  games: GameWithCancha[];
  user: DashboardUser;
  loading: boolean;
  canchas: Cancha[];
  ubicaciones: Ubicacion[];
  canchaSeleccionada: string;
  applyingGames: Set<string>;
  
  // Actions
  loadGames: (canchaFiltro?: string) => Promise<void>;
  handleCanchaChange: (canchaId: string) => void;
  handleApply: (gameId: string) => Promise<void>;
  handleCancelPostulation: (gameId: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Helpers
  formatDate: (date: string | undefined) => string;
  formatTime: (time: string | undefined) => string;
  getButtonState: (game: GameWithCancha) => ButtonState;
}

export function useDashboard(): UseDashboardReturn {
  const [games, setGames] = useState<GameWithCancha[]>([]);
  const [user, setUser] = useState<DashboardUser>({ 
    nombre: "Usuario", 
    userId: "", 
    imagenPerfil: null,
    email: "",
    contacto: "",
    experiencia: ""
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [applyingGames, setApplyingGames] = useState<Set<string>>(new Set());
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<string>("todas");
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  // ============================================
  // LOADERS
  // ============================================
  const loadCanchas = useCallback(async (): Promise<void> => {
    try {
      logger.log("Intentando cargar canchas desde /api/canchas");
      const res = await fetch("/api/canchas", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        logger.log("Canchas cargadas correctamente:", data);
        setCanchas(data);
      } else {
        // Fallback
        const fallbackRes = await fetch("/canchas", {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (fallbackRes.ok) {
          setCanchas(await fallbackRes.json());
        } else {
          setCanchas([{
            _id: "default-golwin",
            nombre: "Cancha Golwin",
            direccion: "Av. Deportiva #123, Ciudad",
            logo: null,
            activa: true
          }]);
        }
      }
    } catch (error) {
      logger.error("Error al cargar canchas:", error);
      setCanchas([{
        _id: "default-golwin",
        nombre: "Cancha Golwin",
        direccion: "Av. Deportiva #123, Ciudad",
        logo: null,
        activa: true
      }]);
    }
  }, []);

  const loadUbicaciones = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch("/api/ubicaciones", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        logger.log("🗺️ Ubicaciones cargadas:", data);
        setUbicaciones(data || []);
      }
    } catch (error) {
      logger.error("❌ Error al cargar ubicaciones:", error);
    }
  }, []);

  const loadUser = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        logger.error("No hay token disponible");
        window.location.href = "/";
        return;
      }
      
      const res = await fetch("/api/usuarios/check-session", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data?.userId) {
          if (data.role === 'arbitro' || !data.role) {
            setUser({ 
              nombre: data.nombre || "Usuario", 
              userId: data.userId, 
              imagenPerfil: data.imagenPerfil,
              email: data.email || "",
              contacto: data.contacto || "",
              experiencia: data.experiencia || "",
              role: data.role || "arbitro"
            });
            return;
          } else if (data.role === 'organizador') {
            window.location.href = "/dashboard-organizador";
            return;
          }
        }
      } else if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        
        showError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        setTimeout(() => { window.location.href = "/"; }, 2000);
        return;
      }
      
      // Fallback a datos locales
      const userId = localStorage.getItem("userId");
      const userEmail = localStorage.getItem("userEmail");
      
      if (userId) {
        setUser(prev => ({ 
          ...prev,
          userId,
          email: userEmail || prev.email
        }));
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      logger.error("Error al cargar datos de usuario:", error);
    }
  }, []);

  const loadGames = useCallback(async (canchaFiltro: string = canchaSeleccionada): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = canchaFiltro === "todas" 
        ? "/api/games" 
        : `/api/games?cancha=${canchaFiltro}`;
      
      const res = await fetch(url, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error("Error en loadGames:", error);
      
      // Fallback
      try {
        const token = localStorage.getItem("token");
        const fallbackUrl = canchaFiltro === "todas" ? "/games" : `/games?cancha=${canchaFiltro}`;
        const fallbackRes = await fetch(fallbackUrl, { 
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        
        if (fallbackRes.ok) {
          setGames(await fallbackRes.json());
        }
      } catch {
        logger.error("Fallback también falló");
      }
    } finally {
      setLoading(false);
    }
  }, [canchaSeleccionada]);

  // ============================================
  // ACTIONS
  // ============================================
  const handleCanchaChange = useCallback((canchaId: string): void => {
    setCanchaSeleccionada(canchaId);
    loadGames(canchaId);
  }, [loadGames]);

  const handleApply = useCallback(async (gameId: string): Promise<void> => {
    if (applyingGames.has(gameId)) return;
    
    try {
      setApplyingGames(prev => new Set(prev).add(gameId));
      
      const res = await fetch(`/api/games/${gameId}/apply`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
      });
      
      const result = await res.json();
      
      if (res.ok) {
        showSuccess(result.message || "✅ Te has postulado exitosamente al partido");
        await loadGames();
        return;
      }
      
      showError(result.message || "Error al postularse");
    } catch {
      showError("Ocurrió un error. Intenta nuevamente.");
    } finally {
      setApplyingGames(prev => {
        const newSet = new Set(prev);
        newSet.delete(gameId);
        return newSet;
      });
    }
  }, [applyingGames, loadGames]);

  const handleCancelPostulation = useCallback(async (gameId: string, userId: string): Promise<void> => {
    try {
      const res = await fetch("/api/games/cancel-postulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, userId }),
      });
      const data = await res.json();
      showSuccess(data.message || "✅ Postulación cancelada exitosamente");
      loadGames();
    } catch {
      showError("Hubo un problema al cancelar la postulación.");
    }
  }, [loadGames]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/usuarios/logout", { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include"
      });
    } catch (error) {
      logger.error("Error al cerrar sesión (no bloqueante):", error);
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
  // HELPERS
  // ============================================
  const formatDate = useCallback((date: string | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  }, []);

  const formatTime = useCallback((time: string | undefined): string => {
    if (!time) return "";
    const [hours, minutes] = String(time).split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(minutes).padStart(2, "0")} ${ampm}`;
  }, []);

  const getButtonState = useCallback((game: GameWithCancha): ButtonState => {
    const userId = user.userId;
    const arbitroId = game.arbitro && typeof game.arbitro === 'object' ? game.arbitro._id : null;
    const postulados = Array.isArray(game.postulados) 
      ? game.postulados.map(p => typeof p === 'string' ? p : p._id) 
      : [];
    
    if (arbitroId && String(arbitroId) === String(userId)) 
      return { text: "Aceptado", color: "bg-green-500 hover:bg-green-600", disabled: true, cancel: false };
    if (arbitroId && String(arbitroId) !== String(userId)) {
      if (postulados.includes(userId)) 
        return { text: "Rechazado", color: "bg-red-500", disabled: true, cancel: false };
      return { text: "Árbitro asignado", color: "bg-gray-500", disabled: true, cancel: false };
    }
    if (postulados.includes(userId) && !arbitroId) 
      return { text: "Postulado", color: "bg-yellow-500 hover:bg-yellow-600", disabled: true, cancel: true };
    if (postulados.length >= 5 && !postulados.includes(userId)) 
      return { text: "Cupo Lleno", color: "bg-red-500", disabled: true, cancel: false };
    return { text: "Postularse", color: "bg-primary-500 hover:bg-primary-600", disabled: false, cancel: false };
  }, [user.userId]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    loadUser();
    loadCanchas();
    loadGames();
    loadUbicaciones();
  }, [loadUser, loadCanchas, loadGames, loadUbicaciones]);

  return {
    games,
    user,
    loading,
    canchas,
    ubicaciones,
    canchaSeleccionada,
    applyingGames,
    loadGames,
    handleCanchaChange,
    handleApply,
    handleCancelPostulation,
    logout,
    formatDate,
    formatTime,
    getButtonState,
  };
}
