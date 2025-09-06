// services/apiService.js - Configuración base para llamadas a la API

class ApiService {
  constructor() {
    // Configurar la URL base según el entorno
    this.baseURL = import.meta.env.PROD 
      ? 'https://ref-zone.vercel.app'  // URL de producción de Vercel
      : '';  // En desarrollo usa el proxy de Vite
  }

  // Método auxiliar para manejar respuestas
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }
    
    // Verificar si hay contenido para parsear
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Método GET
  async get(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  }

  // Método POST
  async post(endpoint, data = {}, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw error;
    }
  }

  // Método PUT
  async put(endpoint, data = {}, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw error;
    }
  }

  // Método DELETE
  async delete(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error en DELETE ${endpoint}:`, error);
      throw error;
    }
  }

  // Método para subir archivos (FormData)
  async upload(endpoint, formData, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        body: formData, // No establecer Content-Type para FormData
        ...options
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error en UPLOAD ${endpoint}:`, error);
      throw error;
    }
  }
}

export default new ApiService();
