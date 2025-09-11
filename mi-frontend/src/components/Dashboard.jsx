import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [user, setUser] = useState({ 
    nombre: "Usuario", 
    userId: "", 
    imagenPerfil: null,
    email: "",
    contacto: "",
    experiencia: ""
  });
  const [applyModal, setApplyModal] = useState({ open: false, gameId: null });
  const [cancelModal, setCancelModal] = useState({ open: false, gameId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canchas, setCanchas] = useState([]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState("todas");

  useEffect(() => {
    loadUser();
    loadCanchas();
    loadGames();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCanchas() {
    try {
      console.log("Intentando cargar canchas desde /api/canchas");
      const res = await fetch("/api/canchas", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Canchas cargadas correctamente:", data);
        setCanchas(data);
      } else {
        console.log("Error al cargar canchas, status:", res.status);
        // Intentar fallback sin /api/
        try {
          console.log("Intentando fallback: /canchas");
          const fallbackRes = await fetch("/canchas", {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            console.log("Canchas cargadas desde fallback:", fallbackData);
            setCanchas(fallbackData);
          } else {
            console.log("Fallback también falló, status:", fallbackRes.status);
            // Si también falla, usar una cancha por defecto
            setCanchas([{
              _id: "default-golwin",
              nombre: "Estadio Golwin",
              direccion: "Av. Deportiva #123, Ciudad"
            }]);
          }
        } catch (fallbackError) {
          console.error("Error en fallback de canchas:", fallbackError);
          // Usar cancha por defecto si todo falla
          setCanchas([{
            _id: "default-golwin",
            nombre: "Estadio Golwin",
            direccion: "Av. Deportiva #123, Ciudad"
          }]);
        }
      }
    } catch (error) {
      console.error("Error al cargar canchas:", error);
      // Usar cancha por defecto si todo falla
      setCanchas([{
        _id: "default-golwin",
        nombre: "Estadio Golwin",
        direccion: "Av. Deportiva #123, Ciudad"
      }]);
    }
  }

  async function loadUser() {
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
            // Si tiene role arbitro o no tiene role, permitir acceso
            if (data.role === 'arbitro' || !data.role) {
              setUser({ 
                nombre: data.nombre || "Usuario", 
                userId: data.userId, 
                imagenPerfil: data.imagenPerfil,
                email: data.email || "",
                contacto: data.contacto || "",
                experiencia: data.experiencia || "",
                role: data.role || "arbitro" // Default a árbitro si no hay role
              });
              return; // Salir si todo está bien
            } else {
              console.log("Usuario no es árbitro, redirigiendo...");
              if (data.role === 'organizador') {
                window.location.href = "/dashboard-organizador";
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
        setUser(prev => ({ 
          ...prev,
          userId: userId,
          email: userEmail || prev.email
        }));
      } else {
        // Si no hay datos ni en servidor ni local, redirigir a login
        console.error("No se pudo obtener información del usuario");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error al cargar datos de usuario:", error);
      // No redirigimos automáticamente para evitar ciclos de redirección
    }
  }

  async function loadGames(canchaFiltro = canchaSeleccionada) {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = canchaFiltro === "todas" 
        ? "/api/games" 
        : `/api/games?cancha=${canchaFiltro}`;
      
      console.log("Cargando partidos desde:", url);
      
      const res = await fetch(url, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`Error al cargar partidos: ${res.status} ${await res.text()}`);
      }
      
      const data = await res.json();
      console.log("Partidos obtenidos:", data);
      
      setGames(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error en loadGames:", error);
      setError(`Error al cargar los partidos: ${error.message}`);
      
      // Intento alternativo sin /api/ como fallback
      try {
        const token = localStorage.getItem("token");
        const fallbackUrl = canchaFiltro === "todas" 
          ? "/games" 
          : `/games?cancha=${canchaFiltro}`;
        
        console.log("Intentando fallback:", fallbackUrl);
        
        const fallbackRes = await fetch(fallbackUrl, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          credentials: 'include'
        });
        
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          console.log("Partidos obtenidos desde fallback:", fallbackData);
          setGames(Array.isArray(fallbackData) ? fallbackData : []);
          setError(""); // Limpiar error si el fallback fue exitoso
        }
      } catch (fallbackError) {
        console.error("También falló el fallback:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleCanchaChange = (canchaId) => {
    setCanchaSeleccionada(canchaId);
    loadGames(canchaId);
  };

  function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  }

  function formatTime(time) {
    if (!time) return "";
    let [hours, minutes] = String(time).split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(minutes).padStart(2, "0")} ${ampm}`;
  }

  function getButtonState(game) {
    const userId = user.userId;
    if (game.arbitro && String(game.arbitro._id) === String(userId)) 
      return { text: "Aceptado", color: "bg-green-500 hover:bg-green-600", disabled: true, cancel: false };
    if (game.arbitro && String(game.arbitro._id) !== String(userId)) {
      if (game.postulados && game.postulados.includes(userId)) 
        return { text: "Rechazado", color: "bg-red-500", disabled: true, cancel: false };
      return { text: "Árbitro asignado", color: "bg-gray-500", disabled: true, cancel: false };
    }
    if (game.postulados && game.postulados.includes(userId) && !game.arbitro) 
      return { text: "Postulado", color: "bg-yellow-500 hover:bg-yellow-600", disabled: true, cancel: true };
    if (game.postulados && game.postulados.length >= 5 && !game.postulados.includes(userId)) 
      return { text: "Cupo Lleno", color: "bg-red-500", disabled: true, cancel: false };
    return { text: "Postularse", color: "bg-primary-500 hover:bg-primary-600", disabled: false, cancel: false };
  }

  async function handleApply(gameId) { setApplyModal({ open: true, gameId }); }

  async function confirmApply() {
    try {
      const res = await fetch(`/api/games/${applyModal.gameId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        credentials: "include",
      });
      const result = await res.json();
      alert(result.message);
      setApplyModal({ open: false, gameId: null });
      loadGames();
    } catch {
      alert("Ocurrió un error. Intenta nuevamente.");
    }
  }

  function handleCancelPostulation(gameId) { setCancelModal({ open: true, gameId }); }

  async function confirmCancelPostulation() {
    try {
      const res = await fetch("/api/games/cancel-postulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: cancelModal.gameId, userId: user.userId }),
      });
      const data = await res.json();
      alert(data.message);
      setCancelModal({ open: false, gameId: null });
      loadGames();
    } catch {
      alert("Hubo un problema al cancelar la postulación.");
    }
  }

  async function logout() {
    // Intentamos hacer logout en el servidor, pero no bloqueamos si falla
    try {
      const res = await fetch("/api/usuarios/logout", { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Respuesta del servidor al cerrar sesión:", data.message);
      }
    } catch (error) {
      console.error("Error al cerrar sesión (no bloqueante):", error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="container mx-auto">
          <div className="flex items-center justify-between py-4">
            {/* Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-gray-800">RefZone</h1>
                  <p className="text-sm text-gray-600">Panel de Árbitro</p>
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <img 
                    src={user.imagenPerfil || "/img/perfil1.png"} 
                    alt="Perfil" 
                    className="w-10 h-10 rounded-full border-2 border-primary-200 object-cover cursor-pointer transition-all duration-200 hover:border-primary-400 hover:shadow-md"
                    onClick={() => navigate('/edit-profile')}
                  />
                  {/* Indicador de edición */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-200">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800">¡Hola! {user.nombre}</p>
                  <p className="text-xs text-gray-600">Árbitro Certificado</p>
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
      <main className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">Partidos Disponibles</h2>
              <p className="text-gray-600">Encuentra y postúlate a los partidos de fútbol 7 que mejor se adapten a tu horario</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button 
                onClick={loadGames}
                className="btn btn-outline"
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                )}
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Filtro de Canchas */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg border p-4">
            <div className="mb-3 sm:mb-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Filtrar por Cancha</h3>
              <p className="text-sm text-gray-600">Selecciona una cancha específica o ve todos los partidos</p>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
              </svg>
              <select 
                value={canchaSeleccionada}
                onChange={(e) => handleCanchaChange(e.target.value)}
                className="select select-bordered w-full max-w-xs"
              >
                <option value="todas">🏟️ Todas las canchas</option>
                {canchas.map(cancha => (
                  <option key={cancha._id} value={cancha._id}>
                    🏟️ {cancha.nombre}
                  </option>
                ))}
              </select>
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

        {/* Content Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Games Table */}
            <div className="lg:col-span-3">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-display font-semibold text-gray-800">Lista de Partidos</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {games.length} partidos disponibles
                  </p>
                </div>
                <div className="card-body p-0">
                  {games.length === 0 ? (
                    <div className="p-12 text-center">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No hay partidos disponibles</h4>
                      <p className="text-gray-600">Los partidos aparecerán aquí cuando se publiquen nuevas oportunidades</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Fecha y Hora</th>
                            <th>Nombre del Partido</th>
                            <th>Cancha</th>
                            <th>Ubicación</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {games.map((game) => {
                            const btn = getButtonState(game);
                            return (
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
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                      </svg>
                                    </div>
                                    {console.log("Cancha del partido:", game.canchaId)}
                                    <span className="text-sm font-medium text-blue-700">
                                      {game.canchaId && game.canchaId.nombre ? 
                                        game.canchaId.nombre : 
                                        "Estadio Golwin"}
                                    </span>
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
                                  {game.arbitro ? (
                                    <span className="badge badge-success">Árbitro Asignado</span>
                                  ) : (
                                    <span className="badge badge-warning">Buscando Árbitro</span>
                                  )}
                                </td>
                                <td>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      className={`btn btn-sm text-white ${btn.color} transition-all duration-200`}
                                      disabled={btn.disabled}
                                      onClick={btn.text === "Postularse" ? () => handleApply(game._id) : undefined}
                                    >
                                      {btn.text}
                                    </button>
                                    {btn.cancel && (
                                      <button 
                                        className="btn btn-sm btn-danger" 
                                        onClick={() => handleCancelPostulation(game._id)}
                                      >
                                        Cancelar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tips Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-display font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    Consejos para Árbitros
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-gray-800 mb-2">Preparación Mental</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Mantén la calma bajo presión</li>
                        <li>• Comunica claramente con jugadores</li>
                        <li>• Conoce las reglas a fondo</li>
                      </ul>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-800 mb-2">Posicionamiento</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Ubícate eficazmente para seguir el juego</li>
                        <li>• Gestiona el ritmo del partido</li>
                        <li>• Mantén la vista en la pelota</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules Quick Reference */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-display font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    Reglas Rápidas
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <h5 className="font-medium text-red-800 mb-1">Mano</h5>
                      <p className="text-sm text-red-700">Contacto intencional mano/brazo-balón es falta</p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-1">Saque de banda</h5>
                      <p className="text-sm text-blue-700">Ambos pies deben estar en el suelo</p>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h5 className="font-medium text-yellow-800 mb-1">Tarjetas</h5>
                      <p className="text-sm text-yellow-700">Faltas graves ⇒ amarilla/roja</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-display font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    Soporte
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong className="text-gray-800">Teléfono:</strong>
                      <p className="text-gray-600">+52 312 100 1096</p>
                    </div>
                    <div>
                      <strong className="text-gray-800">Email:</strong>
                      <p className="text-gray-600">contacto@refzone.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {applyModal.open && (
        <div className="modal-overlay" onClick={() => setApplyModal({ open: false, gameId: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-display font-semibold text-gray-800">Confirmar Postulación</h3>
            </div>
            <div className="modal-body">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-medium">¿Deseas postularte para este partido?</p>
                  <p className="text-sm text-gray-600">Una vez confirmado, el organizador podrá contactarte</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={confirmApply}>
                Confirmar Postulación
              </button>
              <button className="btn btn-ghost" onClick={() => setApplyModal({ open: false, gameId: null })}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModal.open && (
        <div className="modal-overlay" onClick={() => setCancelModal({ open: false, gameId: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-display font-semibold text-gray-800">Cancelar Postulación</h3>
            </div>
            <div className="modal-body">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-medium">¿Estás seguro de cancelar tu postulación?</p>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={confirmCancelPostulation}>
                Sí, Cancelar
              </button>
              <button className="btn btn-ghost" onClick={() => setCancelModal({ open: false, gameId: null })}>
                No, Mantener
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

