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
    not_in_yard?: boolean;
    page?: number; 
    pageSize?: number 
  }): Promise<PaginatedContainers> {
    const { data } = await api.get('/containers', { params });
    return data as PaginatedContainers;
  },

  async get(container_no: string) {
    const { data } = await api.get(`/containers/${container_no}`);
    return data;
  },

  async update(container_no: string, data: {
    shipping_line_id?: string;
    container_type_id?: string;
    customer_id?: string;
    vehicle_company_id?: string;
    dem_det?: string;
    seal_number?: string;
    container_quality?: string;
  }) {
    const { data: response } = await api.put(`/containers/${container_no}`, data);
    return response;
  },

  // API mới để lấy containers trong yard theo shipping line cho lift request
  async getContainersInYardByShippingLine(shipping_line_id: string, searchQuery?: string) {
    const params = searchQuery ? { q: searchQuery } : {};
    const { data } = await api.get(`/containers/yard/by-shipping-line/${shipping_line_id}`, { params });
    return data;
  },

  // API để lấy containers trong yard theo shipping line và container type cho edit modal
  async getContainersInYardByShippingLineAndType(shipping_line_id: string, container_type_id?: string, searchQuery?: string) {
    const params: any = {};
    if (searchQuery) params.q = searchQuery;
    if (container_type_id) params.container_type_id = container_type_id;
    
    const { data } = await api.get(`/containers/yard/by-shipping-line-and-type/${shipping_line_id}`, { params });
    return data;
  }
};
