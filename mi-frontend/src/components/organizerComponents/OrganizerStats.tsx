// @ts-nocheck
import React from 'react';
import type { Stats, Arbitro } from '../../hooks/useDashboardOrganizador';

interface OrganizerStatsProps {
  stats: Stats;
  pendientesCalificacion: Array<{ _id: string; nombre?: string; arbitro?: Arbitro }>;
  onCalificar: (partido: any) => void;
}

export const OrganizerStats: React.FC<OrganizerStatsProps> = ({ 
  stats, 
  pendientesCalificacion, 
  onCalificar 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Partidos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Próximos Partidos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sin Árbitro</p>
              <p className="text-3xl font-bold text-gray-900">{stats.needsReferee}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`card ${pendientesCalificacion.length > 0 ? 'ring-2 ring-yellow-400' : ''}`}>
        <div className="card-body">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Por Calificar</p>
              <p className="text-3xl font-bold text-gray-900">{pendientesCalificacion.length}</p>
              {pendientesCalificacion.length > 0 && (
                <button
                  onClick={() => onCalificar(pendientesCalificacion[0])}
                  className="text-xs text-yellow-600 hover:text-yellow-700 font-medium mt-1 flex items-center"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                  </svg>
                  Calificar ahora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
