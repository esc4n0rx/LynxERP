const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface Supplier {
  uuid: string;
  codigo_interno: string;
  centro: string;
  empresa_id: string;
  nome_fantasia: string;
  razao_social: string;
  tipo_fornecedor: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  cnpj?: string;
  cpf?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  regime_tributario?: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  substituicao_tributaria?: boolean;
  prazo_pagamento?: number;
  tipo_pagamento_favorito?: 'PIX' | 'TED' | 'DOC' | 'BOLETO' | 'DINHEIRO';
  banco_nome?: string;
  banco_agencia?: string;
  banco_conta?: string;
  banco_tipo_conta?: 'CORRENTE' | 'POUPANCA';
  chave_pix?: string;
  dia_fechamento_fatura?: number;
  dia_vencimento_fatura?: number;
  categoria_fornecedor?: 'MATERIA_PRIMA' | 'EMBALAGENS' | 'SERVICOS' | 'REVENDA' | 'GERAL';
  classificacao_risco?: 'BAIXO' | 'MEDIO' | 'ALTO';
  avaliacao?: number;
  observacoes_comerciais?: string;
  principal_produto?: string;
  marca_representacao?: string;
  tempo_medio_entrega?: number;
  confiabilidade_entrega?: number;
  qualidade_media?: number;
  reclamacoes?: number;
  ativo: boolean;
  bloqueado: boolean;
  motivo_bloqueio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  centro: string;
  nome_fantasia: string;
  razao_social: string;
  tipo_fornecedor: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  cnpj?: string;
  cpf?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  regime_tributario?: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  substituicao_tributaria?: boolean;
  prazo_pagamento?: number;
  tipo_pagamento_favorito?: 'PIX' | 'TED' | 'DOC' | 'BOLETO' | 'DINHEIRO';
  banco_nome?: string;
  banco_agencia?: string;
  banco_conta?: string;
  banco_tipo_conta?: 'CORRENTE' | 'POUPANCA';
  chave_pix?: string;
  dia_fechamento_fatura?: number;
  dia_vencimento_fatura?: number;
  categoria_fornecedor?: 'MATERIA_PRIMA' | 'EMBALAGENS' | 'SERVICOS' | 'REVENDA' | 'GERAL';
  classificacao_risco?: 'BAIXO' | 'MEDIO' | 'ALTO';
  avaliacao?: number;
  observacoes_comerciais?: string;
  principal_produto?: string;
  marca_representacao?: string;
  tempo_medio_entrega?: number;
  confiabilidade_entrega?: number;
  qualidade_media?: number;
  reclamacoes?: number;
  ativo?: boolean;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {}

export interface SupplierAddress {
  uuid: string;
  fornecedor_uuid: string;
  tipo_endereco: 'FISCAL' | 'ENTREGA' | 'COBRANCA' | 'OUTRO';
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  padrao: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressData {
  tipo_endereco: 'FISCAL' | 'ENTREGA' | 'COBRANCA' | 'OUTRO';
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  padrao: boolean;
}

export interface SupplierContact {
  uuid: string;
  fornecedor_uuid: string;
  nome: string;
  email: string;
  telefone?: string;
  celular?: string;
  cargo?: string;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactData {
  nome: string;
  email: string;
  telefone?: string;
  celular?: string;
  cargo?: string;
  observacao?: string;
}

export class SupplierAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async getSuppliers(token: string, filters?: {
    ativo?: boolean;
    tipo_fornecedor?: string;
    categoria?: string;
    bloqueado?: boolean;
    centro?: string;
  }): Promise<Supplier[]> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.ativo !== undefined) params.append('ativo', String(filters.ativo));
      if (filters.tipo_fornecedor) params.append('tipo_fornecedor', filters.tipo_fornecedor);
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.bloqueado !== undefined) params.append('bloqueado', String(filters.bloqueado));
      if (filters.centro) params.append('centro', filters.centro);
    }

    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores?${params.toString()}`, {
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) throw new Error('Erro ao buscar fornecedores');
    return await response.json();
  }

  static async getSupplier(token: string, uuid: string): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${uuid}`, {
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) throw new Error('Erro ao buscar fornecedor');
    return await response.json();
  }

  static async createSupplier(token: string, data: CreateSupplierData): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores`, {
      method: 'POST',
      headers: this.getAuthHeader(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar fornecedor');
    }
    return await response.json();
  }

  static async updateSupplier(token: string, uuid: string, data: UpdateSupplierData): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${uuid}`, {
      method: 'PUT',
      headers: this.getAuthHeader(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao atualizar fornecedor');
    }
    return await response.json();
  }

  static async deleteSupplier(token: string, uuid: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${uuid}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) throw new Error('Erro ao deletar fornecedor');
  }

  static async blockSupplier(token: string, uuid: string, motivo: string): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${uuid}/bloquear`, {
      method: 'POST',
      headers: this.getAuthHeader(token),
      body: JSON.stringify({ motivo }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao bloquear fornecedor');
    }
    return await response.json();
  }

  static async unblockSupplier(token: string, uuid: string): Promise<Supplier> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${uuid}/desbloquear`, {
      method: 'POST',
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao desbloquear fornecedor');
    }
    return await response.json();
  }

  // Address Methods
  static async getAddresses(token: string, supplierUuid: string): Promise<SupplierAddress[]> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${supplierUuid}/enderecos`, {
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) throw new Error('Erro ao buscar endereços');
    return await response.json();
  }

  static async createAddress(token: string, supplierUuid: string, data: CreateAddressData): Promise<SupplierAddress> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${supplierUuid}/enderecos`, {
      method: 'POST',
      headers: this.getAuthHeader(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar endereço');
    }
    return await response.json();
  }

  static async updateAddress(token: string, addressUuid: string, data: Partial<CreateAddressData>): Promise<SupplierAddress> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/enderecos/${addressUuid}`, {
      method: 'PUT',
      headers: this.getAuthHeader(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao atualizar endereço');
    }
    return await response.json();
  }

  static async deleteAddress(token: string, addressUuid: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/enderecos/${addressUuid}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) throw new Error('Erro ao deletar endereço');
  }

  // Contact Methods
  static async getContacts(token: string, supplierUuid: string): Promise<SupplierContact[]> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${supplierUuid}/contatos`, {
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) throw new Error('Erro ao buscar contatos');
    return await response.json();
  }

  static async createContact(token: string, supplierUuid: string, data: CreateContactData): Promise<SupplierContact> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/${supplierUuid}/contatos`, {
      method: 'POST',
      headers: this.getAuthHeader(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar contato');
    }
    return await response.json();
  }

  static async updateContact(token: string, contactUuid: string, data: Partial<CreateContactData>): Promise<SupplierContact> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/contatos/${contactUuid}`, {
      method: 'PUT',
      headers: this.getAuthHeader(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao atualizar contato');
    }
    return await response.json();
  }

  static async deleteContact(token: string, contactUuid: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cadastro/fornecedores/contatos/${contactUuid}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) throw new Error('Erro ao deletar contato');
  }
}
