import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Cambiar la URL para que coincida con la ruta del backend
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch((error) => console.error("Error al obtener el token CSRF:", error));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/usuarios/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken, // Incluir el token CSRF
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token); // Guarda el token en localStorage
        if (data.redirect && data.redirect.includes("organizador")) {
          navigate("/dashboard-organizador");
        } else {
          navigate("/dashboard");
        }
      } else {
        alert(data.message || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al iniciar sesión");
    }
  };

  return (
    <div className="login-bg">
      <div className="page-container">
        <div className="content-area">
          <div className="login-box">
            <h2>Iniciar Sesión</h2>
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
              <div className="textbox">
                <input
                  type="password"
                  placeholder="Contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary">
                  Entrar
                </button>
              </div>
            </form>
            <p className="login-link">
              ¿No tienes cuenta? <a href="/register">Regístrate</a>
            </p>
            <p className="login-link">
              ¿Olvidaste tu contraseña? <a href="/recuperar">Recupérala</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
