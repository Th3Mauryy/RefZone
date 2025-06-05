import React, { useEffect, useState } from "react";
import "../styles/profileForm.css";

export default function EditProfile() {
  const [form, setForm] = useState({
    nombre: "",
    edad: "",
    contacto: "",
    experiencia: "",
  });

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      window.location.href = "/";
      return;
    }
    fetch(`/api/usuarios/perfil/${email}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          nombre: data.nombre || "",
          edad: data.edad || "",
          contacto: data.contacto || "",
          experiencia: data.experiencia || "",
        });
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("userEmail");
    const data = { ...form, email };
    try {
      const res = await fetch("/api/usuarios/editar-perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        alert("Perfil actualizado");
        window.location.href = "/dashboard";
      } else {
        alert(result.message);
      }
    } catch {
      alert("Error al actualizar el perfil");
    }
  };

  return (
    <div className="profile-form-container">
      <h1>Editar Perfil</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nombre">Nombre:</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          required
          value={form.nombre}
          onChange={handleChange}
        />
        <label htmlFor="edad">Edad:</label>
        <input
          type="number"
          id="edad"
          name="edad"
          required
          value={form.edad}
          onChange={handleChange}
        />
        <label htmlFor="contacto">Contacto:</label>
        <input
          type="text"
          id="contacto"
          name="contacto"
          required
          value={form.contacto}
          onChange={handleChange}
        />
        <label htmlFor="experiencia">Experiencia Arbitrando:</label>
        <input
          type="text"
          id="experiencia"
          name="experiencia"
          required
          value={form.experiencia}
          onChange={handleChange}
        />
        <button type="submit">Guardar Cambios</button>
      </form>
    </div>
  );
}