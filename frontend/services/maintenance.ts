import { api } from './api';

export interface RepairTicket {
  id: string;
  container_no?: string;
  status: string;
  imagesCount?: number;
}

export interface RepairImage {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_url: string;
  createdAt: string;
}

export const maintenanceApi = {
  async listRepairs(params?: { page?: number; limit?: number; container_no?: string }) {
    const { data } = await api.get('/maintenance/repairs', { params });
    return data as { data: RepairTicket[] };
  },

  async decideRepair(id: string, decision: 'ACCEPT' | 'REJECT', canRepair?: boolean) {
    const { data } = await api.post(`/maintenance/repairs/${id}/decide`, { decision, canRepair });
    return data;
  },

  async getRepairImages(repairTicketId: string) {
    const { data } = await api.get(`/maintenance/repairs/${repairTicketId}/images`);
    return data as { success: boolean; data: RepairImage[] };
  }
};


