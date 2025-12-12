import React from 'react';

interface ApplyModalProps {
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ApplyModal({ open, loading, onConfirm, onCancel }: ApplyModalProps): React.ReactElement | null {
  if (!open) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="text-lg font-display font-semibold text-gray-800">Confirmar Postulación</h3>
        </div>
        <div className="modal-body">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <p className="text-gray-800 font-medium">¿Deseas postularte para este partido?</p>
              <p className="text-sm text-gray-600">Una vez confirmado, el organizador podrá contactarte</p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="btn btn-primary" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              'Confirmar Postulación'
            )}
          </button>
          <button 
            className="btn btn-ghost" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

interface CancelModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelModal({ open, onConfirm, onCancel }: CancelModalProps): React.ReactElement | null {
  if (!open) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="text-lg font-display font-semibold text-gray-800">Cancelar Postulación</h3>
        </div>
        <div className="modal-body">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-gray-800 font-medium">¿Estás seguro de cancelar tu postulación?</p>
              <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={onConfirm}>
            Sí, Cancelar
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>
            No, Mantener
          </button>
        </div>
      </div>
    </div>
  );
}
