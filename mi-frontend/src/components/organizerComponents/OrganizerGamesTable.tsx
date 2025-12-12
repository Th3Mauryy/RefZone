// @ts-nocheck
import React from 'react';
import type { Game, Ubicacion } from '../../hooks/useDashboardOrganizador';

interface OrganizerGamesTableProps {
  games: Game[];
  loading: boolean;
  ubicaciones: Ubicacion[];
  onAdd: () => void;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
  onViewPostulados: (id: string) => void;
  onSustituir: (game: Game) => void;
  onViewArbitro: (arbitro: any) => void;
  formatDate: (date: string | Date | null) => string;
  formatTime: (time: string | null) => string;
  haIniciado: (game: Game) => boolean;
}

export const OrganizerGamesTable: React.FC<OrganizerGamesTableProps> = ({
  games,
  loading,
  ubicaciones,
  onAdd,
  onEdit,
  onDelete,
  onViewPostulados,
  onSustituir,
  onViewArbitro,
  formatDate,
  formatTime,
  haIniciado,
}) => {
  const hasGames = games?.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="card-body">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-display font-semibold text-gray-800">Lista de Partidos</h3>
        <p className="text-sm text-gray-600 mt-1">
          {hasGames ? `${games.length} partidos registrados` : 'No hay partidos registrados'}
        </p>
      </div>
      <div className="card-body p-0">
        {!hasGames ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <h4 className="text-lg font-medium text-gray-800 mb-2">No hay partidos registrados</h4>
            <p className="text-gray-600 mb-4">Comienza agregando tu primer partido de fútbol 7</p>
            <button onClick={onAdd} className="btn btn-primary">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Agregar Primer Partido
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Nombre del Partido</th>
                  <th>Ubicación</th>
                  <th>Cancha</th>
                  <th>Árbitro Asignado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{formatDate(game.date)}</span>
                        <span className="badge badge-primary text-xs">{formatTime(game.time)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">{game.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                        {(() => {
                          const ubicacion = ubicaciones.find(ub => ub.nombre === game.location);
                          if (ubicacion && ubicacion.latitud && ubicacion.longitud) {
                            return (
                              <a 
                                href={`https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
                                title="Ver en Google Maps"
                              >
                                {game.location}
                                <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                                </svg>
                              </a>
                            );
                          }
                          return <span className="text-gray-700">{game.location}</span>;
                        })()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-blue-700">
                          {game.canchaId && game.canchaId.nombre ? game.canchaId.nombre : "No disponible"}
                        </span>
                      </div>
                    </td>
                    <td>
                      {game.arbitro ? (
                        <button
                          onClick={() => onViewArbitro(game.arbitro)}
                          className="badge badge-success hover:bg-green-600 transition-colors cursor-pointer"
                        >
                          {game.arbitro.nombre || game.arbitro.email}
                        </button>
                      ) : (
                        <span className="badge badge-warning">Sin asignar</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="btn btn-sm btn-outline" 
                          onClick={() => onEdit(game)}
                          disabled={haIniciado(game)}
                          title={haIniciado(game) ? 'No se puede editar un partido que ya inició' : 'Editar partido'}
                        >
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                          </svg>
                          Editar
                        </button>
                        
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => onDelete(game._id)}
                          disabled={haIniciado(game)}
                          title={haIniciado(game) ? 'No se puede eliminar un partido que ya inició' : 'Eliminar partido'}
                        >
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          Eliminar
                        </button>
                        
                        {!game.arbitro && (
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => onViewPostulados(game._id)}
                            disabled={haIniciado(game)}
                            title={haIniciado(game) ? 'No se puede asignar árbitro a un partido que ya inició' : 'Ver árbitros postulados'}
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12a1 1 0 000 2h2a1 1 0 100-2H9zm-4-7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1H5zm0 2v8h10V7H5z"/>
                            </svg>
                            Ver Postulados
                          </button>
                        )}
                        
                        {game.arbitro && (
                          <button 
                            className="btn btn-sm btn-warning" 
                            onClick={() => onSustituir(game)}
                            disabled={haIniciado(game)}
                            title={haIniciado(game) ? 'No se puede sustituir árbitro en un partido que ya inició' : 'Sustituir árbitro asignado'}
                          >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                            </svg>
                            Sustituir Árbitro
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
