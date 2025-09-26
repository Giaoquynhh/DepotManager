import { api } from './api';

export const driverDashboardApi = {
  // Lấy dữ liệu dashboard chính
  async getDashboard() {
    const { data } = await api.get('/driver-dashboard/dashboard');
    return data;
  },

  // Lấy danh sách task được giao
  async getAssignedTasks() {
    const { data } = await api.get('/driver-dashboard/tasks');
    return data;
  },

  // Cập nhật trạng thái task
  async updateTaskStatus(taskId: string, status: string, notes?: string) {
    const { data } = await api.patch(`/driver-dashboard/tasks/${taskId}/status`, { 
      status, 
      notes 
    });
    return data;
  },

  // Lấy lịch sử task
  async getTaskHistory() {
    const { data } = await api.get('/driver-dashboard/tasks/history');
    return data;
  },

  // Cập nhật chi phí task
  async updateTaskCost(taskId: string, cost: number) {
    const { data } = await api.patch(`/driver-dashboard/tasks/${taskId}/cost`, { 
      cost 
    });
    return data;
  },

  // Upload report images for a forklift task
  async uploadTaskImages(taskId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const { data } = await api.post(`/driver-dashboard/tasks/${taskId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async getTaskImages(taskId: string) {
    const { data } = await api.get(`/driver-dashboard/tasks/${taskId}/images`);
    return data;
  },

  async deleteTaskImage(taskId: string, imageId: string) {
    const { data } = await api.delete(`/driver-dashboard/tasks/${taskId}/images/${imageId}`);
    return data;
  }
};
