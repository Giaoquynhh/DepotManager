import { api } from './api';

export interface ContainerListParams {
  q?: string;
  status?: string;
  type?: string;
  service_status?: string;
  not_in_yard?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ContainerItem {
  container_no: string;
  yard_name?: string;
  block_code?: string;
  slot_code?: string;
  service_status?: string;
  service_gate_checked_at?: string;
  service_driver_name?: string;
  service_license_plate?: string;
  repair_checked?: boolean;
  repair_ticket?: {
    status: string;
    id: string;
  };
  dem_date?: string;
  det_date?: string;
  derived_status?: string;
  data_source?: string;
  shipping_line?: any;
  container_type?: any;
  customer?: any;
  seal_number?: string;
  dem_det?: string;
}

export interface ContainerListResponse {
  items: ContainerItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const reportsService = {
  async getContainers(params: ContainerListParams = {}): Promise<{ data: ContainerListResponse }> {
    try {
      console.log('🔍 API call to /reports/containers with params:', params);
      const response = await api.get('/reports/containers', { params });
      console.log('📦 API response:', response.data);
      return response;
    } catch (error: any) {
      console.error('❌ API Error Details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  }
};