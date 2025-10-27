import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CompleteProfile() {
  const [form, setForm] = useState({
    nombre: "",
    edad: "",
    contacto: "",
    experiencia: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const contactRegex = /^\d{10}$/;

    if (step === 1) {
      if (!nameRegex.test(form.nombre)) {
        newErrors.nombre = "El nombre solo puede contener letras.";
      }
      const edadNum = Number(form.edad);
      if (Number.isNaN(edadNum) || edadNum < 18 || edadNum > 50) {
        newErrors.edad = "La edad debe ser un número entre 18 y 50.";
      }
    }

    if (step === 2) {
      if (!contactRegex.test(form.contacto)) {
        newErrors.contacto = "El contacto debe contener exactamente 10 dígitos.";
      }
      if (form.experiencia.length < 10) {
        newErrors.experiencia = "Describe tu experiencia con al menos 10 caracteres.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(1)) {
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;
    
    setIsSaving(true);
    
    const email = localStorage.getItem("userEmail");
    const data = { ...form, email };
    
    try {
      const res = await fetch("/api/usuarios/completar-perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      if (res.ok) {
        // Éxito - mostrar mensaje y redirigir
        setTimeout(() => {
          navigate(result.redirect || "/dashboard");
        }, 1500);
      } else {
        alert(result.message || "Error al guardar el perfil");
        setIsSaving(false);
      }
    } catch {
      alert("Error al conectar con el servidor");
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full">
          <div className="card-body text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-gray-800 mb-2">Guardando tu perfil...</h2>
            <p className="text-gray-600">Te redirigiremos al dashboard en un momento</p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-green-600 h-1 rounded-full animate-pulse" style={{width: '75%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414-1.414L9 5.586 7.707 4.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L10 4.586l-.293-.293z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-3">¡Bienvenido a RefZone!</h1>
          <p className="text-lg text-gray-600 mb-6">Completa tu perfil para comenzar a arbitrar partidos</p>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Datos Básicos</span>
            </div>
            <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Experiencia</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-display font-semibold text-gray-800">
              {currentStep === 1 ? 'Información Personal' : 'Experiencia Profesional'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentStep === 1 
                ? 'Cuéntanos sobre ti para crear tu perfil profesional'
                : 'Describe tu experiencia como árbitro para que los organizadores te conozcan mejor'
              }
            </p>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <div className="space-y-6">
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
                        name="nombre"
                        placeholder="Tu nombre completo"
                        required
                        value={form.nombre}
                        onChange={handleChange}
                        className={`form-input ${errors.nombre ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
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
                        name="edad"
                        placeholder="Tu edad (18-50)"
                        required
                        min="18"
                        max="50"
                        value={form.edad}
                        onChange={handleChange}
                        className={`form-input ${errors.edad ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                      />
                      {errors.edad && <p className="form-error">{errors.edad}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button 
                      type="button"
                      onClick={handleNext}
                      className="btn btn-primary"
                    >
                      Continuar
                      <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
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
                      required
                      maxLength="10"
                      value={form.contacto}
                      onChange={handleChange}
                      className={`form-input ${errors.contacto ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.contacto && <p className="form-error">{errors.contacto}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="experiencia" className="form-label">
                      <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1zm-1 4a1 1 0 100-2H8a1 1 0 100 2h4z" clipRule="evenodd"/>
                      </svg>
                      Experiencia Arbitrando
                    </label>
                    <textarea
                      id="experiencia"
                      name="experiencia"
                      placeholder="Describe tu experiencia como árbitro: ligas donde has participado, años de experiencia, certificaciones, torneos importantes, etc."
                      required
                      rows="5"
                      value={form.experiencia}
                      onChange={handleChange}
                      className={`form-input resize-none ${errors.experiencia ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.experiencia && <p className="form-error">{errors.experiencia}</p>}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={handlePrevious}
                      className="btn btn-ghost flex-1"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                      </svg>
                      Anterior
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary flex-1"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Completar Perfil
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Welcome Tips */}
        <div className="mt-8 card">
          <div className="card-body">
            <h3 className="text-lg font-display font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              ¿Qué puedes hacer en RefZone?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Ver Partidos</h4>
                <p>Explora todos los partidos disponibles en tu zona</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Aplicar</h4>
                <p>Postúlate para arbitrar los partidos que te interesen</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Crecer</h4>
                <p>Construye tu reputación y accede a mejores oportunidades</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}