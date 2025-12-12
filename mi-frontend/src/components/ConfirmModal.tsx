import React from 'react';

type ConfirmModalType = 'danger' | 'warning' | 'info';

interface TypeClasses {
  icon: string;
  iconBg: string;
  iconColor: string;
  button: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmModalType;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}: ConfirmModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  const getTypeClasses = (): TypeClasses => {
    switch(type) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
      default:
        return {
          icon: '❓',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
        };
    }
  };

  const typeClasses = getTypeClasses();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto transform transition-all animate-slide-up">
        {/* Header con ícono */}
        <div className="flex items-start p-6">
          <div className={`flex-shrink-0 ${typeClasses.iconBg} rounded-full p-3 mr-4`}>
            <span className={`text-3xl ${typeClasses.iconColor}`}>{typeClasses.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${typeClasses.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
