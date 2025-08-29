// File: /src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [games, setGames] = useState([]);
  const [user, setUser] = useState({ nombre: "Usuario", userId: "", imagenPerfil: null });
  const [applyModal, setApplyModal] = useState({ open: false, gameId: null });
  const [cancelModal, setCancelModal] = useState({ open: false, gameId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();
    loadGames();
  }, []);

  async function loadUser() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/usuarios/check-session", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ nombre: data.nombre || "Usuario", userId: data.userId, imagenPerfil: data.imagenPerfil });
      } else {
        window.location.href = "/";
      }
    } catch {
      window.location.href = "/";
    }
  }

  async function loadGames() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/games", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch {
      setError("Error al cargar los partidos");
    } finally {
      setLoading(false);
    }
  }

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
    if (game.arbitro && String(game.arbitro._id) === String(userId)) return { text: "Aceptado", color: "green", disabled: true, cancel: false };
    if (game.arbitro && String(game.arbitro._id) !== String(userId)) {
      if (game.postulados && game.postulados.includes(userId)) return { text: "Rechazado", color: "red", disabled: true, cancel: false };
      return { text: "Árbitro asignado", color: "gray", disabled: true, cancel: false };
    }
    if (game.postulados && game.postulados.includes(userId) && !game.arbitro) return { text: "Postulado", color: "yellow", disabled: true, cancel: true };
    if (game.postulados && game.postulados.length >= 5 && !game.postulados.includes(userId)) return { text: "Cupo Lleno", color: "red", disabled: true, cancel: false };
    return { text: "Postularse", color: "green", disabled: false, cancel: false };
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
    try {
      const res = await fetch("/api/usuarios/logout", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      alert(data.message);
      if (res.status === 200) {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        window.location.href = "/";
      }
    } catch { alert("Error al cerrar sesión"); }
  }

  return (
    <div className="dashboard-bg">
      <header className="topbar">
        <div className="brand">
          <img src="/img/logo.png" alt="Logo" className="brand__logo" />
          <div className="profile">
            <img src={user.imagenPerfil || "/img/perfil1.png"} alt="Perfil" className="profile__pic" />
            <span className="profile__name">¡Hola! {user.nombre}</span>
            <div className="profile__meta">
              <button className="btn btn--ghost" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <h1 className="page-title">Lista de partidos</h1>
        {error && <div className="alert alert--error">{error}</div>}
        {loading && <div className="skeleton" aria-hidden="true" />}

        {!loading && (
          <div className="grid">
            {/* Tabla partidos */}
            <section className="card">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha y hora</th>
                      <th>Nombre</th>
                      <th>Ubicación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.length === 0 && (
                      <tr>
                        <td colSpan={4} className="table__empty">No hay partidos disponibles.</td>
                      </tr>
                    )}

                    {games.map((game) => {
                      const btn = getButtonState(game);
                      return (
                        <tr key={game._id}>
                          <td data-label="Fecha y hora">
                            <div className="chip-row">
                              <span className="text-strong">{formatDate(game.date)}</span>
                              <span className="chip">{formatTime(game.time)}</span>
                            </div>
                          </td>
                          <td data-label="Nombre">{game.name}</td>
                          <td data-label="Ubicación">{game.location}</td>
                          <td data-label="Acciones">
                            <div className="btn-group">
                              <button
                                className="btn btn--sm"
                                style={{ backgroundColor: btn.color, color: btn.color === "yellow" ? "#111" : "#fff", borderColor: "transparent" }}
                                disabled={btn.disabled}
                                onClick={btn.text === "Postularse" ? () => handleApply(game._id) : undefined}
                              >
                                {btn.text}
                              </button>
                              {btn.cancel && (
                                <button className="btn btn--sm btn--danger" onClick={() => handleCancelPostulation(game._id)}>
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
            </section>

            {/* Reglas / Tips */}
            <aside className="card rules">
              <h3>Consejos generales para árbitros</h3>
              <ul className="list">
                <li>Mantén la calma bajo presión.</li>
                <li>Comunica claramente con jugadores y oficiales.</li>
                <li>Conoce las reglas a fondo.</li>
                <li>Ubícate eficazmente para seguir el juego.</li>
                <li>Gestiona el ritmo del juego.</li>
              </ul>
              <h4>Recordatorios rápidos de reglas</h4>
              <ul className="list">
                <li><strong>Mano:</strong> contacto intencional mano/brazo-balón es falta.</li>
                <li><strong>Saque de banda:</strong> ambos pies en el suelo.</li>
                <li><strong>Faltas:</strong> graves ⇒ amarilla/roja.</li>
              </ul>
            </aside>
          </div>
        )}
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
              <a href="#">Facebook</a> · <a href="#">Instagram</a> · <a href="#">Twitter</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Modal postularse */}
      {applyModal.open && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="apply-title" onClick={() => setApplyModal({ open: false, gameId: null })}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            
            <h3 id="apply-title" className="modal__title">¿Deseas postularte para este partido?</h3>
            <div className="form__actions">
              <button className="btn btn--primary" onClick={confirmApply}>Confirmar</button>
              <button className="btn btn--ghost" onClick={() => setApplyModal({ open: false, gameId: null })}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cancelar postulación */}
      {cancelModal.open && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title" onClick={() => setCancelModal({ open: false, gameId: null })}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            
            <h3 id="cancel-title" className="modal__title">¿Cancelar tu postulación?</h3>
            <div className="form__actions">
              <button className="btn btn--danger" onClick={confirmCancelPostulation}>Confirmar</button>
              <button className="btn btn--ghost" onClick={() => setCancelModal({ open: false, gameId: null })}>Volver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

