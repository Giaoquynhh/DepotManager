import { api } from './api';

export interface Seal {
  id: string;
  shipping_company: string;
  purchase_date: string;
  quantity_purchased: number;
  quantity_exported: number;
  quantity_remaining: number;
  unit_price: number;
  total_amount: number;
  pickup_location: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: string;
  updated_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSealData {
  shipping_company: string;
  purchase_date: string;
  quantity_purchased: number;
  quantity_exported?: number;
  unit_price: number;
  pickup_location: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateSealData {
  shipping_company?: string;
  purchase_date?: string;
  quantity_purchased?: number;
  quantity_exported?: number;
  unit_price?: number;
  pickup_location?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface SealListParams {
  shipping_company?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SealListResponse {
  items: Seal[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SealStatistics {
  totalSeals: number;
  activeSeals: number;
  totalQuantityRemaining: number;
  totalValue: number;
}

export const sealsApi = {
  // Create a new seal
  create: async (data: CreateSealData): Promise<Seal> => {
    const response = await api.post('/seals', data);
    return response.data.data;
  },

  // Get list of seals with pagination and filters
  list: async (params: SealListParams = {}): Promise<SealListResponse> => {
    const response = await api.get('/seals', { params });
    return response.data.data;
  },

  // Get seal by ID
  getById: async (id: string): Promise<Seal> => {
    const response = await api.get(`/seals/${id}`);
    return response.data.data;
  },

  // Update seal
  update: async (id: string, data: UpdateSealData): Promise<Seal> => {
    const response = await api.patch(`/seals/${id}`, data);
    return response.data.data;
  },

  // Delete seal
  delete: async (id: string): Promise<void> => {
    await api.delete(`/seals/${id}`);
  },

  // Get seal statistics
  getStatistics: async (): Promise<SealStatistics> => {
    const response = await api.get('/seals/statistics');
    return response.data.data;
  }
};
