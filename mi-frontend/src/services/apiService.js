// Configuración de la URL base para la API
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction
  ? '/api'  // En producción (Vercel) - Frontend y Backend en mismo dominio
  : 'http://localhost:5000/api';  // En desarrollo local

console.log('🔍 Environment check:', {
  hostname: window.location.hostname,
  isProduction: isProduction,
  API_BASE_URL: API_BASE_URL
});

// Función para obtener el token CSRF
export const getCSRFToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    return null;
  }
};

// Función para hacer peticiones POST con manejo de errores
export const apiPost = async (endpoint, data) => {
  try {
    console.log(`🚀 Making POST request to: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`❌ Error in POST ${endpoint}:`, error);
    throw error;
  }
};

// Función para hacer peticiones GET
export const apiGet = async (endpoint) => {
  try {
    console.log(`🚀 Making GET request to: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`❌ Error in GET ${endpoint}:`, error);
    throw error;
  }
};

// Función específica para login
export const loginUser = async (userData) => {
  return apiPost('/auth/login', userData);
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
