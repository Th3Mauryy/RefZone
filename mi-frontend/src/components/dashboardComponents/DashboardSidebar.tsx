import React from 'react';

export function DashboardSidebar(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Tips Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-display font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Consejos para Árbitros
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-2">Preparación Mental</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mantén la calma bajo presión</li>
                <li>• Comunica claramente con jugadores</li>
                <li>• Conoce las reglas a fondo</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-2">Posicionamiento</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ubícate eficazmente para seguir el juego</li>
                <li>• Gestiona el ritmo del partido</li>
                <li>• Mantén la vista en la pelota</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Quick Reference */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-display font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            Reglas Rápidas
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <h5 className="font-medium text-red-800 mb-1">Mano</h5>
              <p className="text-sm text-red-700">Contacto intencional mano/brazo-balón es falta</p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-800 mb-1">Saque de banda</h5>
              <p className="text-sm text-blue-700">Ambos pies deben estar en el suelo</p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 className="font-medium text-yellow-800 mb-1">Tarjetas</h5>
              <p className="text-sm text-yellow-700">Faltas graves ⇒ amarilla/roja</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-display font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
            Soporte
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-gray-800">Teléfono:</strong>
              <p className="text-gray-600">+52 312 100 1096</p>
            </div>
            <div>
              <strong className="text-gray-800">Email:</strong>
              <p className="text-gray-600">contacto@refzone.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
