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
  const [reporteModal, setReporteModal] = useState({ open: false, mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

  const [stats, setStats] = useState({ total: 0, upcoming: 0, needsReferee: 0 });
  const [user, setUser] = useState(null);

  // Verificar sesión
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/usuarios/check-session", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          credentials: "include",
        });
        const data = await res.json();
        if (data?.userId) setUser(data);
        else window.location.href = "/";
      } catch {
        window.location.href = "/";
      }
    })();
  }, []);

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
      const res = await fetch("/api/games", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        credentials: "include",
      });
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (error) { 
      console.error("Error al cargar los partidos:", error); 
      setGames([]);
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
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        credentials: "include",
        body: JSON.stringify(currentGame),
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
    fetch("/api/usuarios/logout", { 
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      credentials: "include" 
    }).finally(() => {
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  }

  async function descargarReportePDF(mes = null, ano = null) {
    try {
      // Si no se proporcionan mes/año, usar los del modal o fecha actual
      const mesReporte = mes || reporteModal.mes;
      const anoReporte = ano || reporteModal.ano;
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert('No tienes autorización. Por favor inicia sesión nuevamente.');
        return;
      }
      
      // Construir URL del reporte con token
      const reporteUrl = `/api/games/reporte-pdf?mes=${mesReporte}&ano=${anoReporte}&token=${token}`;
      
      // Abrir en nueva pestaña
      window.open(reporteUrl, '_blank');
      
      // Cerrar modal
      setReporteModal({ ...reporteModal, open: false });
      
      console.log('Reporte abierto en nueva pestaña');
    } catch (error) {
      console.error('Error al abrir reporte:', error);
      alert('Error al generar el reporte. Inténtalo de nuevo.');
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
                  <p className="text-sm text-gray-600">Panel de Organizador</p>
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
        <div className="modal-overlay" onClick={() => setReporteModal({ ...reporteModal, open: false })}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-display font-semibold text-gray-800">Generar Reporte PDF</h3>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setReporteModal({ ...reporteModal, open: false })}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
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
            </div>
            <div className="modal-footer">
              <div className="flex justify-end space-x-3">
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
                  Ver Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

