const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface User {
  uuid: string;
  login: string;
  nome: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  session_conflict?: boolean;
  message?: string;
  active_sessions?: number;
  token?: string;
  expired_at?: string;
  user?: User;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  valid: boolean;
  user_uuid?: string;
  login?: string;
  role?: string;
}

export class AuthAPI {
  private static getAuthHeader(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  static async login(
    login: string,
    senha: string,
    action?: 'new_session' | 'invalidate_previous'
  ): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: JSON.stringify({ login, senha, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao fazer login');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        return { success: false, valid: false };
      }

      return await response.json();
    } catch (error) {
      console.error('Token validation error:', error);
      return { success: false, valid: false };
    }
  }

  static async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer logout');
      }

      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static async health(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}
