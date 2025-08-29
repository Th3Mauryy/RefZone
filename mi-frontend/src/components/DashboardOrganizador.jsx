// File: /src/components/DashboardOrganizador.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../styles/dashboardOrganizador.css";

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
    (async () => {
      try {
        const res = await fetch("/api/games/stats", { credentials: "include" });
        const data = await res.json();
        setStats({
          total: Number(data?.total) || 0,
          upcoming: Number(data?.upcoming) || 0,
          needsReferee: Number(data?.needsReferee) || 0,
        });
      } catch {
        setStats({ total: 0, upcoming: 0, needsReferee: 0 });
      }
    })();
  }, []);

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
    } catch (error) { console.error("Error al cargar los partidos:", error); setGames([]); } 
     finally {
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(currentGame),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Error al guardar el partido");
      setModalOpen(false);
      setEditingId(null);
      setCurrentGame(initialGame);
      await loadGames();
    } catch (err) {
      alert(err.message || "Error al conectar con el servidor");
    }
  }

  async function handleDelete(gameId) {
    if (!window.confirm("¿Eliminar este partido?")) return;
    try {
      const res = await fetch(`/api/games/${gameId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Error al eliminar el partido");
      setGames((prev) => prev.filter((g) => g._id !== gameId));
      setStats((s) => ({ ...s, total: Math.max(0, s.total - 1) }));
    } catch (err) {
      alert(err.message || "Error al conectar con el servidor");
    }
  }

  async function openPostulados(gameId) {
    try {
      const res = await fetch(`/api/games/${gameId}/postulados`, { credentials: "include" });
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
        headers: { "Content-Type": "application/json" },
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
    fetch("/api/usuarios/logout", { credentials: "include" }).finally(() => {
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      window.location.href = "/";
    });
  }

  const hasGames = games?.length > 0;

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [games]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/img/logo.png" alt="Logo" className="brand__logo" />

          <div className="profile">
            <img className="profile__pic" src="/img/perfil1.png" alt="Perfil" />
            <div className="profile__meta">
              <span className="profile__name">{user?.name || "Admin"}</span>
              <button className="btn btn--ghost" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <h1 className="page-title">Gestión de partidos</h1>
        <button className="btn btn--primary" onClick={openAddModal}>
            Agregar partido
          </button>
        {error && <div className="alert alert--error">{error}</div>}
        {loading && <div className="skeleton" aria-hidden="true" />}

        {!loading && (
          <section className="card">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th>Nombre</th>
                    <th>Ubicación</th>
                    <th>Árbitro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasGames && (
                    <tr>
                      <td colSpan={5} className="table__empty">No hay partidos registrados.</td>
                    </tr>
                  )}

                  {sortedGames.map((game) => (
                    <tr key={game._id}>
                      <td data-label="Fecha y hora">
                        <div className="chip-row">
                          <span className="text-strong">{formatDate(game.date)}</span>
                          <span className="chip">{formatTime(game.time)}</span>
                        </div>
                      </td>
                      <td data-label="Nombre">{game.name}</td>
                      <td data-label="Ubicación">{game.location}</td>
                      <td data-label="Árbitro">
                        {game.arbitro ? (
                          <span className="badge badge--success">{game.arbitro.nombre || game.arbitro.email}</span>
                        ) : (
                          <span className="badge">Sin asignar</span>
                        )}
                      </td>
                      <td data-label="Acciones">
                        <div className="btn-group">
                          <button className="btn btn--sm" onClick={() => openEditModal(game)}>Editar</button>
                          <button className="btn btn--sm btn--danger" onClick={() => handleDelete(game._id)}>Eliminar</button>
                          {!game.arbitro && (
                            <button className="btn btn--sm btn--outline" onClick={() => openPostulados(game._id)}>
                              Ver postulados
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <StatsCards total={stats.total} upcoming={stats.upcoming} needsReferee={stats.needsReferee} />
      </main>

      <footer className="site-footer">
        <div className="container footer__grid">
          <div>
            <strong>Contacto</strong>
            <p>Tel: +52 312 100 1096</p>
            <p>Email: contacto@refzone.com</p>
          </div>
          <div>
            <strong>Redes</strong>
            <p>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a> ·
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"> Instagram</a> ·
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"> Twitter</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Modal agregar/editar */}
      {modalOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={() => setModalOpen(false)}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" aria-label="Cerrar" onClick={() => setModalOpen(false)}>×</button>
            <h2 id="modal-title" className="modal__title">{modalTitle}</h2>
            <form className="form" onSubmit={handleSave}>
              <label className="form__field">
                <span>Nombre del partido</span>
                <input
                  type="text"
                  value={currentGame.name}
                  onChange={(e) => setCurrentGame({ ...currentGame, name: e.target.value })}
                  required
                />
              </label>
              <div className="form__grid">
                <label className="form__field">
                  <span>Fecha</span>
                  <input
                    type="date"
                    value={currentGame.date}
                    onChange={(e) => setCurrentGame({ ...currentGame, date: e.target.value })}
                    required
                  />
                </label>
                <label className="form__field">
                  <span>Hora</span>
                  <input
                    type="time"
                    value={currentGame.time}
                    onChange={(e) => setCurrentGame({ ...currentGame, time: e.target.value })}
                    required
                  />
                </label>
              </div>
              <label className="form__field">
                <span>Ubicación</span>
                <input
                  type="text"
                  value={currentGame.location}
                  onChange={(e) => setCurrentGame({ ...currentGame, location: e.target.value })}
                  required
                />
              </label>

              <div className="form__actions">
                <button className="btn btn--primary" type="submit">
                  {editingId ? "Guardar cambios" : "Agregar"}
                </button>
                <button className="btn btn--ghost" type="button" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal postulados */}
      {postuladosModal.open && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="postulados-title" onClick={() => setPostuladosModal({ open: false, postulados: [], gameId: null })}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            
            <h2 id="postulados-title" className="modal__title">Postulados</h2>

            {postuladosModal.postulados.length === 0 ? (
              <p className="muted">No hay postulados para este partido.</p>
            ) : (
              <ul className="list">
                {postuladosModal.postulados.map((arbitro) => (
                  <li key={arbitro._id} className="list__item">
                    <span>{arbitro.nombre || arbitro.email}</span>
                    <button className="btn btn--sm btn--primary" onClick={() => assignArbitro(postuladosModal.gameId, arbitro._id)}>
                      Asignar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCards({ total, upcoming, needsReferee }) {
  return (
    <section className="stats">
      <article className="stat">
        <h3>Total de partidos</h3>
        <p>{total}</p>
      </article>
      <article className="stat">
        <h3>Próximos</h3>
        <p>{upcoming}</p>
      </article>
      <article className="stat">
        <h3>Sin árbitro</h3>
        <p>{needsReferee}</p>
      </article>
    </section>
  );
}

