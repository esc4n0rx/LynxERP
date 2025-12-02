const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface PositionDimensoes {
  altura_mm?: number;
  largura_mm?: number;
  profundidade_mm?: number;
}

export interface Position {
  uuid: string;
  codigo_posicao: string;
  codigo_deposito: string;
  zona?: string;
  rack?: string;
  nivel?: number;
  coluna?: number;
  tipo_posicao: string;
  capacidade_unidade: number;
  capacidade_unidade_tipo: string;
  dimensoes?: PositionDimensoes;
  permite_mix: boolean;
  lot_required: boolean;
  serial_management: string;
  control_temp: boolean;
  bloqueada: boolean;
  is_stock: boolean;
  inventario_ativo: boolean;
  status: string;
  prioridade_putaway?: number;
  codigo_barcode?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CreatePositionData {
  codigo_posicao: string;
  codigo_deposito: string;
  zona?: string;
  rack?: string;
  nivel?: number;
  coluna?: number;
  tipo_posicao: string;
  capacidade_unidade: number;
  capacidade_unidade_tipo: string;
  dimensoes?: PositionDimensoes;
  permite_mix?: boolean;
  lot_required?: boolean;
  serial_management?: string;
  control_temp?: boolean;
  bloqueada?: boolean;
  status?: string;
  prioridade_putaway?: number;
  codigo_barcode?: string;
  observacoes?: string;
}

export type UpdatePositionData = Partial<CreatePositionData>;

export interface CSVUploadResponse {
  success: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  total: number;
}

export class PositionAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async getPositions(
    token: string,
    filters?: {
      codigo_deposito?: string;
      status?: string;
      tipo_posicao?: string;
      bloqueada?: boolean;
    }
  ): Promise<Position[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.codigo_deposito) params.append('codigo_deposito', filters.codigo_deposito);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.tipo_posicao) params.append('tipo_posicao', filters.tipo_posicao);
      if (filters?.bloqueada !== undefined) params.append('bloqueada', filters.bloqueada.toString());

      const url = `${API_BASE_URL}/wms/posicoes${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar posições');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  static async getPosition(token: string, uuid: string): Promise<Position> {
    try {
      const response = await fetch(`${API_BASE_URL}/wms/posicoes/${uuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar posição');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching position:', error);
      throw error;
    }
  }

  static async createPosition(token: string, data: CreatePositionData): Promise<Position> {
    try {
      const response = await fetch(`${API_BASE_URL}/wms/posicoes`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar posição');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating position:', error);
      throw error;
    }
  }

  static async updatePosition(token: string, uuid: string, data: UpdatePositionData): Promise<Position> {
    try {
      const response = await fetch(`${API_BASE_URL}/wms/posicoes/${uuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar posição');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating position:', error);
      throw error;
    }
  }

  static async deletePosition(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/wms/posicoes/${uuid}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar posição');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting position:', error);
      throw error;
    }
  }

  static async uploadCSV(token: string, file: File): Promise<CSVUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/wms/posicoes/upload-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao fazer upload do CSV');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      throw error;
    }
  }
}
