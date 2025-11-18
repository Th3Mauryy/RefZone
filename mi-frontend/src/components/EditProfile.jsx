import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const [form, setForm] = useState({
    email: "",
    contacto: "",
    experiencia: "",
    imagenPerfil: null,
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch("/api/usuarios/check-session", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        
        // Cargar datos detallados del perfil
        const profileRes = await fetch(`/api/usuarios/perfil/${userData.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(prev => ({
            ...prev,
            ...userData,
            calificacionPromedio: profileData.calificacionPromedio || 0,
            totalCalificaciones: profileData.totalCalificaciones || 0
          }));
          setForm({
            email: profileData.email || "",
            contacto: profileData.contacto || "",
            experiencia: profileData.experiencia || "",
            imagenPerfil: profileData.imagenPerfil || null,
          });
          setPreviewImage(profileData.imagenPerfil);
        }
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Validaciones en tiempo real
    const newErrors = { ...errors };
    delete newErrors[name]; // Limpiar error del campo actual
    
    // Validación de email
    if (name === 'email') {
      if (value && value.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors.email = "⚠️ Por favor, ingresa un correo electrónico válido.";
        }
      }
    }
    
    // Validación de contacto
    if (name === 'contacto') {
      if (value && value.length > 0) {
        if (!/^\d+$/.test(value)) {
          newErrors.contacto = "⚠️ Solo se permiten números.";
        } else if (value.length !== 10) {
          newErrors.contacto = "⚠️ Debe contener exactamente 10 dígitos.";
        }
      }
    }
    
    // Validación de experiencia
    if (name === 'experiencia') {
      if (value && value.length > 0 && value.trim().length < 10) {
        newErrors.experiencia = "⚠️ Describe tu experiencia con al menos 10 caracteres.";
      }
    }
    
    // Validación de contraseña actual
    if (name === 'currentPassword') {
      if (!value && (form.newPassword || form.confirmPassword)) {
        newErrors.currentPassword = "⚠️ Debes ingresar tu contraseña actual.";
      }
    }
    
    // Validación de contraseña nueva
    if (name === 'newPassword') {
      if (value && value.length > 0) {
        if (value.length < 8) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe tener al menos 8 caracteres.";
        } else if (!/[A-Z]/.test(value)) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe incluir al menos una mayúscula.";
        } else if (!/[0-9]/.test(value)) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe incluir al menos un número.";
        }
      }
      
      // Verificar que coincida con confirmPassword si ya se ingresó
      if (form.confirmPassword && value !== form.confirmPassword) {
        newErrors.confirmPassword = "⚠️ Las contraseñas no coinciden.";
      } else if (form.confirmPassword && value === form.confirmPassword) {
        delete newErrors.confirmPassword;
      }
    }
    
    // Validación de confirmar contraseña
    if (name === 'confirmPassword') {
      if (value && form.newPassword && value !== form.newPassword) {
        newErrors.confirmPassword = "⚠️ Las contraseñas no coinciden.";
      }
    }
    
    setErrors(newErrors);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, imagenPerfil: "Por favor selecciona una imagen válida" });
        return;
      }
      
      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, imagenPerfil: "La imagen debe ser menor a 5MB" });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
      
      if (errors.imagenPerfil) {
        setErrors({ ...errors, imagenPerfil: "" });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const contactRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = "⚠️ Ingresa un email válido";
    }

    if (form.contacto && !contactRegex.test(form.contacto)) {
      newErrors.contacto = "⚠️ El contacto debe contener exactamente 10 dígitos";
    }

    if (form.experiencia && form.experiencia.length < 10) {
      newErrors.experiencia = "⚠️ Describe tu experiencia con al menos 10 caracteres";
    }
    
    // Validaciones de contraseñas
    if (form.currentPassword || form.newPassword || form.confirmPassword) {
      if (!form.currentPassword) {
        newErrors.currentPassword = "⚠️ Debes ingresar tu contraseña actual";
      }
      
      if (!form.newPassword) {
        newErrors.newPassword = "⚠️ Debes ingresar una nueva contraseña";
      } else {
        if (form.newPassword.length < 8) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe tener al menos 8 caracteres";
        } else if (!/[A-Z]/.test(form.newPassword)) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe incluir al menos una mayúscula";
        } else if (!/[0-9]/.test(form.newPassword)) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe incluir al menos un número";
        }
      }
      
      if (!form.confirmPassword) {
        newErrors.confirmPassword = "⚠️ Debes confirmar tu nueva contraseña";
      } else if (form.newPassword !== form.confirmPassword) {
        newErrors.confirmPassword = "⚠️ Las contraseñas no coinciden";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('email', form.email);
      formData.append('contacto', form.contacto);
      formData.append('experiencia', form.experiencia);
      
      // Agregar contraseñas si se están cambiando (CP-013)
      if (form.currentPassword || form.newPassword) {
        if (!form.currentPassword || !form.newPassword) {
          alert("Para cambiar la contraseña, debes proporcionar tanto la contraseña actual como la nueva");
          setIsSaving(false);
          return;
        }
        
        if (form.newPassword !== form.confirmPassword) {
          alert("Las contraseñas nuevas no coinciden");
          setIsSaving(false);
          return;
        }
        
        formData.append('currentPassword', form.currentPassword);
        formData.append('newPassword', form.newPassword);
      }
      
      if (imageFile) {
        formData.append('imagenPerfil', imageFile);
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/api/usuarios/editar-perfil", {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        body: formData,
        credentials: "include",
      });

      const result = await res.json();
      
      if (res.ok) {
        alert("¡Perfil actualizado exitosamente!");
        navigate("/dashboard");
      } else {
        alert(result.message || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    // Redirigir según el rol del usuario
    if (user.role === 'organizador') {
      navigate("/dashboard-organizador");
    } else {
      navigate("/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="card max-w-md w-full mx-4">
          <div className="card-body text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="btn btn-ghost mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
            Volver al Dashboard
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-800 mb-2">Editar Perfil</h1>
            <p className="text-gray-600">Actualiza tu información profesional</p>
          </div>
        </div>

        {/* Calificación del Árbitro - Solo visible para árbitros */}
        {user.role === 'arbitro' && (
          <div className="card mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-200">
            <div className="card-body p-4">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center">
                ⭐ Tu Calificación como Árbitro
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Basada en {user.totalCalificaciones} {user.totalCalificaciones === 1 ? 'evaluación' : 'evaluaciones'} de organizadores
              </p>
              
              {user.calificacionPromedio > 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                  {/* Estrellas y puntuación */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-7 h-7 sm:w-8 sm:h-8 ${i < Math.round(user.calificacionPromedio) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {user.calificacionPromedio.toFixed(2)} <span className="text-lg text-gray-500">/ 5.00</span>
                    </div>
                  </div>
                  
                  {/* Contador */}
                  <div className="text-center px-6 sm:px-8 py-3 sm:py-4 bg-white rounded-xl shadow-md border-2 border-yellow-200 min-w-[120px]">
                    <div className="text-4xl sm:text-5xl font-bold text-yellow-500 mb-1">
                      {user.totalCalificaciones}
                    </div>
                    <div className="text-xs text-gray-600 uppercase font-semibold whitespace-nowrap">
                      Calificaciones
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-3 shadow-sm">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-700 mb-2">
                    Sin Calificaciones Aún
                  </h4>
                  <p className="text-sm text-gray-600 max-w-md mx-auto mb-4 px-4">
                    Completa tus primeros partidos para recibir calificaciones de los organizadores
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className="w-6 h-6 text-gray-300"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-800">Información Personal</h2>
            <p className="text-sm text-gray-600 mt-1">Mantén tu perfil actualizado para obtener mejores oportunidades</p>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Foto de Perfil */}
              <div className="form-group">
                <label className="form-label">Foto de Perfil</label>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <img 
                      src={previewImage || "/img/perfil1.png"} 
                      alt="Perfil" 
                      className="w-24 h-24 rounded-full border-4 border-primary-200 object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2">
                      <label htmlFor="imagenPerfil" className="btn btn-primary btn-sm rounded-full p-2 cursor-pointer">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1l-1-1H6l-1 1H4zm8 5a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </label>
                    </div>
                  </div>
                  <input
                    type="file"
                    id="imagenPerfil"
                    name="imagenPerfil"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Formatos: JPG, PNG, GIF<br/>
                    Tamaño máximo: 5MB
                  </p>
                  {errors.imagenPerfil && <p className="form-error">{errors.imagenPerfil}</p>}
                </div>
              </div>

              {/* Información no editable */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Información Fija</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium text-gray-800 ml-2">{user.nombre || "No disponible"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rol:</span>
                    <span className="font-medium text-primary-600 ml-2">
                      {user.role === 'organizador' ? 'Organizador' : 'Árbitro'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Por seguridad, el nombre y rol no pueden ser modificados. Contacta soporte si necesitas cambiarlos.
                </p>
              </div>

              {/* Campos editables */}
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
                  name="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isSaving}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

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
                  name="contacto"
                  placeholder="10 dígitos sin espacios"
                  maxLength="10"
                  value={form.contacto}
                  onChange={handleChange}
                  className={`form-input ${errors.contacto ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isSaving}
                />
                {errors.contacto && <p className="form-error">{errors.contacto}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="experiencia" className="form-label">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1zm-1 4a1 1 0 100-2H8a1 1 0 100 2h4z" clipRule="evenodd"/>
                  </svg>
                  {user.role === 'organizador' ? 'Información del Organizador' : 'Experiencia Arbitrando'}
                </label>
                <textarea
                  id="experiencia"
                  name="experiencia"
                  placeholder={
                    user.role === 'organizador' 
                      ? "Describe información sobre tu cancha, servicios ofrecidos, años de experiencia organizando eventos, etc."
                      : "Describe tu experiencia como árbitro (ligas, torneos, años de experiencia, certificaciones, etc.)"
                  }
                  rows="4"
                  value={form.experiencia}
                  onChange={handleChange}
                  className={`form-input resize-none ${errors.experiencia ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  disabled={isSaving}
                />
                {errors.experiencia && <p className="form-error">{errors.experiencia}</p>}
              </div>

              {/* Sección de cambio de contraseña (CP-013) */}
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="flex items-center justify-between w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-primary-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-semibold text-gray-800">Cambiar Contraseña</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>

                {showPasswordSection && (
                  <div className="mt-4 space-y-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 mb-4">
                      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                      </svg>
                      La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número.
                    </p>

                    <div className="form-group">
                      <label htmlFor="currentPassword" className="form-label">
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        placeholder="••••••••"
                        value={form.currentPassword}
                        onChange={handleChange}
                        className={`form-input ${errors.currentPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                        disabled={isSaving}
                      />
                      {errors.currentPassword && <p className="form-error">{errors.currentPassword}</p>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword" className="form-label">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        placeholder="••••••••"
                        value={form.newPassword}
                        onChange={handleChange}
                        className={`form-input ${errors.newPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                        disabled={isSaving}
                      />
                      {errors.newPassword && <p className="form-error">{errors.newPassword}</p>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className={`form-input ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                        disabled={isSaving}
                      />
                      {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button 
                  type="button"
                  onClick={goBack}
                  className="btn btn-ghost flex-1"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Guardar Cambios
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tips de Seguridad */}
        <div className="mt-8 card">
          <div className="card-body">
            <h3 className="text-lg font-display font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Información de Seguridad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Tu nombre no puede cambiarse por seguridad</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Usa un email válido para recibir notificaciones</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Tu número será usado para coordinar partidos</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Una buena experiencia aumenta tus oportunidades</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}