const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface Material {
    uuid: string;
    codigo_material: string;
    descricao: string;
    unidade_medida_basica: string;
    tipo_material: string;
    grupo_uuid: string;
    categoria_uuid: string;
    subcategoria_uuid?: string;
    quantidade_base: number;
    ean1?: string;
    ean2?: string;
    administrado_por_lote: boolean;
    controle_qualidade: boolean;
    centro: string;
    empresa_id: string;
    ativo: boolean;
    created_at?: string;
    updated_at?: string;
    // Optional fields from other tabs might be included in the response or separate
    dados_compras?: any;
    dados_qualidade?: any;
    dados_logistica?: any;
    dados_fiscais?: any;
}

export interface CreateMaterialDTO {
    dados_basicos: {
        codigo_material: string;
        descricao: string;
        unidade_medida_basica: string;
        tipo_material: string;
        grupo_uuid: string;
        categoria_uuid: string;
        subcategoria_uuid?: string;
        quantidade_base: number;
        ean1?: string;
        ean2?: string;
        administrado_por_lote: boolean;
        controle_qualidade: boolean;
        centro: string;
        empresa_id?: string; // Optional if backend infers from centro
        ativo: boolean;
    };
    dados_compras?: {
        fornecedor_padrao_uuid?: string;
        codigo_material_fornecedor?: string;
        unidade_compra?: string;
        multiplo_compra?: number;
        lead_time_dias?: number;
        lote_minimo_compra?: number;
        preco_base?: number;
        preco_venda?: number;
    };
    dados_qualidade?: {
        classe_inspecao?: string;
        plano_inspecao?: string;
        criticidade_material?: string;
        exige_laudo_fornecedor?: boolean;
        exige_lote_controle?: boolean;
        data_validade?: string;
    };
    dados_logistica?: {
        deposito_padrao_uuid?: string;
        posicao_fixa_uuid?: string;
        estrategia_armazenagem?: string;
        estrategia_picking?: string;
    };
    dados_fiscais?: {
        ncm?: string;
        cest?: string;
        origem_produto?: string;
        codigo_fiscal_interno?: string;
    };
}

export interface MaterialFilters {
    centro?: string;
    tipo_material?: string;
    grupo_uuid?: string;
    categoria_uuid?: string;
    subcategoria_uuid?: string;
    ativo?: boolean;
    limit?: number;
    offset?: number;
    search?: string; // Custom filter for frontend search if API supports it, or we filter locally/via specific param
}

export class MaterialAPI {
    private static getAuthHeader(token: string): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    static async getAll(token: string, filters: MaterialFilters = {}): Promise<Material[]> {
        const params = new URLSearchParams();
        if (filters.centro) params.append('centro', filters.centro);
        if (filters.tipo_material) params.append('tipo_material', filters.tipo_material);
        if (filters.grupo_uuid) params.append('grupo_uuid', filters.grupo_uuid);
        if (filters.categoria_uuid) params.append('categoria_uuid', filters.categoria_uuid);
        if (filters.subcategoria_uuid) params.append('subcategoria_uuid', filters.subcategoria_uuid);
        if (filters.ativo !== undefined) params.append('ativo', String(filters.ativo));
        if (filters.limit) params.append('limit', String(filters.limit));
        if (filters.offset) params.append('offset', String(filters.offset));

        // Note: The doc doesn't explicitly mention a generic 'search' param for code/desc, 
        // but usually there is one. If not, we might need to filter by specific fields.
        // Assuming 'search' might be mapped to a query param or handled by backend if implemented.
        // If strictly following doc, we might need to add specific params if they exist.
        // For now, I'll assume standard filtering or client side if not supported.

        const response = await fetch(`${API_BASE_URL}/mat001/material?${params.toString()}`, {
            method: 'GET',
            headers: this.getAuthHeader(token),
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar materiais');
        }

        return await response.json();
    }

    static async create(token: string, data: CreateMaterialDTO): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/mat001/material`, {
            method: 'POST',
            headers: this.getAuthHeader(token),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao criar material');
        }

        return await response.json();
    }

    static async update(token: string, codigo_material: string, data: Partial<CreateMaterialDTO>): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/mat001/material/${codigo_material}`, {
            method: 'PUT',
            headers: this.getAuthHeader(token),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao atualizar material');
        }

        return await response.json();
    }

    static async delete(token: string, codigo_material: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/mat001/material/${codigo_material}`, {
            method: 'DELETE',
            headers: this.getAuthHeader(token),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao excluir material');
        }

        return await response.json();
    }

    static async upload(token: string, file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/mat001/material/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao fazer upload de materiais');
        }

        return await response.json();
    }
}
