import React, { ChangeEvent } from 'react';
import { Cancha, Ubicacion, GameWithCancha, ButtonState } from '../../types';

interface GamesTableProps {
  games: GameWithCancha[];
  canchas: Cancha[];
  ubicaciones: Ubicacion[];
  canchaSeleccionada: string;
  loading: boolean;
  applyingGames: Set<string>;
  onCanchaChange: (canchaId: string) => void;
  onRefresh: () => void;
  onApply: (gameId: string) => void;
  onCancelPostulation: (gameId: string) => void;
  formatDate: (date: string | undefined) => string;
  formatTime: (time: string | undefined) => string;
  getButtonState: (game: GameWithCancha) => ButtonState;
}

export function GamesTable({
  games,
  canchas,
  ubicaciones,
  canchaSeleccionada,
  loading,
  applyingGames,
  onCanchaChange,
  onRefresh,
  onApply,
  onCancelPostulation,
  formatDate,
  formatTime,
  getButtonState
}: GamesTableProps): React.ReactElement {
  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">Partidos Disponibles</h2>
            <p className="text-gray-600">Encuentra y postúlate a los partidos de fútbol 7 que mejor se adapten a tu horario</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button 
              onClick={onRefresh}
              className="btn btn-outline"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                </svg>
              )}
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Filtro de Canchas */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg border p-4">
          <div className="mb-3 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Filtrar por Cancha</h3>
            <p className="text-sm text-gray-600">Selecciona una cancha específica o ve todos los partidos</p>
          </div>
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
            </svg>
            <select 
              value={canchaSeleccionada}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => onCanchaChange(e.target.value)}
              className="select select-bordered w-full max-w-xs"
            >
              <option value="todas">🏟️ Todas las canchas</option>
              {canchas.map(cancha => (
                <option key={cancha._id} value={cancha._id}>
                  🏟️ {cancha.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
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
      )}

      {/* Games Table */}
      {!loading && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-display font-semibold text-gray-800">Lista de Partidos</h3>
            <p className="text-sm text-gray-600 mt-1">
              {games.length} partidos disponibles
            </p>
          </div>
          <div className="card-body p-0">
            {games.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Nombre del Partido</th>
                      <th>Cancha</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => {
                      const btn = getButtonState(game);
                      return (
                        <GameRow 
                          key={game._id}
                          game={game}
                          btn={btn}
                          ubicaciones={ubicaciones}
                          applyingGames={applyingGames}
                          onApply={onApply}
                          onCancelPostulation={onCancelPostulation}
                          formatDate={formatDate}
                          formatTime={formatTime}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="p-12 text-center">
      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
      <h4 className="text-lg font-medium text-gray-800 mb-2">No hay partidos disponibles</h4>
      <p className="text-gray-600">Los partidos aparecerán aquí cuando se publiquen nuevas oportunidades</p>
    </div>
  );
}

interface GameRowProps {
  game: GameWithCancha;
  btn: ButtonState;
  ubicaciones: Ubicacion[];
  applyingGames: Set<string>;
  onApply: (gameId: string) => void;
  onCancelPostulation: (gameId: string) => void;
  formatDate: (date: string | undefined) => string;
  formatTime: (time: string | undefined) => string;
}

function GameRow({
  game,
  btn,
  ubicaciones,
  applyingGames,
  onApply,
  onCancelPostulation,
  formatDate,
  formatTime
}: GameRowProps): React.ReactElement {
  const ubicacion = ubicaciones.find(ub => ub.nombre === game.location);
  
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
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
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-blue-700">
            {game.canchaId && typeof game.canchaId === 'object' && game.canchaId.nombre ? 
              game.canchaId.nombre : 
              "No disponible"}
          </span>
        </div>
      </td>
      <td>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
          </svg>
          {ubicacion?.latitud && ubicacion?.longitud ? (
            <a 
              href={`https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors inline-flex items-center gap-1"
              title="Ver en Google Maps"
            >
              {game.location}
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
              </svg>
            </a>
          ) : (
            <span className="text-gray-700">{game.location}</span>
          )}
        </div>
      </td>
      <td>
        {game.arbitro ? (
          <span className="badge badge-success">Árbitro Asignado</span>
        ) : (
          <span className="badge badge-warning">Buscando Árbitro</span>
        )}
      </td>
      <td>
        <div className="flex items-center space-x-2">
          <button
            className={`btn btn-sm text-white ${btn.color} transition-all duration-200`}
            disabled={btn.disabled || applyingGames.has(game._id)}
            onClick={btn.text === "Postularse" ? () => onApply(game._id) : undefined}
          >
            {applyingGames.has(game._id) ? (
              <>
                <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              btn.text
            )}
          </button>
          {btn.cancel && (
            <button 
              className="btn btn-sm btn-danger" 
              onClick={() => onCancelPostulation(game._id)}
            >
              Cancelar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
