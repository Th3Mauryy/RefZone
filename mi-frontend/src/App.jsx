import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import DashboardOrganizador from "./components/DashboardOrganizador";
import EditProfile from "./components/EditProfile";
import CompleteProfile from "./components/CompleteProfile";
import RecoverPassword from "./components/RecoverPassword";
import ResetPassword from "./components/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard-organizador" element={<DashboardOrganizador />} />
        <Route path="/editar-perfil" element={<EditProfile />} />
        <Route path="/completar-perfil" element={<CompleteProfile />} />
        <Route path="/recuperar" element={<RecoverPassword />} />
        <Route path="/resetear" element={<ResetPassword />} />
        {/* Puedes agregar más rutas aquí si creas más componentes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;