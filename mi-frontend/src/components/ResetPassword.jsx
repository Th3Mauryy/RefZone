import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/login.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);

  const token = params.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/usuarios/resetear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) setDone(true);
    } catch {
      alert("Error al restablecer la contraseña");
    }
  };

  if (!token) return <div>Token inválido o faltante.</div>;

  return (
    <div className="login-bg"> {/* Aplica la clase login-bg aquí */}
      <div className="page-container">
        <div className="content-area">
          <div className="login-box">
            <h2>Restablecer Contraseña</h2>
            {done ? (
              <p>
                Contraseña restablecida. <a href="/">Inicia sesión</a>
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="textbox">
                  <input
                    type="password"
                    placeholder="Nueva Contraseña"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="button-group">
                  <button type="submit">Restablecer</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}