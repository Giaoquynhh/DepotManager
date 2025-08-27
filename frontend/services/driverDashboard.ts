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
  }
};
