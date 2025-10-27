// services/gameService.js - Gestión de partidos
import apiService from './apiService.js';

class GameService {
  // Obtener todos los partidos o filtrados por cancha
  async getGames(canchaFilter = 'todas') {
    try {
      const url = canchaFilter === 'todas' 
        ? '/api/games' 
        : `/api/games?cancha=${canchaFilter}`;
      return await apiService.get(url);
    } catch (error) {
      console.error('Error obteniendo partidos:', error);
      throw error;
    }
  }

  // Obtener partidos por cancha
  async getGamesByVenue(canchaId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.estado) queryParams.append('estado', filters.estado);
      if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin);

      const query = queryParams.toString();
      const endpoint = `/api/games/cancha/${canchaId}${query ? `?${query}` : ''}`;
      
      return await apiService.get(endpoint);
    } catch (error) {
      console.error('Error obteniendo partidos:', error);
      throw error;
    }
  }

  // Crear nuevo partido
  async createGame(gameData) {
    try {
      return await apiService.post('/api/games', gameData);
    } catch (error) {
      console.error('Error creando partido:', error);
      throw error;
    }
  }

  // Postularse a partido
  async applyToGame(gameId) {
    try {
      return await apiService.post(`/api/games/${gameId}/postular`);
    } catch (error) {
      console.error('Error postulándose al partido:', error);
      throw error;
    }
  }

  // Cancelar postulación
  async cancelApplication(gameId, userId) {
    try {
      return await apiService.post('/api/games/cancel-postulation', {
        gameId,
        userId
      });
    } catch (error) {
      console.error('Error cancelando postulación:', error);
      throw error;
    }
  }

  // Obtener postulantes de un partido
  async getGameApplicants(gameId) {
    try {
      return await apiService.get(`/api/games/${gameId}/postulantes`);
    } catch (error) {
      console.error('Error obteniendo postulantes:', error);
      throw error;
    }
  }

  // Asignar árbitro
  async assignReferee(gameId, arbitroId) {
    try {
      return await apiService.post(`/api/games/${gameId}/asignar-arbitro`, {
        arbitroId
      });
    } catch (error) {
      console.error('Error asignando árbitro:', error);
      throw error;
    }
  }

  // Cancelar partido
  async cancelGame(gameId, motivo) {
    try {
      return await apiService.post(`/api/games/${gameId}/cancelar`, {
        motivo
      });
    } catch (error) {
      console.error('Error cancelando partido:', error);
      throw error;
    }
  }

  // Completar partido
  async completeGame(gameId) {
    try {
      return await apiService.post(`/api/games/${gameId}/completar`);
    } catch (error) {
      console.error('Error completando partido:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats(canchaId) {
    try {
      return await apiService.get(`/api/estadisticas/${canchaId}`);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Obtener estadísticas para dashboard
  async getDashboardStats(canchaId) {
    try {
      return await apiService.get(`/api/dashboard/stats/${canchaId}`);
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      throw error;
    }
  }

  // Obtener historial
  async getHistorial(canchaId, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        canchaId,
        page: page.toString(),
        limit: limit.toString()
      });

      return await apiService.get(`/api/historial?${queryParams}`);
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  // Generar reporte PDF
  async generateReport(canchaId, fechaInicio = null, fechaFin = null) {
    try {
      const queryParams = new URLSearchParams({ canchaId });
      
      if (fechaInicio) queryParams.append('fechaInicio', fechaInicio);
      if (fechaFin) queryParams.append('fechaFin', fechaFin);

      // Abrir en nueva ventana para mostrar el HTML del reporte
      const url = `/api/reporte/${canchaId}?${queryParams}`;
      window.open(url, '_blank');
      
      return { success: true, message: 'Reporte generado exitosamente' };
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  }

  // Descargar reporte como archivo
  async downloadReport(canchaId, fechaInicio = null, fechaFin = null) {
    try {
      const queryParams = new URLSearchParams({ canchaId });
      
      if (fechaInicio) queryParams.append('fechaInicio', fechaInicio);
      if (fechaFin) queryParams.append('fechaFin', fechaFin);

      const url = `/api/reporte/${canchaId}/download?${queryParams}`;
      
      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, message: 'Descarga iniciada' };
    } catch (error) {
      console.error('Error descargando reporte:', error);
      throw error;
    }
  }
}

export default new GameService();
