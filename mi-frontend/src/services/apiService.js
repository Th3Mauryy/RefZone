import logger from '../utils/logger';

// Configuración de la URL base para la API
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction ? 'https://ref-zone.vercel.app/api' : 'http://localhost:5000/api';

logger.log('🔍 Environment check:', {
  hostname: window.location.hostname,
  isProduction: isProduction,
  API_BASE_URL: API_BASE_URL
});

// Función para obtener el token CSRF
export const getCSRFToken = async () => {
  try {
    logger.log('🔒 Solicitando CSRF token...');
    const response = await fetch(`${API_BASE_URL}/csrf-token`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    logger.log('✅ CSRF token recibido:', data);
    return data.csrfToken;
  } catch (error) {
    logger.error('❌ Error al obtener el token CSRF:', error);
    throw error;
  }
};

// Función para hacer peticiones POST con manejo de errores
export const apiPost = async (endpoint, data) => {
  try {
    logger.log(`🚀 Making POST request to: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    logger.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    logger.error(`❌ Error in POST ${endpoint}:`, error);
    throw error;
  }
};

// Función para hacer peticiones GET
export const apiGet = async (endpoint) => {
  try {
    logger.log(`🚀 Making GET request to: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
    });

    logger.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    logger.error(`❌ Error in GET ${endpoint}:`, error);
    throw error;
  }
};

// Función específica para login - CORREGIR RUTA
export const loginUser = async (userData) => {
  return apiPost('/auth/login', userData);  // CAMBIAR de /usuarios/login a /auth/login
};

// Función específica para registro
export const registerUser = async (userData) => {
  return apiPost('/auth/register', userData);
};

// Función para obtener perfil de usuario
export const getUserProfile = async () => {
  return apiGet('/auth/profile');
};

// Función para logout
export const logoutUser = async () => {
  return apiPost('/auth/logout', {});
};
