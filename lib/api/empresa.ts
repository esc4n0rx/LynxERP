const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface Empresa {
  uuid: string;
  nome_empresa: string;
  cnpj_cpf: string;
  inscricao_estadual?: string | null;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  centro: string;
  warehouse_number: string;
  codigo_cliente?: string | null;
  codigo_fornecedor?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmpresaData {
  nome_empresa: string;
  cnpj_cpf: string;
  inscricao_estadual?: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  centro: string;
  warehouse_number: string;
}

export interface UpdateEmpresaData extends Partial<CreateEmpresaData> {}

export interface CEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export class EmpresaAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async getEmpresas(token: string, includeDeleted = false): Promise<Empresa[]> {
    try {
      const url = `${API_BASE_URL}/configuracoes/empresa${includeDeleted ? '?include_deleted=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar empresas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching empresas:', error);
      throw error;
    }
  }

  static async getEmpresa(token: string, uuid: string): Promise<Empresa> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/empresa/${uuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar empresa');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching empresa:', error);
      throw error;
    }
  }

  static async createEmpresa(token: string, data: CreateEmpresaData): Promise<Empresa> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/empresa`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar empresa');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating empresa:', error);
      throw error;
    }
  }

  static async updateEmpresa(token: string, uuid: string, data: UpdateEmpresaData): Promise<Empresa> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/empresa/${uuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar empresa');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating empresa:', error);
      throw error;
    }
  }

  static async deleteEmpresa(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/empresa/${uuid}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar empresa');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting empresa:', error);
      throw error;
    }
  }

  static async gerarCodigoCliente(token: string, uuid: string): Promise<{ codigo_cliente: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/empresa/${uuid}/gerar-codigo-cliente`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao gerar código de cliente');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating client code:', error);
      throw error;
    }
  }

  static async gerarCodigoFornecedor(token: string, uuid: string): Promise<{ codigo_fornecedor: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/empresa/${uuid}/gerar-codigo-fornecedor`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao gerar código de fornecedor');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating supplier code:', error);
      throw error;
    }
  }

  static async buscarCEP(cep: string): Promise<CEPResponse> {
    try {
      const cleanCEP = cep.replace(/\D/g, '');
      // Usando ViaCEP - API externa, então precisa ser URL absoluta
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
        cache: 'no-store', // Evita cache no Next.js
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Error fetching CEP:', error);
      throw error;
    }
  }
}
