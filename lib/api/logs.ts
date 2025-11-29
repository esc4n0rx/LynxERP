const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface LogEntry {
  uuid: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  app_code?: string;
  user_uuid?: string;
  user_name?: string;
  metadata?: Record<string, any>;
}

export interface LogsResponse {
  success: boolean;
  total: number;
  logs: LogEntry[];
}

export interface LogsSummary {
  app_code: string;
  total_logs: number;
  errors: number;
  warnings: number;
  info: number;
  debug: number;
}

export interface LogsSummaryResponse {
  success: boolean;
  summary: LogsSummary[];
}

export interface LogsFilters {
  app_code?: string;
  level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  user_uuid?: string;
  limit?: number;
  offset?: number;
}

export class LogsAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async getLogs(token: string, filters: LogsFilters = {}): Promise<LogsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.app_code) params.append('app_code', filters.app_code);
      if (filters.level) params.append('level', filters.level);
      if (filters.user_uuid) params.append('user_uuid', filters.user_uuid);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const queryString = params.toString();
      const url = `${API_BASE_URL}/logs${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  static async getRecentErrors(token: string, limit = 50): Promise<LogsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/logs/errors/recent?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar erros recentes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recent errors:', error);
      throw error;
    }
  }

  static async getSummary(token: string): Promise<LogsSummaryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/logs/summary`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar resumo de logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching logs summary:', error);
      throw error;
    }
  }
}
