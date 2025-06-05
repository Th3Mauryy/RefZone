import React, { useState } from "react";
import "../styles/login.css";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/usuarios/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) setSent(true);
    } catch {
      alert("Error al enviar el correo de recuperación");
    }
  };

  return (
    <div className="login-bg"> {/* Aplica la clase login-bg aquí */}
      <div className="page-container">
        <div className="content-area">
          <div className="login-box">
            <h2>Recuperar Contraseña</h2>
            {sent ? (
              <p>Revisa tu correo para el enlace de recuperación.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="textbox">
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="button-group">
                  <button type="submit">Enviar Enlace</button>
                </div>
              </form>
            )}
            <p className="login-link">
              ¿Ya tienes cuenta? <a href="/">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}