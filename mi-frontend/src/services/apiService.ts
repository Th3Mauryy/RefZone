import logger from '../utils/logger';
import type { LoginFormData, RegisterFormData, User, LoginResponse, ApiResponse } from '../types';

// Configuración de la URL base para la API
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction ? 'https://ref-zone.vercel.app/api' : 'http://localhost:5000/api';

logger.log('🔍 Environment check:', {
  hostname: window.location.hostname,
  isProduction: isProduction,
  API_BASE_URL: API_BASE_URL
});

// Función para obtener el token CSRF
export const getCSRFToken = async (): Promise<string> => {
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
export const apiPost = async <T = unknown>(endpoint: string, data?: unknown): Promise<T> => {
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
    return result as T;
  } catch (error) {
    logger.error(`❌ Error in POST ${endpoint}:`, error);
    throw error;
  }
};

// Función para hacer peticiones GET
export const apiGet = async <T = unknown>(endpoint: string): Promise<T> => {
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
    return result as T;
  } catch (error) {
    logger.error(`❌ Error in GET ${endpoint}:`, error);
    throw error;
  }
};

// Función específica para login
export const loginUser = async (userData: LoginFormData): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/auth/login', userData);
};

// Función específica para registro
export const registerUser = async (userData: RegisterFormData): Promise<ApiResponse> => {
  return apiPost<ApiResponse>('/auth/register', userData);
};

// Función para obtener perfil de usuario
export const getUserProfile = async (): Promise<User> => {
  return apiGet<User>('/auth/profile');
};

// Función para logout
export const logoutUser = async (): Promise<ApiResponse> => {
  return apiPost<ApiResponse>('/auth/logout', {});
};

export default {
  getCSRFToken,
  apiPost,
  apiGet,
  loginUser,
  registerUser,
  getUserProfile,
  logoutUser,
  API_BASE_URL
};
