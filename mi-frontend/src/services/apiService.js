import axios from 'axios';

// Configuración de la URL base para la API
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // En producción (Vercel) - Frontend y Backend en mismo dominio
  : 'http://localhost:5000/api';  // En desarrollo local

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Clase ApiService simplificada con axios
class ApiService {
  // Método GET
  async get(endpoint, config = {}) {
    try {
      const response = await api.get(endpoint, config);
      return response.data;
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  }

  // Método POST
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await api.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw error;
    }
  }

  // Método PUT
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await api.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw error;
    }
  }

  // Método DELETE
  async delete(endpoint, config = {}) {
    try {
      const response = await api.delete(endpoint, config);
      return response.data;
    } catch (error) {
      console.error(`Error en DELETE ${endpoint}:`, error);
      throw error;
    }
  }

  // Método para subir archivos
  async upload(endpoint, formData, config = {}) {
    try {
      const response = await api.post(endpoint, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config.headers,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error en UPLOAD ${endpoint}:`, error);
      throw error;
    }
  }
}

export default new ApiService();
