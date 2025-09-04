import { api } from './api';

export interface Container {
  id: string;
  container_no: string;
  status: string;
  service_status: string;
  type: string;
  created_at: string;
  updated_at: string;
  service_gate_checked_at?: string;
  repair_checked?: boolean;
  slot_code?: string;
  // Bất kỳ trường nào khác có thể có
}

export interface PaginatedContainers {
  items: Container[];
  total: number;
  page: number;
  pageSize: number;
}

export const containersApi = {
  async list(params: { 
    q?: string; 
    status?: string; 
    type?: string; 
    service_status?: string; 
    page?: number; 
    pageSize?: number 
  }): Promise<PaginatedContainers> {
    const { data } = await api.get('/containers', { params });
    return data as PaginatedContainers;
  }
};
