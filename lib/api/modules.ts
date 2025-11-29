const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface Module {
  uuid: string;
  parent_uuid: string | null;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  rota?: string;
  level: number;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  apps?: App[];
  children?: Module[];
}

export interface App {
  uuid?: string;
  internal_code: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  route_prefix: string;
  enabled: boolean;
  routes_count: number;
}

export interface CreateModuleData {
  parent_uuid?: string;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  rota?: string;
  ordem?: number;
  ativo?: boolean;
}

export interface UpdateModuleData {
  nome?: string;
  slug?: string;
  descricao?: string;
  icone?: string;
  rota?: string;
  ordem?: number;
  ativo?: boolean;
}

export class ModulesAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async getModulesTree(token: string, includeInactive = false): Promise<{ success: boolean; total_roots: number; tree: Module[] }> {
    try {
      const url = `${API_BASE_URL}/modules/tree${includeInactive ? '?include_inactive=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar árvore de módulos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching modules tree:', error);
      throw error;
    }
  }

  static async getModules(token: string, includeInactive = false): Promise<{ success: boolean; total: number; modules: Module[] }> {
    try {
      const url = `${API_BASE_URL}/modules${includeInactive ? '?include_inactive=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar módulos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching modules:', error);
      throw error;
    }
  }

  static async getModule(token: string, moduleUuid: string): Promise<{ success: boolean; module: Module }> {
    try {
      const response = await fetch(`${API_BASE_URL}/modules/${moduleUuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar módulo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching module:', error);
      throw error;
    }
  }

  static async createModule(token: string, data: CreateModuleData): Promise<{ success: boolean; module: Module }> {
    try {
      const response = await fetch(`${API_BASE_URL}/modules`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar módulo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  static async updateModule(token: string, moduleUuid: string, data: UpdateModuleData): Promise<{ success: boolean; message: string; module: Module }> {
    try {
      const response = await fetch(`${API_BASE_URL}/modules/${moduleUuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar módulo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  static async deleteModule(token: string, moduleUuid: string, force = false): Promise<{ success: boolean; message: string }> {
    try {
      const url = `${API_BASE_URL}/modules/${moduleUuid}${force ? '?force=true' : ''}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar módulo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }
}
