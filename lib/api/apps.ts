const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface App {
  internal_code: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  route_prefix: string;
  enabled: boolean;
  routes_count: number;
}

export interface AppRoute {
  path: string;
  method: string;
  description?: string;
  permissions?: string[];
}

export interface RediscoverStats {
  discovered: number;
  registered: number;
  updated: number;
}

export class AppsAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async getApps(token: string, includeDisabled = false): Promise<{ success: boolean; total: number; apps: App[] }> {
    try {
      const url = `${API_BASE_URL}/apps${includeDisabled ? '?include_disabled=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar apps');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching apps:', error);
      throw error;
    }
  }

  static async getApp(token: string, internalCode: string): Promise<{ success: boolean; app: App }> {
    try {
      const response = await fetch(`${API_BASE_URL}/apps/${internalCode}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar app');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching app:', error);
      throw error;
    }
  }

  static async getAppRoutes(token: string, internalCode: string): Promise<{ success: boolean; app_code: string; total_routes: number; routes: AppRoute[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/apps/${internalCode}/routes`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar rotas do app');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching app routes:', error);
      throw error;
    }
  }

  static async activateApp(token: string, internalCode: string): Promise<{ success: boolean; message: string; routes_loaded: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/apps/${internalCode}/activate`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao ativar app');
      }

      return await response.json();
    } catch (error) {
      console.error('Error activating app:', error);
      throw error;
    }
  }

  static async deactivateApp(token: string, internalCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/apps/${internalCode}/deactivate`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao desativar app');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deactivating app:', error);
      throw error;
    }
  }

  static async rediscoverApps(token: string): Promise<{ success: boolean; stats: RediscoverStats }> {
    try {
      const response = await fetch(`${API_BASE_URL}/apps/rediscover`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao redescobrir apps');
      }

      return await response.json();
    } catch (error) {
      console.error('Error rediscovering apps:', error);
      throw error;
    }
  }
}
