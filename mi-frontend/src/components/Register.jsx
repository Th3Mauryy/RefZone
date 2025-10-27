import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logger from "../utils/logger";

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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, files, value } = e.target;
    setErrors({...errors, [id]: ""});

    if (id === "imagenPerfil") {
      const file = files?.[0];
      if (file && !["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        setErrors({...errors, [id]: "Solo se permiten imágenes en formato JPEG o PNG."});
        return;
      }
      
      // Comprimir imagen antes de guardar
      if (file) {
        // Límite de 2MB - si es más grande, mostrar advertencia pero permitir
        if (file.size > 2 * 1024 * 1024) {
          logger.warn('Imagen grande detectada:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        }
        
        setForm((prev) => ({ ...prev, imagenPerfil: file }));
        
        // Crear previsualización
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setForm((prev) => ({ ...prev, imagenPerfil: null }));
        setPreviewImage(null);
      }
    } else if (id === "edad") {
      const num = value === "" ? "" : Number(value);
      setForm((prev) => ({ ...prev, edad: num }));
    } else {
      setForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;
    const contactRegex = /^\d{10}$/;

    if (!emailRegex.test(form.email)) {
      newErrors.email = "Por favor, ingresa un correo electrónico válido.";
    }
    if (!nameRegex.test(form.nombre)) {
      newErrors.nombre = "El nombre solo puede contener letras y números.";
    }
    if (form.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    const edadNum = Number(form.edad);
    if (Number.isNaN(edadNum) || edadNum < 18 || edadNum > 50) {
      newErrors.edad = "La edad debe ser un número entre 18 y 50.";
    }
    if (!contactRegex.test(form.contacto)) {
      newErrors.contacto = "El contacto debe contener exactamente 10 dígitos.";
    }
    if (form.experiencia.length < 10) {
      newErrors.experiencia = "Describe tu experiencia con al menos 10 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    const formData = new FormData();
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
      const response = await fetch(`/api/usuarios/registro`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        alert(data.message || "Error al registrar");
        setIsLoading(false);
        return;
      }
      
      // Registro exitoso - navegar inmediatamente
      alert(`¡Bienvenido ${data.user?.nombre || 'al equipo'}! Tu cuenta ha sido creada exitosamente.`);
      navigate("/", { replace: true });
    } catch (error) {
      logger.error('Error en registro:', error);
      alert("Error de conexión. Verifica tu internet e intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 py-8 px-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-200 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Únete a RefZone</h1>
          <p className="text-xl text-white/90 font-medium">Registro de Árbitros Profesionales</p>
          <p className="text-white/70 mt-2">Forma parte de la comunidad de árbitros más grande de fútbol 7</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Crea tu Perfil de Árbitro</h2>
            <p className="text-gray-600">Completa toda la información para validar tu perfil</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {/* Row 1: Email y Contraseña */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="tu@email.com"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
            </div>

            {/* Row 2: Nombre y Edad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="nombre" className="form-label">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="nombre"
                  placeholder="Tu nombre completo"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  className={`form-input ${errors.nombre ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.nombre && <p className="form-error">{errors.nombre}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="edad" className="form-label">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                  Edad
                </label>
                <input
                  type="number"
                  id="edad"
                  placeholder="Tu edad (18-50)"
                  required
                  min="18"
                  max="50"
                  value={form.edad}
                  onChange={handleChange}
                  className={`form-input ${errors.edad ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.edad && <p className="form-error">{errors.edad}</p>}
              </div>
            </div>

            {/* Row 3: Contacto */}
            <div className="form-group">
              <label htmlFor="contacto" className="form-label">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                Número de Contacto
              </label>
              <input
                type="text"
                id="contacto"
                placeholder="10 dígitos sin espacios"
                required
                value={form.contacto}
                onChange={handleChange}
                maxLength="10"
                className={`form-input ${errors.contacto ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.contacto && <p className="form-error">{errors.contacto}</p>}
            </div>

            {/* Row 4: Experiencia */}
            <div className="form-group">
              <label htmlFor="experiencia" className="form-label">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1zm-1 4a1 1 0 100-2H8a1 1 0 100 2h4z" clipRule="evenodd"/>
                </svg>
                Experiencia Arbitrando
              </label>
              <textarea
                id="experiencia"
                placeholder="Cuéntanos sobre tu experiencia como árbitro (ligas, torneos, años de experiencia, certificaciones, etc.)"
                required
                rows="4"
                value={form.experiencia}
                onChange={handleChange}
                className={`form-input resize-none ${errors.experiencia ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.experiencia && <p className="form-error">{errors.experiencia}</p>}
            </div>

            {/* Row 5: Imagen de Perfil */}
            <div className="form-group">
              <label htmlFor="imagenPerfil" className="form-label">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                </svg>
                Foto de Perfil (Opcional)
              </label>
              
              {previewImage ? (
                <div className="mt-1 relative">
                  <div className="flex justify-center">
                    <div className="relative">
                      <img 
                        src={previewImage} 
                        alt="Vista previa" 
                        className="h-48 w-48 object-cover rounded-lg border-4 border-primary-200 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setForm(prev => ({ ...prev, imagenPerfil: null }));
                          document.getElementById('imagenPerfil').value = '';
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-3">
                    ✅ Foto cargada correctamente
                  </p>
                </div>
              ) : (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors duration-200">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="flex justify-center text-sm text-gray-600">
                      <label htmlFor="imagenPerfil" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                        <span>Subir una foto</span>
                        <input
                          id="imagenPerfil"
                          type="file"
                          accept="image/jpeg, image/png, image/jpg"
                          onChange={handleChange}
                          className="sr-only"
                          disabled={isLoading}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG hasta 10MB</p>
                  </div>
                </div>
              )}
              {errors.imagenPerfil && <p className="form-error">{errors.imagenPerfil}</p>}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full py-3 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Creando tu perfil...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Unirme al Equipo RefZone
                </div>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{" "}
              <a 
                href="/" 
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
              >
                Iniciar sesión
              </a>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-white/80">
          <p className="text-sm">
            🏆 Únete a más de 500+ árbitros registrados en RefZone
          </p>
          <p className="text-xs mt-2">
            Tu experiencia y profesionalismo son valorados aquí
          </p>
        </div>
      </div>
    </div>
  );
}




