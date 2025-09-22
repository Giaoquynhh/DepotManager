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

export interface ContainerType {
  id: string;
  code: string;
  description: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  tax_code?: string;
  address?: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceList {
  id: string;
  serviceCode: string;
  serviceName: string;
  type: string;
  price: number;
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

export interface CreateContainerTypeData {
  code: string;
  description: string;
  note?: string;
}

export interface UpdateContainerTypeData {
  code?: string;
  description?: string;
  note?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
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
      // Let the browser set the correct multipart boundary automatically
      const response = await api.post('/api/setup/transport-companies/upload-excel', file);
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

  // Upload customer Excel file
  async uploadCustomerExcel(file: FormData): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await api.post('/api/setup/customers/upload-excel', file);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading customer Excel:', error);
      return {
        success: false,
        error: 'UPLOAD_ERROR',
        message: error.response?.data?.message || 'Failed to upload Excel file'
      };
    }
  }

  // Upload container type Excel file
  async uploadContainerTypeExcel(file: FormData): Promise<ApiResponse<ContainerType[]>> {
    try {
      // Explicitly set multipart header to avoid any proxy issues
      const response = await api.post('/api/setup/container-types/upload-excel', file, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading container type Excel:', error);
      return {
        success: false,
        error: 'UPLOAD_ERROR',
        message: error.response?.data?.message || 'Failed to upload Excel file',
        details: error.response?.data?.details
      };
    }
  }

  // Container Types
  async getContainerTypes(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<ContainerType>>> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await api.get(`/api/setup/container-types?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching container types:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch container types'
      };
    }
  }

  async getContainerTypeById(id: string): Promise<ApiResponse<ContainerType>> {
    try {
      const response = await api.get(`/api/setup/container-types/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching container type:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch container type'
      };
    }
  }

  async createContainerType(data: CreateContainerTypeData): Promise<ApiResponse<ContainerType>> {
    try {
      const response = await api.post('/api/setup/container-types', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating container type:', error);
      return {
        success: false,
        error: 'CREATE_ERROR',
        message: error.response?.data?.message || 'Failed to create container type',
        details: error.response?.data?.details
      };
    }
  }

  async updateContainerType(id: string, data: UpdateContainerTypeData): Promise<ApiResponse<ContainerType>> {
    try {
      const response = await api.put(`/api/setup/container-types/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating container type:', error);
      return {
        success: false,
        error: 'UPDATE_ERROR',
        message: error.response?.data?.message || 'Failed to update container type',
        details: error.response?.data?.details
      };
    }
  }

  async deleteContainerType(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete(`/api/setup/container-types/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting container type:', error);
      return {
        success: false,
        error: 'DELETE_ERROR',
        message: error.response?.data?.message || 'Failed to delete container type'
      };
    }
  }

  // Customer methods
  async getCustomers(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<Customer>>> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.status) params.append('status', query.status);
      
      const response = await api.get(`/api/setup/customers?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch customers'
      };
    }
  }

  async createCustomer(data: {
    code: string;
    name: string;
    tax_code?: string;
    address?: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse<Customer>> {
    console.log('Sending request to /customers with data:', data);
    
    try {
      const response = await api.post('/api/setup/customers', data);
      console.log('Response received:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', JSON.stringify(error.response?.data, null, 2));
      
      // Trả về response lỗi thay vì throw
      return {
        success: false,
        error: 'CREATE_ERROR',
        message: error.response?.data?.message || error.message || 'Failed to create customer'
      };
    }
  }

  async updateCustomer(id: string, data: {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse<Customer>> {
    try {
      const response = await api.patch(`/api/setup/customers/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: 'UPDATE_ERROR',
        message: error.response?.data?.message || 'Failed to update customer'
      };
    }
  }

  async disableCustomer(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.patch(`/api/setup/customers/${id}/disable`);
      return response.data;
    } catch (error: any) {
      console.error('Error disabling customer:', error);
      return {
        success: false,
        error: 'DISABLE_ERROR',
        message: error.response?.data?.message || 'Failed to disable customer'
      };
    }
  }

  async deleteCustomer(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete(`/api/setup/customers/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: 'DELETE_ERROR',
        message: error.response?.data?.message || 'Failed to delete customer'
      };
    }
  }

  // PriceList methods
  async getPriceLists(query: PaginationQuery = {}): Promise<ApiResponse<PaginatedResponse<PriceList>>> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await api.get(`/api/setup/price-lists?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching price lists:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch price lists'
      };
    }
  }

  async getPriceListById(id: string): Promise<ApiResponse<PriceList>> {
    try {
      const response = await api.get(`/api/setup/price-lists/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching price list:', error);
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch price list'
      };
    }
  }

  async createPriceList(data: {
    serviceCode: string;
    serviceName: string;
    type: string;
    price: number;
    note?: string;
  }): Promise<ApiResponse<PriceList>> {
    try {
      const response = await api.post('/api/setup/price-lists', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating price list:', error);
      return {
        success: false,
        error: 'CREATE_ERROR',
        message: error.response?.data?.message || 'Failed to create price list',
        details: error.response?.data?.details
      };
    }
  }

  async updatePriceList(id: string, data: {
    serviceCode?: string;
    serviceName?: string;
    type?: string;
    price?: number;
    note?: string;
  }): Promise<ApiResponse<PriceList>> {
    try {
      const response = await api.put(`/api/setup/price-lists/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating price list:', error);
      return {
        success: false,
        error: 'UPDATE_ERROR',
        message: error.response?.data?.message || 'Failed to update price list',
        details: error.response?.data?.details
      };
    }
  }

  async deletePriceList(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete(`/api/setup/price-lists/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting price list:', error);
      return {
        success: false,
        error: 'DELETE_ERROR',
        message: error.response?.data?.message || 'Failed to delete price list'
      };
    }
  }

  // Upload price list Excel file
  async uploadPriceListExcel(file: FormData): Promise<ApiResponse<PriceList[]>> {
    try {
      const response = await api.post('/api/setup/price-lists/upload-excel', file);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading price list Excel:', error);
      return {
        success: false,
        error: 'UPLOAD_ERROR',
        message: error.response?.data?.message || 'Failed to upload Excel file'
      };
    }
  }
}

export const setupService = new SetupService();
