const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// ============= GROUPS =============
export interface MatGroup {
  uuid: string;
  code: string;
  description: string;
  created_at?: string;
}

export interface CreateMatGroupData {
  code: string;
  description: string;
  empresa_id: string;
}

export type UpdateMatGroupData = Partial<Pick<MatGroup, 'description'>>;

// ============= CATEGORIES =============
export interface MatCategory {
  uuid: string;
  code: string;
  description: string;
  group_id?: string;
  created_at?: string;
}

export interface CreateMatCategoryData {
  code: string;
  description: string;
  group_id: string;
}

export type UpdateMatCategoryData = Partial<Pick<MatCategory, 'description'>>;

// ============= SUBCATEGORIES =============
export interface MatSubCategory {
  uuid: string;
  code: string;
  description: string;
  category_id?: string;
  created_at?: string;
}

export interface CreateMatSubCategoryData {
  code: string;
  description: string;
  category_id: string;
}

export type UpdateMatSubCategoryData = Partial<Pick<MatSubCategory, 'description'>>;

// ============= API CLASS =============
export class MatGroupAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // ========== GROUPS ==========
  static async getGroups(token: string, empresaId?: string): Promise<MatGroup[]> {
    try {
      const params = new URLSearchParams();
      if (empresaId) params.append('empresa_id', empresaId);

      const url = `${API_BASE_URL}/configuracoes/material/grupos/groups${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar grupos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  }

  static async getGroup(token: string, uuid: string): Promise<MatGroup> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/groups/${uuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar grupo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  }

  static async createGroup(token: string, data: CreateMatGroupData): Promise<MatGroup> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/groups`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar grupo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  static async updateGroup(token: string, uuid: string, data: UpdateMatGroupData): Promise<MatGroup> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/groups/${uuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar grupo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  static async deleteGroup(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/groups/${uuid}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar grupo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  // ========== CATEGORIES ==========
  static async getCategories(token: string, groupId?: string): Promise<MatCategory[]> {
    try {
      const params = new URLSearchParams();
      if (groupId) params.append('group_id', groupId);

      const url = `${API_BASE_URL}/configuracoes/material/grupos/categories${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar categorias');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  static async getCategory(token: string, uuid: string): Promise<MatCategory> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/categories/${uuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar categoria');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  static async createCategory(token: string, data: CreateMatCategoryData): Promise<MatCategory> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/categories`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar categoria');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  static async updateCategory(token: string, uuid: string, data: UpdateMatCategoryData): Promise<MatCategory> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/categories/${uuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar categoria');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  static async deleteCategory(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/categories/${uuid}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar categoria');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // ========== SUBCATEGORIES ==========
  static async getSubCategories(token: string, categoryId?: string): Promise<MatSubCategory[]> {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', categoryId);

      const url = `${API_BASE_URL}/configuracoes/material/grupos/subcategories${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar subcategorias');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }

  static async getSubCategory(token: string, uuid: string): Promise<MatSubCategory> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/subcategories/${uuid}`, {
        method: 'GET',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao buscar subcategoria');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      throw error;
    }
  }

  static async createSubCategory(token: string, data: CreateMatSubCategoryData): Promise<MatSubCategory> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/subcategories`, {
        method: 'POST',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao criar subcategoria');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subcategory:', error);
      throw error;
    }
  }

  static async updateSubCategory(token: string, uuid: string, data: UpdateMatSubCategoryData): Promise<MatSubCategory> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/subcategories/${uuid}`, {
        method: 'PUT',
        headers: this.getAuthHeader(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar subcategoria');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  }

  static async deleteSubCategory(token: string, uuid: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes/material/grupos/subcategories/${uuid}`, {
        method: 'DELETE',
        headers: this.getAuthHeader(token),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar subcategoria');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  }
}
