// services/gameService.ts - Gestión de partidos
import apiService from './apiService';
import type { Game, GameFormData, ApiResponse } from '../types';

interface GameFilters {
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface StatsResponse {
  totalPartidos: number;
  partidosProgramados: number;
  partidosFinalizados: number;
  [key: string]: unknown;
}

interface HistorialResponse {
  partidos: unknown[];
  total: number;
  page: number;
  totalPages: number;
}

class GameService {
  // Obtener todos los partidos o filtrados por cancha
  async getGames(canchaFilter: string = 'todas'): Promise<Game[]> {
    try {
      const url = canchaFilter === 'todas' 
        ? '/games' 
        : `/games?cancha=${canchaFilter}`;
      return await apiService.apiGet<Game[]>(url);
    } catch (error) {
      console.error('Error obteniendo partidos:', error);
      throw error;
    }
  }

  // Obtener partidos por cancha
  async getGamesByVenue(canchaId: string, filters: GameFilters = {}): Promise<Game[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.estado) queryParams.append('estado', filters.estado);
      if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin);

      const query = queryParams.toString();
      const endpoint = `/games/cancha/${canchaId}${query ? `?${query}` : ''}`;
      
      return await apiService.apiGet<Game[]>(endpoint);
    } catch (error) {
      console.error('Error obteniendo partidos:', error);
      throw error;
    }
  }

  // Crear nuevo partido
  async createGame(gameData: GameFormData): Promise<Game> {
    try {
      return await apiService.apiPost<Game>('/games', gameData);
    } catch (error) {
      console.error('Error creando partido:', error);
      throw error;
    }
  }

  // Postularse a partido
  async applyToGame(gameId: string): Promise<ApiResponse> {
    try {
      return await apiService.apiPost<ApiResponse>(`/games/${gameId}/postular`);
    } catch (error) {
      console.error('Error postulándose al partido:', error);
      throw error;
    }
  }

  // Cancelar postulación
  async cancelApplication(gameId: string, userId: string): Promise<ApiResponse> {
    try {
      return await apiService.apiPost<ApiResponse>('/games/cancel-postulation', {
        gameId,
        userId
      });
    } catch (error) {
      console.error('Error cancelando postulación:', error);
      throw error;
    }
  }

  // Obtener postulantes de un partido
  async getGameApplicants(gameId: string): Promise<unknown[]> {
    try {
      return await apiService.apiGet<unknown[]>(`/games/${gameId}/postulantes`);
    } catch (error) {
      console.error('Error obteniendo postulantes:', error);
      throw error;
    }
  }

  // Asignar árbitro
  async assignReferee(gameId: string, arbitroId: string): Promise<ApiResponse> {
    try {
      return await apiService.apiPost<ApiResponse>(`/games/${gameId}/asignar-arbitro`, {
        arbitroId
      });
    } catch (error) {
      console.error('Error asignando árbitro:', error);
      throw error;
    }
  }

  // Cancelar partido
  async cancelGame(gameId: string, motivo: string): Promise<ApiResponse> {
    try {
      return await apiService.apiPost<ApiResponse>(`/games/${gameId}/cancelar`, {
        motivo
      });
    } catch (error) {
      console.error('Error cancelando partido:', error);
      throw error;
    }
  }

  // Completar partido
  async completeGame(gameId: string): Promise<ApiResponse> {
    try {
      return await apiService.apiPost<ApiResponse>(`/games/${gameId}/completar`);
    } catch (error) {
      console.error('Error completando partido:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats(canchaId: string): Promise<StatsResponse> {
    try {
      return await apiService.apiGet<StatsResponse>(`/estadisticas/${canchaId}`);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Obtener estadísticas para dashboard
  async getDashboardStats(canchaId: string): Promise<StatsResponse> {
    try {
      return await apiService.apiGet<StatsResponse>(`/dashboard/stats/${canchaId}`);
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error);
      throw error;
    }
  }

  // Obtener historial
  async getHistorial(canchaId: string, page: number = 1, limit: number = 10): Promise<HistorialResponse> {
    try {
      const queryParams = new URLSearchParams({
        canchaId,
        page: page.toString(),
        limit: limit.toString()
      });

      return await apiService.apiGet<HistorialResponse>(`/historial?${queryParams}`);
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  // Generar reporte PDF
  async generateReport(canchaId: string, fechaInicio: string | null = null, fechaFin: string | null = null): Promise<ApiResponse> {
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
  async downloadReport(canchaId: string, fechaInicio: string | null = null, fechaFin: string | null = null): Promise<ApiResponse> {
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
