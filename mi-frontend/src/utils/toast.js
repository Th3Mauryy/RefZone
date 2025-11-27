import { toast } from 'react-toastify';

// Configuración global de toasts
const toastConfig = {
  position: "top-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Notificaciones de éxito
export const showSuccess = (message) => {
  toast.success(message, toastConfig);
};

// Notificaciones de error
export const showError = (message) => {
  toast.error(message, toastConfig);
};

// Notificaciones de advertencia
export const showWarning = (message) => {
  toast.warning(message, toastConfig);
};

// Notificaciones informativas
export const showInfo = (message) => {
  toast.info(message, toastConfig);
};

// Notificación personalizada con duración específica
export const showCustom = (message, type = 'info', duration = 3500) => {
  const config = { ...toastConfig, autoClose: duration };
  
  switch(type) {
    case 'success':
      toast.success(message, config);
      break;
    case 'error':
      toast.error(message, config);
      break;
    case 'warning':
      toast.warning(message, config);
      break;
    case 'info':
      toast.info(message, config);
      break;
    default:
      toast(message, config);
  }
};
