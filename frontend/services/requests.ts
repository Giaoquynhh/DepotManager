import { api } from './api';

export interface RequestData {
  id: string;
  container_no?: string;
  type: string;
  status: string;
  eta?: string;
  created_by: string;
  tenant_id?: string;
  is_pick?: boolean;
  has_invoice?: boolean;
  is_paid?: boolean;
  documents?: any[];
  latest_payment?: any;
}

export interface AvailableContainer {
  container_no: string;
  location: string;
  status: string;
  placed_at: string;
}

export const requestsApi = {
  // Lấy danh sách requests
  list: (params?: { page?: number; limit?: number; type?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    
    return api.get(`/requests?${queryParams.toString()}`);
  },

  // Lấy request theo ID
  getById: (id: string) => {
    return api.get(`/requests/${id}`);
  },

  // Cập nhật trạng thái request
  updateStatus: (id: string, status: string, reason?: string) => {
    return api.patch(`/requests/${id}/status`, { status, reason });
  },

  // Cập nhật container number
  updateContainerNo: (id: string, container_no: string) => {
    return api.patch(`/requests/${id}/container`, { container_no });
  },

  // Từ chối request
  rejectRequest: (id: string, reason?: string) => {
    return api.patch(`/requests/${id}/reject`, { reason });
  },

  // Soft delete request
  softDeleteRequest: (id: string, scope: 'depot' | 'customer') => {
    return api.delete(`/requests/${id}?scope=${scope}`);
  },

  // Khôi phục request
  restoreRequest: (id: string, scope: 'depot' | 'customer') => {
    return api.post(`/requests/${id}/restore`, { scope });
  },

  // Gửi yêu cầu thanh toán
  sendPayment: (id: string) => {
    return api.post(`/requests/${id}/payment-request`);
  },

  // Lấy danh sách container available cho EXPORT
  getAvailableContainersForExport: (searchQuery?: string) => {
    const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    return api.get(`/requests/containers/available${params}`);
  },

  // Upload document
  uploadDocument: (id: string, file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post(`/requests/${id}/docs`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Lấy danh sách documents
  getDocuments: (id: string) => {
    return api.get(`/requests/${id}/docs`);
  },

  // Xóa document
  deleteDocument: (id: string, docId: string) => {
    return api.delete(`/requests/${id}/docs/${docId}`);
  }
};
