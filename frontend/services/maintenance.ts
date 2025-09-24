import { api } from './api';

export interface RepairTicket {
  id: string;
  container_no?: string;
  status: string;
}

export const maintenanceApi = {
  async listRepairs(params?: { page?: number; limit?: number }) {
    const { data } = await api.get('/maintenance/repairs', { params });
    return data as { data: RepairTicket[] };
  },

  async decideRepair(id: string, decision: 'ACCEPT' | 'REJECT', canRepair?: boolean) {
    const { data } = await api.post(`/maintenance/repairs/${id}/decide`, { decision, canRepair });
    return data;
  }
};


