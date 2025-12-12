import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardUser } from '../../types';

interface DashboardHeaderProps {
  user: DashboardUser;
  onLogout: () => void;
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps): React.ReactElement {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white shadow-lg border-b border-gray-100">
      <div className="container mx-auto">
        <div className="flex items-center justify-between py-4">
          {/* Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-gray-800">RefZone</h1>
                <p className="text-sm text-gray-600">Panel de Árbitro</p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <img 
                  src={user.imagenPerfil || "/img/perfil1.png"} 
                  alt="Perfil" 
                  className="w-10 h-10 rounded-full border-2 border-primary-200 object-cover cursor-pointer transition-all duration-200 hover:border-primary-400 hover:shadow-md"
                  onClick={() => navigate('/edit-profile')}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-200">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">¡Hola! {user.nombre}</p>
                <p className="text-xs text-gray-600">Árbitro</p>
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
}
