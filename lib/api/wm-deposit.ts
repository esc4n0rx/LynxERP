const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface UCDimensoes {
  altura_mm?: number;
  largura_mm?: number;
  profundidade_mm?: number;
}

export interface Deposit {
  uuid: string;
  codigo_deposito: string;
  nome: string;
  status: string;
  descricao?: string;
  empresa_id: string;
  codigo_interno_erp?: string;
  tipo_deposito: string;
  categoria?: string;
  zona_logistica?: string[];
  permite_estoque_negativo: boolean;
  administrado_por_uc: boolean;
  tipo_uc?: string;
  uc_mista?: boolean;
  uc_capacidade_max_peso_kg?: number;
  uc_dimensoes?: UCDimensoes;
  area_total_m2?: number;
  altura_maxima_m?: number;
  peso_maximo_por_posicao_kg?: number;
  numero_max_posicoes?: number;
  tipos_racks_suportados?: string[];
  controle_temp: boolean;
  temperatura_min_c?: number;
  temperatura_max_c?: number;
  controle_umidade: boolean;
  floor_type?: string;
  aceita_produtos_perigosos: boolean;
  classes_hazardous_allowed?: string[];
  categoria_produtos_permitidos?: string[];
  serial_number_management: string;
  batch_required: boolean;
  politica_fifo_lifo_fefo: string;
  estrategia_putaway_default?: string;
  estrategia_picking_default?: string;
  nivel_seguro_estoque_minimo_por_sku?: number;
  replenishment_lead_time_days?: number;
  cycle_count_frequency?: string;
  cross_docking_allowed: boolean;
  nivel_seguranca?: string;
  grupos_acesso?: any;
  require_qc_on_receipt: boolean;
  qc_rules?: any;
  retention_time_days_for_failed_qc?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDepositData {
  codigo_deposito: string;
  nome: string;
  status: string;
  descricao?: string;
  empresa_id: string;
  codigo_interno_erp?: string;
  tipo_deposito: string;
  categoria?: string;
  zona_logistica?: string[];
  permite_estoque_negativo?: boolean;
  administrado_por_uc?: boolean;
  tipo_uc?: string;
  uc_mista?: boolean;
  uc_capacidade_max_peso_kg?: number;
  uc_dimensoes?: UCDimensoes;
  area_total_m2?: number;
  altura_maxima_m?: number;
  peso_maximo_por_posicao_kg?: number;
  numero_max_posicoes?: number;
  tipos_racks_suportados?: string[];
  controle_temp?: boolean;
  temperatura_min_c?: number;
  temperatura_max_c?: number;
  controle_umidade?: boolean;
  floor_type?: string;
  aceita_produtos_perigosos?: boolean;
  classes_hazardous_allowed?: string[];
  categoria_produtos_permitidos?: string[];
  serial_number_management?: string;
  batch_required?: boolean;
  politica_fifo_lifo_fefo: string;
  estrategia_putaway_default?: string;
  estrategia_picking_default?: string;
  nivel_seguro_estoque_minimo_por_sku?: number;
  replenishment_lead_time_days?: number;
  cycle_count_frequency?: string;
  cross_docking_allowed?: boolean;
  nivel_seguranca?: string;
  grupos_acesso?: any;
  require_qc_on_receipt?: boolean;
  qc_rules?: any;
  retention_time_days_for_failed_qc?: number;
}

export type UpdateDepositData = Partial<CreateDepositData>;

export class DepositAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async getDeposits(token: string, empresaId?: string): Promise<Deposit[]> {
    try {
      const url = empresaId
        ? `${API_BASE_URL}/wms/depositos?empresa_id=${empresaId}`
        : `${API_BASE_URL}/wms/depositos`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar depósitos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching deposits:', error);
      throw error;
    }
  }

  static async getDeposit(token: string, uuid: string): Promise<Deposit> {
    try {
      const response = await fetch(`${API_BASE_URL}/wms/depositos/${uuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar depósito');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching deposit:', error);
      throw error;
    }
  }

  static async createDeposit(token: string, data: CreateDepositData): Promise<Deposit> {
    try {
      const response = await fetch(`${API_BASE_URL}/wms/depositos`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar depósito');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  }

  static async updateDeposit(token: string, uuid: string, data: UpdateDepositData): Promise<Deposit> {
    try {
      const response = await fetch(`${API_BASE_URL}/wms/depositos/${uuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar depósito');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating deposit:', error);
      throw error;
    }
  }

  static async deleteDeposit(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/wms/depositos/${uuid}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar depósito');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting deposit:', error);
      throw error;
    }
  }
}
