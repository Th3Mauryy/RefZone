import React, { useState } from "react";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/usuarios/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      showSuccess(data.message || "✅ Correo de recuperación enviado. Revisa tu bandeja de entrada.");
      if (res.ok) setSent(true);
    } catch {
      showError("❌ Error al enviar el correo de recuperación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-green-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-200 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">RefZone</h1>
          <p className="text-xl text-white/90 font-medium">Recuperación de Contraseña</p>
        </div>

        {/* Recovery Form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">¡Correo Enviado!</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium mb-2">Revisa tu bandeja de entrada</p>
                <p className="text-green-700 text-sm">
                  Te hemos enviado un enlace de recuperación a <strong>{email}</strong>
                </p>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Revisa también tu carpeta de spam</p>
                <p>• El enlace expira en 1 hora</p>
                <p>• Si no lo recibes, intenta nuevamente</p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-4 4-4-4 4-4 .257-.257A6 6 0 1118 8zm-6-2a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Recuperar Acceso</h2>
                <p className="text-gray-600">Ingresa tu email para recibir un enlace de recuperación</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Te enviaremos instrucciones para restablecer tu contraseña
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full py-3 text-lg font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      Enviar Enlace de Recuperación
                    </div>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              ¿Recordaste tu contraseña?{" "}
              <a 
                href="/" 
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
              >
                Inicia sesión
              </a>
            </p>
            {!sent && (
              <p className="text-gray-600">
                ¿No tienes cuenta?{" "}
                <a 
                  href="/register" 
                  className="text-secondary-600 hover:text-secondary-700 font-semibold transition-colors duration-200"
                >
                  Regístrate aquí
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-white/80">
          <p className="text-sm">
            🔐 Tu seguridad es nuestra prioridad
          </p>
          <p className="text-xs mt-2">
            El enlace de recuperación es seguro y expira en 1 hora
          </p>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}