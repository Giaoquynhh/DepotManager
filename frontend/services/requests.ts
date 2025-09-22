import { api } from './api';

export interface CreateRequestData {
  type: string;
  request_no?: string; // Add request_no field
  status?: string; // Add status field
  container_no?: string;
  eta?: string;
  shipping_line_id?: string;
  container_type_id?: string;
  customer_id?: string;
  vehicle_company_id?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  appointment_time?: string;
  booking_bill?: string; // Add booking_bill field
  notes?: string;
  files?: File[];
}

export interface RequestAttachment {
  id: string;
  request_id: string;
  uploader_id: string;
  uploader_role: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_url: string;
  uploaded_at: string;
}

export const requestService = {
  // Create a new request with files
  async createRequest(data: CreateRequestData) {
    const formData = new FormData();
    
    // Add text fields
    formData.append('type', data.type);
    if (data.request_no) formData.append('request_no', data.request_no); // Add request_no
    if (data.status) formData.append('status', data.status); // Add status
    if (data.container_no) formData.append('container_no', data.container_no);
    if (data.eta) formData.append('eta', data.eta);
    if (data.shipping_line_id) formData.append('shipping_line_id', data.shipping_line_id);
    if (data.container_type_id) formData.append('container_type_id', data.container_type_id);
    if (data.customer_id) formData.append('customer_id', data.customer_id);
    if (data.vehicle_company_id) formData.append('vehicle_company_id', data.vehicle_company_id);
    if (data.vehicle_number) formData.append('vehicle_number', data.vehicle_number);
    if (data.driver_name) formData.append('driver_name', data.driver_name);
    if (data.driver_phone) formData.append('driver_phone', data.driver_phone);
    if (data.appointment_time) formData.append('appointment_time', data.appointment_time);
    if (data.booking_bill) formData.append('booking_bill', data.booking_bill); // Add booking_bill
    if (data.notes) formData.append('notes', data.notes);
    
    // Add files
    if (data.files && data.files.length > 0) {
      data.files.forEach((file, index) => {
        formData.append('files', file);
      });
    }

    return api.post('/requests/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload files for existing request
  async uploadFiles(requestId: string, files: File[]) {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    return api.post(`/requests/${requestId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get files for a request
  async getFiles(requestId: string) {
    return api.get(`/requests/${requestId}/files`);
  },

  // Delete a file
  async deleteFile(fileId: string, reason?: string) {
    return api.delete(`/requests/files/${fileId}`, {
      data: { reason }
    });
  },

  // Get list of requests
  async getRequests(type?: 'IMPORT' | 'EXPORT', status?: string) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    
    return api.get(`/requests?${params.toString()}`);
  },

  // Update request
  async updateRequest(requestId: string, data: Partial<CreateRequestData>) {
    const formData = new FormData();
    
    // Add text fields
    if (data.type) formData.append('type', data.type);
    if (data.request_no) formData.append('request_no', data.request_no);
    if (data.container_no) formData.append('container_no', data.container_no);
    if (data.eta) formData.append('eta', data.eta);
    if (data.shipping_line_id) formData.append('shipping_line_id', data.shipping_line_id);
    if (data.container_type_id) formData.append('container_type_id', data.container_type_id);
    if (data.customer_id) formData.append('customer_id', data.customer_id);
    if (data.vehicle_company_id) formData.append('vehicle_company_id', data.vehicle_company_id);
    if (data.vehicle_number) formData.append('vehicle_number', data.vehicle_number);
    if (data.driver_name) formData.append('driver_name', data.driver_name);
    if (data.driver_phone) formData.append('driver_phone', data.driver_phone);
    if (data.appointment_time) formData.append('appointment_time', data.appointment_time);
    if (data.booking_bill) formData.append('booking_bill', data.booking_bill);
    if (data.notes) formData.append('notes', data.notes);
    
    // Add files if provided
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    return api.put(`/requests/${requestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Fetch existing files for a request
  async getRequestFiles(requestId: string) {
    return api.get(`/requests/${requestId}/files`);
  },

  // Cancel request
  async cancelRequest(requestId: string, reason?: string) {
    return api.patch(`/requests/${requestId}/cancel`, { reason });
  },

  // Get single request details
  async getRequest(requestId: string) {
    return api.get(`/requests/${requestId}`);
  },

  // Delete request
  async deleteRequest(requestId: string) {
    return api.delete(`/requests/${requestId}`);
  },

  // Move request from PENDING to GATE_IN
  async moveToGate(requestId: string) {
    return api.patch(`/requests/${requestId}/move-to-gate`);
  }
};