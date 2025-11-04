import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import DashboardOrganizador from "./components/DashboardOrganizador";
import EditProfile from "./components/EditProfile";
import CompleteProfile from "./components/CompleteProfile";
import RecoverPassword from "./components/RecoverPassword";
import ResetPassword from "./components/ResetPassword";

// Variable global para evitar múltiples redirecciones
window.__TOKEN_EXPIRED_REDIRECT__ = false;

function App() {
  // Interceptor global para manejar errores 401 (token expirado)
  useEffect(() => {
    // Solo configurar una vez
    if (window.__FETCH_INTERCEPTOR_INSTALLED__) {
      return;
    }
    
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Si es un 401 y estamos en una página protegida
      const isProtectedPage = !['/register', '/recuperar', '/resetear', '/'].includes(window.location.pathname);
      
      if (response.status === 401 && isProtectedPage && !window.__TOKEN_EXPIRED_REDIRECT__) {
        // Clonar respuesta para poder leerla sin consumirla
        const clonedResponse = response.clone();
        
        try {
          const data = await clonedResponse.json();
          
          // Si el error es de token expirado o inválido
          if (data.error === 'token_expired' || data.error === 'invalid_token' || 
              data.error === 'missing_token' || data.message?.toLowerCase().includes('expirado') ||
              data.message?.toLowerCase().includes('token')) {
            
            // Marcar que ya estamos redirigiendo
            window.__TOKEN_EXPIRED_REDIRECT__ = true;
            
            console.error('🔒 Token expirado/inválido detectado, cerrando sesión...');
            console.error('Error recibido:', data);
            
            // Limpiar localStorage
            localStorage.clear();
            
            // Redirigir al login después de un pequeño delay para asegurar que se ejecute
            setTimeout(() => {
              alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
              window.location.replace("/");
            }, 100);
          }
        } catch (parseError) {
          // Si no se puede parsear el JSON, podría ser un 401 sin body
          console.error('Error al parsear respuesta 401:', parseError);
        }
      }
      
      return response;
    };
    
    window.__FETCH_INTERCEPTOR_INSTALLED__ = true;
    console.log('✅ Interceptor de token instalado');
    
    // Cleanup: restaurar fetch original al desmontar
    return () => {
      window.fetch = originalFetch;
      window.__FETCH_INTERCEPTOR_INSTALLED__ = false;
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard-organizador" element={<DashboardOrganizador />} />
        <Route path="/editar-perfil" element={<EditProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/completar-perfil" element={<CompleteProfile />} />
        <Route path="/recuperar" element={<RecoverPassword />} />
        <Route path="/resetear" element={<ResetPassword />} />
        {/* Puedes agregar más rutas aquí si creas más componentes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;