// @ts-nocheck
import React from 'react';
import type { User } from '../../hooks/useDashboardOrganizador';

interface OrganizerHeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const OrganizerHeader: React.FC<OrganizerHeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-100">
      <div className="container mx-auto">
        <div className="flex items-center justify-between py-4">
          {/* Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-gray-800">RefZone Admin</h1>
                <p className="text-sm text-gray-600">
                  {user?.canchaAsignada && (
                    <span className="text-green-600 font-medium">{user.canchaAsignada.nombre}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <img 
                  src={user?.imagenPerfil || "/img/perfil1.png"} 
                  alt="Perfil" 
                  className="w-10 h-10 rounded-full border-2 border-primary-200 object-cover cursor-pointer transition-all duration-200 hover:border-primary-400 hover:shadow-md"
                  onClick={() => window.location.href = "/editar-perfil"}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-200">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">{user?.nombre || user?.name || "Admin"}</p>
                <p className="text-xs text-gray-600">Organizador</p>
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="btn btn-ghost btn-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
              </svg>
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
