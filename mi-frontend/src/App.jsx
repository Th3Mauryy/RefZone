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

function App() {
  // Interceptor global para manejar errores 401 (token expirado)
  useEffect(() => {
    const originalFetch = window.fetch;
    let redirecting = false; // Evitar múltiples redirecciones
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Si es un 401 y estamos en una página protegida (no en login o register)
      const isProtectedPage = !['/register', '/recuperar', '/resetear'].includes(window.location.pathname) && window.location.pathname !== '/';
      
      if (response.status === 401 && isProtectedPage && !redirecting) {
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          
          // Si el error es de token expirado o inválido
          if (data.error === 'token_expired' || data.error === 'invalid_token' || data.message?.includes('expirado')) {
            redirecting = true;
            console.error('🔒 Token expirado/inválido detectado, cerrando sesión...');
            
            // Limpiar localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("userName");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userImage");
            
            // Redirigir al login
            alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            window.location.href = "/";
          }
        } catch {
          // Si no se puede parsear el JSON, ignorar
        }
      }
      
      return response;
    };
    
    // Cleanup: restaurar fetch original al desmontar
    return () => {
      window.fetch = originalFetch;
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