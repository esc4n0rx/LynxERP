const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface User {
  uuid: string;
  login: string;
  nome: string;
  email: string;
  cpf?: string;
  role: string;
  active: boolean;
  cargo?: string | null;
  online: boolean;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  allowed_modules?: string[];
  blocked_apps?: string[];
  last_login?: string | null;
  created_at?: string;
}

export interface CreateUserData {
  login: string;
  nome: string;
  email: string;
  cpf: string;
  role?: string;
  cargo?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  allowed_modules?: string[];
  blocked_apps?: string[];
}

export interface CreateUserResponse {
  uuid: string;
  login: string;
  email: string;
  temp_password: string;
  message: string;
}

export interface UpdateUserData {
  nome?: string;
  email?: string;
  role?: string;
  active?: boolean;
  cargo?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  allowed_modules?: string[];
  blocked_apps?: string[];
}

export class UsersAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async createUser(token: string, data: CreateUserData): Promise<CreateUserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/usuarios/create`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUsers(token: string): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/usuarios/list`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar usuários');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async getUser(token: string, uuid: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/usuarios/list/${uuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  static async updateUser(token: string, uuid: string, data: UpdateUserData): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/usuarios/list/${uuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/usuarios/list/${uuid}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async killSessions(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/usuarios/list/${uuid}/kill-sessions`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao derrubar sessões');
      }

      return await response.json();
    } catch (error) {
      console.error('Error killing sessions:', error);
      throw error;
    }
  }
}
