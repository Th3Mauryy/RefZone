import { toast, ToastOptions } from 'react-toastify';

type ToastType = 'success' | 'error' | 'warning' | 'info';

// Configuración global de toasts
const toastConfig: ToastOptions = {
  position: "top-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Notificaciones de éxito
export const showSuccess = (message: string): void => {
  toast.success(message, toastConfig);
};

// Notificaciones de error
export const showError = (message: string): void => {
  toast.error(message, toastConfig);
};

// Notificaciones de advertencia
export const showWarning = (message: string): void => {
  toast.warning(message, toastConfig);
};

// Notificaciones informativas
export const showInfo = (message: string): void => {
  toast.info(message, toastConfig);
};

// Notificación personalizada con duración específica
export const showCustom = (message: string, type: ToastType = 'info', duration: number = 3500): void => {
  const config: ToastOptions = { ...toastConfig, autoClose: duration };
  
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

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showCustom
};
