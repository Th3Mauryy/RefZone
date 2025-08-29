import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    edad: "",
    contacto: "",
    experiencia: "",
    imagenPerfil: null,
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, files, value } = e.target;
    if (id === "imagenPerfil") {
      const file = files?.[0];
      if (file && !["image/jpeg", "image/png"].includes(file.type)) {
        alert("Solo se permiten imágenes en formato JPEG o PNG.");
        return;
      }
      setForm((prev) => ({ ...prev, imagenPerfil: file || null }));
    } else if (id === "edad") {
      // Por qué: evitamos discrepancias de tipo con el backend
      const num = value === "" ? "" : Number(value);
      setForm((prev) => ({ ...prev, edad: num }));
    } else {
      setForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-Z\s]+$/;
    const contactRegex = /^\d{10}$/;

    if (!emailRegex.test(form.email)) {
      alert("Por favor, ingresa un correo electrónico válido.");
      return;
    }
    if (!nameRegex.test(form.nombre)) {
      alert("El nombre solo puede contener letras.");
      return;
    }
    const edadNum = Number(form.edad);
    if (Number.isNaN(edadNum) || edadNum < 18 || edadNum > 50) {
      alert("La edad debe ser un número entre 18 y 50.");
      return;
    }
    if (!contactRegex.test(form.contacto)) {
      alert("El contacto debe contener exactamente 10 dígitos.");
      return;
    }

    const formData = new FormData();
    // Por qué: no enviar imagen cuando es null; normalizar edad a string numérica
    Object.entries(form).forEach(([key, val]) => {
      if (key === "imagenPerfil") {
        if (val) formData.append("imagenPerfil", val);
      } else if (key === "edad") {
        formData.append("edad", String(Number(val)));
      } else {
        formData.append(key, val);
      }
    });

    try {
      const response = await fetch("/api/usuarios/registro", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.message || "Error al registrar");
        return;
      }
      alert(data.message || "Registro exitoso");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="register-bg">
      <div className="page-container">
        <div className="content-area">
          <div className="register-box">
            <h2>Registrar Árbitro</h2>
            <form id="registerForm" onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="textbox">
                <input type="email" id="email" placeholder="Email" required value={form.email} onChange={handleChange} />
              </div>
              <div className="textbox">
                <input type="password" id="password" placeholder="Contraseña" required value={form.password} onChange={handleChange} />
              </div>
              <div className="textbox">
                <input type="text" id="nombre" placeholder="Nombre" required value={form.nombre} onChange={handleChange} />
              </div>
              <div className="textbox">
                <input type="number" id="edad" placeholder="Edad" required value={form.edad} onChange={handleChange} />
              </div>
              <div className="textbox">
                <input type="text" id="contacto" placeholder="Contacto" required value={form.contacto} onChange={handleChange} />
              </div>
              <div className="textbox">
                <input type="text" id="experiencia" placeholder="Experiencia arbitrando" required value={form.experiencia} onChange={handleChange} />
              </div>
              <div className="textbox">
                <input type="file" id="imagenPerfil" accept="image/jpeg, image/png" onChange={handleChange} />
              </div>
              <button type="submit">Registrar</button>
            </form>
            <p className="login-link">
              ¿Ya tienes una cuenta? <a href="/">Iniciar sesión</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



