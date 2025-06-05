import React, { useEffect, useState } from "react";
import "../styles/dashboardOrganizador.css";
import StatsCards from "./StatsCards";

const initialGame = { name: "", date: "", time: "", location: "" };

export default function DashboardOrganizador() {
  const [games, setGames] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Agregar Partido");
  const [currentGame, setCurrentGame] = useState(initialGame);
  const [editingId, setEditingId] = useState(null);
  const [postuladosModal, setPostuladosModal] = useState({ open: false, postulados: [], gameId: null });
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    needsReferee: 0,
  });


  // Cargar partidos al montar
  useEffect(() => {
    loadGames();
    fetch("/api/games/stats", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setStats({ total: 0, upcoming: 0, needsReferee: 0 }));
  }, []);

  async function loadGames() {
    try {
      const res = await fetch("/api/games", { credentials: "include" });
      const data = await res.json();
      setGames(data);
    } catch {
      alert("Error al cargar los partidos");
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
      name: game.name,
      date: game.date ? game.date.split("T")[0] : "",
      time: game.time || "",
      location: game.location || "",
    });
    setEditingId(game._id);
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
      if (res.ok) {
        alert(editingId ? "Partido actualizado correctamente" : "Partido agregado correctamente");
        window.location.reload(); // Recarga la página
      } else {
        alert(result.message || "Error al guardar el partido");
      }
    } catch {
      alert("Error al conectar con el servidor");
    }
  }

  async function handleDelete(gameId) {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este partido?")) return;
    try {
      const res = await fetch(`/api/games/${gameId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        alert("Partido eliminado correctamente");
        window.location.reload(); // Recarga la página
      } else {
        alert("Error al eliminar el partido");
      }
    } catch {
      alert("Error al conectar con el servidor");
    }
  }

  async function openPostulados(gameId) {
    try {
      const res = await fetch(`/api/games/${gameId}/postulados`, { credentials: "include" });
      const data = await res.json();
      setPostuladosModal({ open: true, postulados: data.postulados, gameId });
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
      if (res.ok) {
        setPostuladosModal({ open: false, postulados: [], gameId: null });
        loadGames();
        alert("Árbitro asignado correctamente");
      } else {
        alert("Error al asignar árbitro");
      }
    } catch {
      alert("Error al conectar con el servidor");
    }
  }

  function formatDate(date) {
    if (!date) return "";
    // Si la fecha es tipo string "YYYY-MM-DD"
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      const [year, month, day] = date.split("T")[0].split("-");
      return `${day}/${month}/${year}`;
    }
    // Si es Date o timestamp
    const d = new Date(date);
    return d.toLocaleDateString("es-MX");
  }

  function formatTime(time) {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  }

  function logout() {
    fetch("/api/usuarios/logout", { credentials: "include" }).then(() => {
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      window.location.href = "/";
    });
  }

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        <header className="header">
          <div className="logo">
            <img src="/img/logo.png" alt="Logo" />
          </div>
          <button className="logout-btn" onClick={logout}>
            Cerrar sesión
          </button>
          <div className="profile-container">
            <img className="profile-pic" src="/img/perfil1.png" alt="Perfil" />
            <div className="profile-info">
              <span className="username">Admin</span>
            </div>
          </div>
        </header>
        <div
          className="main-content"
          style={{
            marginTop: games.length <= 1 ? 10 : 10 + (games.length - 1) * 100,
            padding: "0 32px",
            width: "100%",
            boxSizing: "border-box",
            paddingTop: 0
          }}
        >
          <h1
            style={{
              textAlign: "center",
              margin: "0 0 10px 0",
              fontWeight: "bold",
              fontSize: "2.5rem",
              letterSpacing: "2px",
              textShadow: "2px 2px 6px #00000044",
              color: "#222"
            }}
          >
            GESTIÓN DE PARTIDOS
          </h1>
          <div className="table-header-actions" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="add-game-btn" onClick={openAddModal}>
              Agregar Partido
            </button>
          </div>
          <div className="table-wrapper-organizador">
            <table className="table-matches-organizador">
              <thead>
                <tr>
                  <th style={{ padding: 12 }}>Fecha y Hora</th>
                  <th style={{ padding: 12 }}>Nombre</th>
                  <th style={{ padding: 12 }}>Ubicación</th>
                  <th style={{ padding: 12 }}>Árbitro</th>
                  <th style={{ padding: 12 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {games.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#222" }}>
                      No hay partidos registrados.
                    </td>
                  </tr>
                )}
                {games.map((game) => (
                  <tr key={game._id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 10, color: "#222" }}>
                      <span style={{ fontWeight: 600 }}>{formatDate(game.date)}</span>
                      <br />
                      <span style={{ color: "#1ed760", fontWeight: 500 }}>{formatTime(game.time)}</span>
                    </td>
                    <td style={{ padding: 10, color: "#222" }}>{game.name}</td>
                    <td style={{ padding: 10, color: "#222" }}>{game.location}</td>
                    <td style={{ padding: 10 }}>
                      {game.arbitro
                        ? <span style={{ color: "#1ed760", fontWeight: 700 }}>{game.arbitro.nombre || game.arbitro.email}</span>
                        : <span style={{
                            color: "#fff",
                            background: "#222",
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontWeight: 600
                          }}>Sin asignar</span>
                      }
                    </td>
                    <td style={{ padding: 10 }}>
                      <div className="card-actions">
                        <button className="edit-btn" onClick={() => openEditModal(game)}>
                          Editar
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(game._id)}>
                          Eliminar
                        </button>
                        {!game.arbitro && (
                          <button className="postulados-btn" onClick={() => openPostulados(game._id)}>
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

          {/* Estadísticas generales */}
          <StatsCards
            total={stats.total}
            upcoming={stats.upcoming}
            needsReferee={stats.needsReferee}
          />

          {/* Modal agregar/editar partido */}
          {modalOpen && (
            <div className="modal" onClick={() => setModalOpen(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close-btn" onClick={() => setModalOpen(false)}>&times;</span>
                <h2>{modalTitle}</h2>
                <form onSubmit={handleSave}>
                  <input
                    type="text"
                    placeholder="Nombre del partido"
                    value={currentGame.name}
                    onChange={e => setCurrentGame({ ...currentGame, name: e.target.value })}
                    required
                    style={{ width: "100%", marginBottom: 10 }}
                  />
                  <input
                    type="date"
                    value={currentGame.date}
                    onChange={e => setCurrentGame({ ...currentGame, date: e.target.value })}
                    required
                    style={{ width: "100%", marginBottom: 10 }}
                  />
                  <input
                    type="time"
                    value={currentGame.time}
                    onChange={e => setCurrentGame({ ...currentGame, time: e.target.value })}
                    required
                    style={{ width: "100%", marginBottom: 10 }}
                  />
                  <input
                    type="text"
                    placeholder="Ubicación"
                    value={currentGame.location}
                    onChange={e => setCurrentGame({ ...currentGame, location: e.target.value })}
                    required
                    style={{ width: "100%", marginBottom: 10 }}
                  />
                  <button className="confirm-btn" type="submit">
                    {editingId ? "Guardar cambios" : "Agregar"}
                  </button>
                  <button className="cancel-btn" type="button" onClick={() => setModalOpen(false)} style={{ marginLeft: 10 }}>
                    Cancelar
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Modal de postulados */}
          {postuladosModal.open && (
            <div className="modal" onClick={() => setPostuladosModal({ open: false, postulados: [], gameId: null })}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <span className="close-btn" onClick={() => setPostuladosModal({ open: false, postulados: [], gameId: null })}>&times;</span>
                <h2>Postulados</h2>
                {postuladosModal.postulados.length === 0 ? (
                  <p>No hay postulados para este partido.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {postuladosModal.postulados.map(arbitro => (
                      <div
                        key={arbitro._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                          padding: "4px 0"
                        }}
                      >
                        <span>{arbitro.nombre || arbitro.email}</span>
                        <button
                          className="mini-assign-btn"
                          onClick={() => assignArbitro(postuladosModal.gameId, arbitro._id)}
                        >
                          Asignar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="footer">
            <div className="contact-info">
              <strong>Contacto:</strong><br />
              Teléfono: +52 312 100 1096<br />
              Email: contacto@refzone.com<br />
              Redes Sociales:
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"> Facebook </a>|
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"> Instagram </a>|
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"> Twitter </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
