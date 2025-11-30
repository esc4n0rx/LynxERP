const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface Range {
  uuid: string;
  nome: string;
  codigo_identificador: string;
  descricao?: string | null;
  prefixo?: string | null;
  sulfixo?: string | null;
  numero_inicial: number;
  numero_final: number;
  numero_atual: number;
  ativo: boolean;
  em_uso: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRangeData {
  nome: string;
  codigo_identificador: string;
  descricao?: string;
  prefixo?: string;
  sulfixo?: string;
  numero_inicial?: number;
  numero_final: number;
  numero_atual?: number;
  ativo?: boolean;
}

export interface UpdateRangeData {
  nome?: string;
  descricao?: string;
  prefixo?: string;
  sulfixo?: string;
  numero_final?: number;
  numero_atual?: number;
  ativo?: boolean;
}

export class RangeAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async getRanges(token: string, includeDeleted = false): Promise<Range[]> {
    try {
      const url = `${API_BASE_URL}/configuracoes/range${includeDeleted ? '?include_deleted=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar ranges');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ranges:', error);
      throw error;
    }
  }

  static async getRange(token: string, uuid: string): Promise<Range> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/range/${uuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar range');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching range:', error);
      throw error;
    }
  }

  static async createRange(token: string, data: CreateRangeData): Promise<Range> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/range`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar range');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating range:', error);
      throw error;
    }
  }

  static async updateRange(token: string, uuid: string, data: UpdateRangeData): Promise<Range> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/range/${uuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar range');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating range:', error);
      throw error;
    }
  }

  static async deleteRange(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/range/${uuid}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar range. Range pode estar em uso.');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting range:', error);
      throw error;
    }
  }
}
