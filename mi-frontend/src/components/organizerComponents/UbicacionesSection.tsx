// @ts-nocheck
import React from 'react';
import type { Ubicacion } from '../../hooks/useDashboardOrganizador';

interface UbicacionesSectionProps {
  ubicaciones: Ubicacion[];
  onAdd: () => void;
  onEdit: (ubicacion: Ubicacion) => void;
  onDelete: (id: string) => void;
}

export const UbicacionesSection: React.FC<UbicacionesSectionProps> = ({
  ubicaciones,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="card mb-8">
      <div className="card-body">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-gray-800">Mis Ubicaciones</h3>
              <p className="text-sm text-gray-600">Gestiona las canchas donde organizas partidos</p>
            </div>
          </div>
          <button onClick={onAdd} className="btn btn-primary">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Nueva Ubicación
          </button>
        </div>

        {ubicaciones.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No tienes ubicaciones guardadas</h4>
            <p className="text-gray-600 mb-4">Agrega ubicaciones para usarlas al crear partidos</p>
            <button onClick={onAdd} className="btn btn-primary inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Agregar Primera Ubicación
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ubicaciones.map((ubicacion) => (
              <div key={ubicacion._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <svg className="w-5 h-5 text-purple-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                      <h4 className="text-base font-semibold text-gray-900 truncate">{ubicacion.nombre}</h4>
                    </div>
                    {ubicacion.direccion && (
                      <p className="text-xs text-gray-600 ml-7 mb-2 line-clamp-2" title={ubicacion.direccion}>
                        {ubicacion.direccion}
                      </p>
                    )}
                    {ubicacion.latitud && ubicacion.longitud && (
                      <a
                        href={`https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700 hover:underline ml-7 inline-flex items-center"
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                        Ver en Google Maps
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(ubicacion)}
                    className="flex-1 btn btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    title="Editar ubicación"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(ubicacion._id)}
                    className="flex-1 btn btn-sm btn-danger"
                    title="Eliminar ubicación"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
