// @ts-nocheck
import React from 'react';
import type { 
  Game, GameErrors, Ubicacion, Arbitro, 
  PostuladosModal, HistorialModal, ArbitroDetalleModal,
  SustitucionModal, CalificacionModal, UbicacionModal, ReporteModal,
  User
} from '../../hooks/useDashboardOrganizador';

// ============================================
// GAME MODAL
// ============================================
interface GameModalProps {
  open: boolean;
  title: string;
  currentGame: { name: string; date: string; time: string; location: string; ubicacionId: string };
  gameErrors: GameErrors;
  ubicaciones: Ubicacion[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onGameChange: (game: any) => void;
  onErrorChange: (errors: GameErrors) => void;
}

export const GameModal: React.FC<GameModalProps> = ({
  open, title, currentGame, gameErrors, ubicaciones,
  onClose, onSave, onGameChange, onErrorChange
}) => {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="modal-header">
          <h3 className="text-lg font-display font-semibold text-gray-800">{title}</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSave} className="space-y-6">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nombre del Partido</label>
              <input
                type="text"
                id="name"
                className={`form-input ${gameErrors.name ? 'border-red-500' : ''}`}
                placeholder="Ej: Liga Regional - Fecha 5"
                value={currentGame.name}
                onChange={(e) => {
                  onGameChange({ ...currentGame, name: e.target.value });
                  if (gameErrors.name) onErrorChange({ ...gameErrors, name: "" });
                }}
                required
              />
              {gameErrors.name && <p className="form-error">{gameErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="date" className="form-label">Fecha</label>
                <input
                  type="date"
                  id="date"
                  className={`form-input ${gameErrors.date ? 'border-red-500' : ''}`}
                  value={currentGame.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    onGameChange({ ...currentGame, date: e.target.value });
                    if (gameErrors.date) onErrorChange({ ...gameErrors, date: "" });
                  }}
                  required
                />
                {gameErrors.date && <p className="form-error">{gameErrors.date}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="time" className="form-label">Hora</label>
                <input
                  type="time"
                  id="time"
                  className={`form-input ${gameErrors.time ? 'border-red-500' : ''}`}
                  value={currentGame.time}
                  onChange={(e) => {
                    onGameChange({ ...currentGame, time: e.target.value });
                    if (gameErrors.time) onErrorChange({ ...gameErrors, time: "" });
                  }}
                  required
                />
                {gameErrors.time && <p className="form-error">{gameErrors.time}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">Ubicación</label>
              <select
                id="location"
                className={`form-input ${gameErrors.location ? 'border-red-500' : ''}`}
                value={currentGame.ubicacionId || currentGame.location}
                onChange={(e) => {
                  const selectedUbicacion = ubicaciones.find(ub => ub._id === e.target.value);
                  onGameChange({ 
                    ...currentGame, 
                    location: selectedUbicacion ? selectedUbicacion.nombre : '',
                    ubicacionId: e.target.value 
                  });
                  if (gameErrors.location) onErrorChange({ ...gameErrors, location: "" });
                }}
                required
              >
                <option value="">Selecciona una ubicación</option>
                {ubicaciones.map((ub) => (
                  <option key={ub._id} value={ub._id}>{ub.nombre}</option>
                ))}
              </select>
              {gameErrors.location && <p className="form-error">{gameErrors.location}</p>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================
// POSTULADOS MODAL
// ============================================
interface PostuladosModalProps {
  modal: PostuladosModal;
  onClose: () => void;
  onAssign: (gameId: string, arbitroId: string) => void;
  onViewHistorial: (arbitro: Arbitro) => void;
}

export const PostuladosModalComponent: React.FC<PostuladosModalProps> = ({
  modal, onClose, onAssign, onViewHistorial
}) => {
  if (!modal.open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="modal-header">
          <h3 className="text-lg font-display font-semibold text-gray-800">Árbitros Postulados</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {modal.postulados.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"/>
              </svg>
              <p className="text-gray-600">No hay árbitros postulados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modal.postulados.map((arbitro) => (
                <div key={arbitro._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-green-300 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                      {arbitro.imagenPerfil ? (
                        <img src={arbitro.imagenPerfil} alt={arbitro.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                          {arbitro.nombre?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{arbitro.nombre || arbitro.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < Math.round(arbitro.calificacionPromedio || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          ({arbitro.totalCalificaciones || 0} calificaciones)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewHistorial(arbitro)}
                      className="btn btn-sm btn-secondary"
                    >
                      Ver Historial
                    </button>
                    <button
                      onClick={() => modal.gameId && onAssign(modal.gameId, arbitro._id)}
                      className="btn btn-sm btn-primary"
                    >
                      Asignar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ARBITRO DETALLE MODAL
// ============================================
interface ArbitroDetalleModalProps {
  modal: ArbitroDetalleModal;
  onClose: () => void;
}

export const ArbitroDetalleModalComponent: React.FC<ArbitroDetalleModalProps> = ({ modal, onClose }) => {
  if (!modal.open || !modal.arbitro) return null;
  const { arbitro } = modal;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="modal-header bg-gradient-to-r from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-bold">Información del Árbitro</h3>
          <button className="text-white hover:text-gray-200" onClick={onClose}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {/* Avatar y nombre */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
              {arbitro.imagenPerfil ? (
                <img src={arbitro.imagenPerfil} alt={arbitro.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl font-bold">
                  {arbitro.nombre?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <h4 className="text-xl font-bold text-gray-900">{arbitro.nombre}</h4>
            
            {/* Calificación */}
            <div className="flex items-center mt-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-5 h-5 ${i < Math.round(arbitro.calificacionPromedio || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
              <span className="ml-2 text-gray-600">
                {(arbitro.calificacionPromedio || 0).toFixed(1)} ({arbitro.totalCalificaciones || 0})
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <p className="text-xs text-green-600 font-semibold uppercase">Correo</p>
              <p className="text-sm text-gray-900">{arbitro.email || 'No disponible'}</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
              <p className="text-xs text-orange-600 font-semibold uppercase">Contacto</p>
              <p className="text-sm text-gray-900">{arbitro.contacto || 'No disponible'}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-xs text-purple-600 font-semibold uppercase">Experiencia</p>
              <p className="text-sm text-gray-700">{arbitro.experiencia || 'No disponible'}</p>
            </div>
          </div>
        </div>
        <div className="modal-footer bg-gray-50">
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CALIFICACION MODAL
// ============================================
interface CalificacionModalProps {
  modal: CalificacionModal;
  onClose: () => void;
  onChange: (modal: CalificacionModal) => void;
  onSubmit: () => void;
}

export const CalificacionModalComponent: React.FC<CalificacionModalProps> = ({
  modal, onClose, onChange, onSubmit
}) => {
  if (!modal.open || !modal.arbitro) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="modal-header bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <h3 className="text-lg font-bold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Calificar Árbitro
          </h3>
        </div>
        <div className="modal-body">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 text-sm">📋 Partido Finalizado</h4>
            <p className="text-sm text-blue-800"><strong>{modal.partido?.nombre}</strong></p>
          </div>

          <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-lg">
              {modal.arbitro.imagenPerfil ? (
                <img src={modal.arbitro.imagenPerfil} alt={modal.arbitro.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {modal.arbitro.nombre?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{modal.arbitro.nombre}</h4>
              <p className="text-xs text-gray-600">{modal.arbitro.email}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label mb-2">Calificación *</label>
            <div className="flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onChange({ ...modal, estrellas: star })}
                  disabled={modal.loading}
                  className="transition-all transform hover:scale-110"
                >
                  <svg 
                    className={`w-10 h-10 ${star <= modal.estrellas ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label">Comentarios (opcional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Escribe aquí tus comentarios..."
              value={modal.comentario}
              onChange={(e) => onChange({ ...modal, comentario: e.target.value })}
              disabled={modal.loading}
              maxLength={500}
            />
          </div>
        </div>
        <div className="modal-footer">
          {!modal.loading && (
            <button className="btn btn-danger" onClick={onClose}>Cancelar</button>
          )}
          <button 
            className="btn btn-primary bg-gradient-to-r from-yellow-500 to-orange-500" 
            onClick={onSubmit}
            disabled={modal.loading || modal.estrellas === 0}
          >
            {modal.loading ? 'Enviando...' : 'Enviar Calificación'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// UBICACION MODAL
// ============================================
interface UbicacionModalProps {
  modal: UbicacionModal;
  onClose: () => void;
  onChange: (modal: UbicacionModal) => void;
  onSave: () => void;
}

export const UbicacionModalComponent: React.FC<UbicacionModalProps> = ({
  modal, onClose, onChange, onSave
}) => {
  if (!modal.open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="modal-header">
          <h3 className="text-lg font-display font-semibold text-gray-800">
            {modal.editingId ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Nombre de la Cancha *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Cancha Principal"
                value={modal.nombre}
                onChange={(e) => onChange({ ...modal, nombre: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dirección *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dirección completa"
                value={modal.direccion}
                onChange={(e) => onChange({ ...modal, direccion: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ubicación en el Mapa *</label>
              <p className="text-sm text-gray-600 mb-2">Haz clic en el mapa para marcar la ubicación exacta</p>
              <div id="ubicacion-map" className="w-full h-64 rounded-lg border border-gray-300"></div>
              {modal.latitud && modal.longitud && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    📍 {modal.latitud.toFixed(6)}, {modal.longitud.toFixed(6)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onChange({ ...modal, marcadorColocado: true })}
                    className={`btn btn-sm ${modal.marcadorColocado ? 'btn-success' : 'btn-primary'}`}
                  >
                    {modal.marcadorColocado ? '✓ Ubicación confirmada' : '📌 Confirmar ubicación'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button 
            className="btn btn-primary" 
            onClick={onSave}
            disabled={modal.saving}
          >
            {modal.saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUSTITUCION MODAL
// ============================================
interface SustitucionModalProps {
  modal: SustitucionModal;
  onClose: () => void;
  onChange: (modal: SustitucionModal) => void;
  onSustituir: () => void;
  onDesasignar: () => void;
}

export const SustitucionModalComponent: React.FC<SustitucionModalProps> = ({
  modal, onClose, onChange, onSustituir, onDesasignar
}) => {
  if (!modal.open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="modal-header bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <h3 className="text-lg font-bold">Gestionar Árbitro</h3>
          <button className="text-white hover:text-gray-200" onClick={onClose}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm"><strong>Partido:</strong> {modal.gameName}</p>
            <p className="text-sm"><strong>Árbitro actual:</strong> {modal.arbitroActual?.nombre}</p>
          </div>

          {modal.postulados.length > 0 && (
            <div className="form-group mb-4">
              <label className="form-label">Nuevo Árbitro</label>
              <select
                className="form-input"
                value={modal.nuevoArbitroId}
                onChange={(e) => onChange({ ...modal, nuevoArbitroId: e.target.value })}
              >
                <option value="">Seleccionar árbitro...</option>
                {modal.postulados.map((arb) => (
                  <option key={arb._id} value={arb._id}>{arb.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Razón del cambio *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Mínimo 10 caracteres"
              value={modal.razon}
              onChange={(e) => onChange({ ...modal, razon: e.target.value })}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={onDesasignar} disabled={modal.loading}>
            Desasignar
          </button>
          {modal.postulados.length > 0 && (
            <button 
              className="btn btn-primary" 
              onClick={onSustituir} 
              disabled={modal.loading || !modal.nuevoArbitroId}
            >
              {modal.loading ? 'Procesando...' : 'Sustituir'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// HISTORIAL MODAL
// ============================================
interface HistorialModalProps {
  modal: HistorialModal;
  onClose: () => void;
}

export const HistorialModalComponent: React.FC<HistorialModalProps> = ({ modal, onClose }) => {
  if (!modal.open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="modal-header">
          <h3 className="text-lg font-display font-semibold text-gray-800">
            Historial de {modal.arbitro?.nombre}
          </h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {modal.loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : modal.historial.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Sin historial de partidos</p>
          ) : (
            <div className="space-y-3">
              {modal.historial.map((partido) => (
                <div key={partido._id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{partido.nombre}</p>
                      <p className="text-sm text-gray-600">{partido.fecha} - {partido.hora}</p>
                    </div>
                    {partido.calificacion !== undefined && partido.calificacion > 0 && (
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="font-semibold text-yellow-700">{partido.calificacion}/5</span>
                      </div>
                    )}
                  </div>
                  {partido.comentario && (
                    <p className="text-sm text-gray-500 mt-2 italic">"{partido.comentario}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// REPORTE MODAL
// ============================================
interface ReporteModalProps {
  modal: ReporteModal;
  onClose: () => void;
  onChange: (modal: ReporteModal) => void;
  onDownload: (mes: number, ano: number) => void;
}

export const ReporteModalComponent: React.FC<ReporteModalProps> = ({
  modal, onClose, onChange, onDownload
}) => {
  if (!modal.open) return null;

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="modal-header">
          <h3 className="text-lg font-display font-semibold text-gray-800">Historial de Partidos</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-group">
              <label className="form-label">Mes</label>
              <select
                className="form-input"
                value={modal.mes}
                onChange={(e) => onChange({ ...modal, mes: parseInt(e.target.value) })}
              >
                {meses.map((mes, i) => (
                  <option key={i} value={i + 1}>{mes}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Año</label>
              <select
                className="form-input"
                value={modal.ano}
                onChange={(e) => onChange({ ...modal, ano: parseInt(e.target.value) })}
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button 
            className="btn btn-primary" 
            onClick={() => onDownload(modal.mes, modal.ano)}
            disabled={modal.cargando}
          >
            {modal.cargando ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
