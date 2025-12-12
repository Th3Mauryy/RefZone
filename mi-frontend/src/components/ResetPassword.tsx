import React, { useState, ChangeEvent, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

export default function ResetPassword(): React.ReactElement {
  const [params] = useSearchParams();
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [done, setDone] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const token = params.get("token");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/usuarios/resetear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.message || "Error al restablecer la contraseña");
      }
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setConfirmPassword(e.target.value);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">Token Inválido</h2>
          <p className="text-gray-600 mb-6">El enlace de recuperación es inválido o ha expirado.</p>
          <a href="/recuperar" className="btn btn-primary">
            Solicitar Nuevo Enlace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-200 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">RefZone</h1>
          <p className="text-xl text-white/90 font-medium">Restablecer Contraseña</p>
        </div>

        {/* Reset Form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {done ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">¡Contraseña Restablecida!</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium mb-2">Tu contraseña ha sido actualizada exitosamente</p>
                <p className="text-green-700 text-sm">Ya puedes iniciar sesión con tu nueva contraseña</p>
              </div>
              <a href="/" className="btn btn-primary w-full py-3 text-lg">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Iniciar Sesión
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">Nueva Contraseña</h2>
                <p className="text-gray-600">Ingresa tu nueva contraseña segura</p>
              </div>

              {error && (
                <div className="alert alert-error mb-6">
                  <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                    Nueva Contraseña
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    className="form-input"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                    Confirmar Contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className="form-input"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Repite la misma contraseña
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
                      Restableciendo...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Restablecer Contraseña
                    </div>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Security Tips */}
          {!done && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Consejos de seguridad:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Usa una combinación de letras, números y símbolos</li>
                <li>• Evita información personal como nombres o fechas</li>
                <li>• No reutilices contraseñas de otras cuentas</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-white/80">
          <p className="text-sm">
            🔐 Conexión segura y encriptada
          </p>
          <p className="text-xs mt-2">
            Tu nueva contraseña será protegida con los más altos estándares de seguridad
          </p>
        </div>
      </div>
    </div>
  );
}
