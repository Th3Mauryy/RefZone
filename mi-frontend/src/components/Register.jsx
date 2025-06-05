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
    imagenPerfil: null, // Nuevo campo para la imagen
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.id === "imagenPerfil") {
      const file = e.target.files[0];
      if (file && !["image/jpeg", "image/png"].includes(file.type)) {
        alert("Solo se permiten imágenes en formato JPEG o PNG.");
        return;
      }
      setForm({ ...form, imagenPerfil: file });
    } else {
      setForm({ ...form, [e.target.id]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
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

    if (isNaN(form.edad) || form.edad <= 0 || form.edad > 50) {
      alert("La edad debe ser un número entre 1 y 50.");
      return;
    }

    if (!contactRegex.test(form.contacto)) {
      alert("El contacto debe contener exactamente 10 dígitos.");
      return;
    }

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    try {
      const response = await fetch("/api/usuarios/registro", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      alert(data.message);
      if (response.status === 201) {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      alert("Error al registrar");
    }
  };

  return (
    <div className="register-bg">
      <div className="page-container">
        <div className="content-area">
          <div className="register-box">
            <h2>Registrar Árbitro</h2>
            <form
              id="registerForm"
              onSubmit={handleSubmit}
              encType="multipart/form-data"
            >
              <div className="textbox">
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="textbox">
                <input
                  type="password"
                  id="password"
                  placeholder="Contraseña"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div className="textbox">
                <input
                  type="text"
                  id="nombre"
                  placeholder="Nombre"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                />
              </div>
              <div className="textbox">
                <input
                  type="number"
                  id="edad"
                  placeholder="Edad"
                  required
                  value={form.edad}
                  onChange={handleChange}
                />
              </div>
              <div className="textbox">
                <input
                  type="text"
                  id="contacto"
                  placeholder="Contacto"
                  required
                  value={form.contacto}
                  onChange={handleChange}
                />
              </div>
              <div className="textbox">
                <input
                  type="text"
                  id="experiencia"
                  placeholder="Experiencia arbitrando"
                  required
                  value={form.experiencia}
                  onChange={handleChange}
                />
              </div>
              <div className="textbox">
                <input
                  type="file"
                  id="imagenPerfil"
                  accept="image/jpeg, image/png"
                  onChange={handleChange}
                />
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
