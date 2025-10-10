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

export interface SealUsageHistoryItem {
  id: string;
  seal_id: string;
  seal_number: string;
  container_number?: string;
  booking_number?: string;
  export_date: string;
  created_by: string;
  created_at: string;
  seal?: {
    shipping_company: string;
    quantity_remaining: number;
  };
  creator?: {
    full_name: string;
    username: string;
    email: string;
  };
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
  },

  // Increment exported quantity
  incrementExportedQuantity: async (shippingCompany: string, sealNumber?: string, containerNumber?: string, requestId?: string): Promise<Seal> => {
    const response = await api.post('/seals/increment-exported', {
      shipping_company: shippingCompany,
      seal_number: sealNumber,
      container_number: containerNumber,
      request_id: requestId
    });
    return response.data.data;
  },

  // Get seal usage history
  getUsageHistory: async (sealId: string): Promise<SealUsageHistoryItem[]> => {
    const response = await api.get(`/seals/${sealId}/usage-history`);
    return response.data.data;
  },

  // Update seal usage history
    updateSealUsageHistory: async (
      shippingCompany: string,
      oldSealNumber: string,
      newSealNumber: string,
      containerNumber?: string,
      requestId?: string
    ): Promise<SealUsageHistoryItem> => {
      const response = await api.post('/seals/update-usage-history', {
        shipping_company: shippingCompany,
        old_seal_number: oldSealNumber,
        new_seal_number: newSealNumber,
        container_number: containerNumber,
        request_id: requestId
      });
      return response.data.data;
    },

    removeSealFromHistory: async (
      shippingCompany: string,
      sealNumber: string,
      containerNumber: string
    ): Promise<any> => {
      const response = await api.post('/seals/remove-from-history', {
        shipping_company: shippingCompany,
        seal_number: sealNumber,
        container_number: containerNumber
      });
      return response.data.data;
    }
};
