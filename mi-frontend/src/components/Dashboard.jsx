import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [games, setGames] = useState([]);
  const [user, setUser] = useState({ nombre: "Usuario", userId: "", imagenPerfil: null });
  const [applyModal, setApplyModal] = useState({ open: false, gameId: null });
  const [cancelModal, setCancelModal] = useState({ open: false, gameId: null });

  // Cargar usuario y partidos al montar
  useEffect(() => {
    loadUser();
    loadGames();
  }, []);

 async function loadUser() {
    try {
        const token = localStorage.getItem('token'); // Obtén el token del almacenamiento local
        const res = await fetch('/api/usuarios/check-session', {
            headers: {
                'Authorization': `Bearer ${token}`, // Incluye el token en el encabezado
            },
            credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
            setUser({
                nombre: data.nombre || 'Usuario',
                userId: data.userId,
                imagenPerfil: data.imagenPerfil,
            });
        } else {
            window.location.href = '/';
        }
    } catch {
        window.location.href = '/';
    }
  }

  async function loadGames() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/games', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        const data = await res.json();
        setGames(data);
    } catch {
        alert('Error al cargar los partidos');
    }
  }

  function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  }

  function formatTime(time) {
    if (!time) return "";
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.padStart(2, "0")} ${ampm}`;
  }

  function getButtonState(game) {
    const userId = user.userId;

    // 1. El usuario es el árbitro asignado
    if (game.arbitro && String(game.arbitro._id) === String(userId)) {
      return { text: "Aceptado", color: "green", disabled: true, cancel: false };
    }

    // 2. Ya hay árbitro asignado (pero NO eres tú)
    if (game.arbitro && String(game.arbitro._id) !== String(userId)) {
      // ¿El usuario se postuló?
      if (game.postulados && game.postulados.includes(userId)) {
        // Se postuló pero NO fue elegido
        return { text: "Rechazado", color: "red", disabled: true, cancel: false };
      } else {
        // No se postuló y ya hay árbitro
        return { text: "Árbitro asignado", color: "gray", disabled: true, cancel: false };
      }
    }

    // 3. El usuario se postuló y aún no hay árbitro asignado
    if (game.postulados && game.postulados.includes(userId) && !game.arbitro) {
      return { text: "Postulado", color: "yellow", disabled: true, cancel: true };
    }

    // 4. Cupo lleno y el usuario no está postulado
    if (game.postulados && game.postulados.length >= 5 && (!game.postulados.includes(userId))) {
      return { text: "Cupo Lleno", color: "red", disabled: true, cancel: false };
    }

    // 5. Puede postularse
    return { text: "Postularse", color: "green", disabled: false, cancel: false };
  }

  async function handleApply(gameId) {
    setApplyModal({ open: true, gameId });
  }

  async function confirmApply() {
    try {
      const res = await fetch(`/api/games/${applyModal.gameId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  function handleCancelPostulation(gameId) {
    setCancelModal({ open: true, gameId });
  }

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
      const res = await fetch("/api/usuarios/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      alert(data.message);
      if (res.status === 200) {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        window.location.href = "/";
      }
    } catch {
      alert("Error al cerrar sesión");
    }
  }

  const columns = 3;
  const numRows = Math.ceil(games.length / columns);

    numRows === 1
      ? 10
      : numRows === 2
      ? 160
      : 160 + (numRows - 2) * 290;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <img src="/img/logo.png" alt="Logo" />
          </div>
          <button className="logout-btn" onClick={logout}>
            Cerrar sesión
          </button>
          <div className="profile-container">
             <img
              src={user.imagenPerfil || "/img/perfil1.png"} // Mostrar imagen de Cloudinary o una predeterminada
              alt="Perfil"
              className="profile-pic"
            />
            <div className="profile-info">
              <span className="username">¡Hola! {user.nombre}</span>
            </div>
          </div>
        </header>

        {/* Contenedor principal */}
        <div className="content-wrapper">
          {/* Tabla de partidos */}
          <div className="table-wrapper-arbitro">
            <h2 className="games-title-arbitro">Lista de Partidos</h2>
            <table className="table-matches-arbitro">
              <thead>
                <tr>
                  <th style={{ padding: 12 }}>Fecha y Hora</th>
                  <th style={{ padding: 12 }}>Nombre</th>
                  <th style={{ padding: 12 }}>Ubicación</th>
                  <th style={{ padding: 12 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {games.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 24, color: "#222" }}>
                      No hay partidos disponibles.
                    </td>
                  </tr>
                )}
                {games.map((game) => {
                  const btn = getButtonState(game);
                  return (
                    <tr key={game._id}>
                      <td style={{ padding: 10, color: "#222" }}>
                        <span style={{ fontWeight: 600 }}>{formatDate(game.date)}</span>
                        <br />
                        <span style={{ color: "#1ed760", fontWeight: 500 }}>{formatTime(game.time)}</span>
                      </td>
                      <td style={{ padding: 10, color: "#222" }}>{game.name}</td>
                      <td style={{ padding: 10, color: "#222" }}>{game.location}</td>
                      <td style={{ padding: 10 }}>
                        <div className="card-actions">
                          <button
                            className="apply-btn"
                            style={{
                              backgroundColor: btn.color,
                              color: btn.color === "yellow" ? "black" : "white",
                              cursor: btn.disabled ? "not-allowed" : "pointer",
                            }}
                            disabled={btn.disabled}
                            onClick={
                              btn.text === "Postularse"
                                ? () => handleApply(game._id)
                                : undefined
                            }
                          >
                            {btn.text}
                          </button>
                          {btn.cancel && (
                            <button
                              className="apply-btn cancel-btn"
                              style={{
                                backgroundColor: "#FF4B4B",
                                color: "white",
                                cursor: "pointer",
                                marginLeft: "10px",
                              }}
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

          {/* Anuncio de reglas */}
          <div className="referee-rules">
            <h3>Consejos generales para árbitros</h3>
            <ul>
              <li>Mantén la calma bajo presión.</li>
              <li>Comunica claramente con jugadores y oficiales.</li>
              <li>Conoce las reglas a fondo.</li>
              <li>Ubícate eficazmente para seguir el juego.</li>
              <li>Gestiona el ritmo del juego.</li>
            </ul>
            <h4>Recordatorios rápidos de reglas</h4>
            <ul>
              <li><strong>Mano:</strong> El contacto intencional entre la mano/brazo y el balón es falta.</li>
              <li><strong>Saque de banda:</strong> Ambos pies deben estar en el suelo al realizar el saque.</li>
              <li><strong>Faltas:</strong> Las faltas graves pueden resultar en tarjetas amarillas o rojas.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="contact-info">
            <p>
              <strong>Contacto:</strong>
            </p>
            <p>Teléfono: +52 312 100 1096</p>
            <p>Email: contacto@refzone.com</p>
            <p>
              Redes Sociales: <a href="#">Facebook</a> | <a href="#">Instagram</a> |{" "}
              <a href="#">Twitter</a>
            </p>
          </div>
        </footer>

        {/* Modal postularse */}
        {applyModal.open && (
          <div className="modal">
            <div className="modal-content">
              <h3>¿Deseas postularte para este partido?</h3>
              <div className="modal-buttons">
                <button className="confirm-btn" onClick={confirmApply}>
                  Confirmar
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setApplyModal({ open: false, gameId: null })}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal cancelar postulación */}
        {cancelModal.open && (
          <div className="modal">
            <div className="modal-content">
              <h3>¿Estás seguro de que deseas cancelar tu postulación?</h3>
              <div className="modal-buttons">
                <button className="confirm-btn" onClick={confirmCancelPostulation}>
                  Confirmar
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setCancelModal({ open: false, gameId: null })}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
