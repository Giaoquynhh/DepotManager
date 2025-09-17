// Setup API Service for Shipping Lines and Transport Companies
import { api } from './api';

export interface ShippingLine {
  id: string;
  code: string;
  name: string;
  eir: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportCompany {
  id: string;
  code: string;
  name: string;
  address?: string;
  mst?: string;
  phone?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShippingLineData {
  code: string;
  name: string;
  eir: string;
  note?: string;
}

export interface UpdateShippingLineData {
  code?: string;
  name?: string;
  eir?: string;
  note?: string;
}

export interface CreateTransportCompanyData {
  code: string;
  name: string;
  address?: string;
  mst?: string;
  phone?: string;
  note?: string;
}

export interface UpdateTransportCompanyData {
  code?: string;
  name?: string;
  address?: string;
  mst?: string;
  phone?: string;
  note?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any[];
}

class SetupService {
  // Shipping Lines
  async getShippingLines(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<ShippingLine>>> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await api.get(`/api/setup/shipping-lines?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching shipping lines:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch shipping lines'
      };
    }
  }

  async getShippingLineById(id: string): Promise<ApiResponse<ShippingLine>> {
    try {
      const response = await api.get(`/api/setup/shipping-lines/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching shipping line:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch shipping line'
      };
    }
  }

  async createShippingLine(data: CreateShippingLineData): Promise<ApiResponse<ShippingLine>> {
    try {
      const response = await api.post('/api/setup/shipping-lines', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating shipping line:', error);
      // Prevent error from being thrown to avoid Next.js error overlay
      return {
        success: false,
        error: 'CREATE_ERROR',
        message: error.response?.data?.message || 'Failed to create shipping line',
        details: error.response?.data?.details
      };
    }
  }

  async updateShippingLine(id: string, data: UpdateShippingLineData): Promise<ApiResponse<ShippingLine>> {
    try {
      const response = await api.put(`/api/setup/shipping-lines/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating shipping line:', error);
      return {
        success: false,
        error: 'UPDATE_ERROR',
        message: error.response?.data?.message || 'Failed to update shipping line',
        details: error.response?.data?.details
      };
    }
  }

  async deleteShippingLine(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete(`/api/setup/shipping-lines/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting shipping line:', error);
      return {
        success: false,
        error: 'DELETE_ERROR',
        message: error.response?.data?.message || 'Failed to delete shipping line'
      };
    }
  }

  // Transport Companies
  async getTransportCompanies(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<TransportCompany>>> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await api.get(`/api/setup/transport-companies?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transport companies:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch transport companies'
      };
    }
  }

  async getTransportCompanyById(id: string): Promise<ApiResponse<TransportCompany>> {
    try {
      const response = await api.get(`/api/setup/transport-companies/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transport company:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch transport company'
      };
    }
  }

  async createTransportCompany(data: CreateTransportCompanyData): Promise<ApiResponse<TransportCompany>> {
    try {
      const response = await api.post('/api/setup/transport-companies', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating transport company:', error);
      return {
        success: false,
        error: 'CREATE_ERROR',
        message: error.response?.data?.message || 'Failed to create transport company',
        details: error.response?.data?.details
      };
    }
  }

  async updateTransportCompany(id: string, data: UpdateTransportCompanyData): Promise<ApiResponse<TransportCompany>> {
    try {
      const response = await api.put(`/api/setup/transport-companies/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating transport company:', error);
      return {
        success: false,
        error: 'UPDATE_ERROR',
        message: error.response?.data?.message || 'Failed to update transport company',
        details: error.response?.data?.details
      };
    }
  }

  async deleteTransportCompany(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete(`/api/setup/transport-companies/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting transport company:', error);
      return {
        success: false,
        error: 'DELETE_ERROR',
        message: error.response?.data?.message || 'Failed to delete transport company'
      };
    }
  }

  // Bulk create shipping lines
  async bulkCreateShippingLines(shippingLines: CreateShippingLineData[]): Promise<ApiResponse<{
    imported: number;
    failed: number;
    results: {
      success: ShippingLine[];
      failed: Array<{ data: CreateShippingLineData; error: string }>;
    };
  }>> {
    try {
      const response = await api.post('/api/setup/shipping-lines/bulk', { shippingLines });
      return response.data;
    } catch (error: any) {
      console.error('Error bulk creating shipping lines:', error);
      return {
        success: false,
        error: 'BULK_CREATE_ERROR',
        message: error.response?.data?.message || 'Failed to bulk create shipping lines'
      };
    }
  }

  // Upload transport company Excel file
  async uploadTransportCompanyExcel(file: FormData): Promise<ApiResponse<TransportCompany[]>> {
    try {
      const response = await api.post('/api/setup/transport-companies/upload-excel', file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading transport company Excel:', error);
      return {
        success: false,
        error: 'UPLOAD_ERROR',
        message: error.response?.data?.message || 'Failed to upload Excel file'
      };
    }
  }
}

export const setupService = new SetupService();
