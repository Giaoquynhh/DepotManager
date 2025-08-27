import { useState, useEffect } from 'react';
import Header from '@components/Header';
import { driverDashboardApi } from '@services/driverDashboard';

interface DashboardData {
  summary: {
    totalTasks: number;
    completedToday: number;
    pendingTasks: number;
    completionRate: number;
  };
  currentTask: any;
  lastUpdated: string;
}

interface ForkliftTask {
  id: string;
  container_no: string;
  from_slot_id?: string;
  to_slot_id?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned_driver_id?: string;
  created_by: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  from_slot?: {
    id: string;
    code: string;
    block: {
      code: string;
      yard: { name: string };
    };
  };
  to_slot?: {
    id: string;
    code: string;
    block: {
      code: string;
      yard: { name: string };
    };
  };
}

export default function DriverDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<ForkliftTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<ForkliftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'history'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, tasks, history] = await Promise.all([
        driverDashboardApi.getDashboard(),
        driverDashboardApi.getAssignedTasks(),
        driverDashboardApi.getTaskHistory()
      ]);
      
      setDashboardData(dashboard);
      setAssignedTasks(tasks);
      setTaskHistory(history);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string, notes?: string) => {
    try {
      await driverDashboardApi.updateTaskStatus(taskId, newStatus, notes);
      // Reload data after update
      await loadDashboardData();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-yellow';
      case 'IN_PROGRESS': return 'badge-blue';
      case 'COMPLETED': return 'badge-green';
      case 'CANCELLED': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ thực hiện';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="container">
          <div className="text-center py-8">
            <div className="loading-spinner spinner-lg spinner-primary"></div>
            <p className="mt-4">Đang tải dữ liệu...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Bảng điều khiển Tài xế</h1>
            <p className="page-subtitle">Quản lý công việc và theo dõi tiến độ xe nâng</p>
          </div>
          <div className="page-actions">
            <button 
              className="btn btn-primary"
              onClick={loadDashboardData}
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card card-padding-md">
          <div className="card-content">
            <div className="flex space-x-8 border-b border-gray-200">
              {[
                { id: 'overview', label: 'Tổng quan', icon: '📊' },
                { id: 'tasks', label: 'Công việc', icon: '📋' },
                { id: 'history', label: 'Lịch sử', icon: '📚' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card card-padding-md">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng công việc</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.totalTasks || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card card-padding-md">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Hoàn thành hôm nay</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.completedToday || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card card-padding-md">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Đang chờ</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.pendingTasks || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card card-padding-md">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tỷ lệ hoàn thành</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.completionRate || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Task */}
            {dashboardData?.currentTask && (
              <div className="card card-padding-lg">
                <div className="card-header">
                  <h3 className="card-title">Công việc hiện tại</h3>
                </div>
                <div className="card-content">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-blue-800">
                        Container: {dashboardData.currentTask.container_no}
                      </span>
                      <span className={`badge badge-md ${getStatusColor(dashboardData.currentTask.status)}`}>
                        {getStatusText(dashboardData.currentTask.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Từ vị trí:</p>
                        <p className="font-medium">
                          {dashboardData.currentTask.from_slot 
                            ? `${dashboardData.currentTask.from_slot.block.yard.name} - ${dashboardData.currentTask.from_slot.block.code} - ${dashboardData.currentTask.from_slot.code}`
                            : 'Bên ngoài'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Đến vị trí:</p>
                        <p className="font-medium">
                          {dashboardData.currentTask.to_slot 
                            ? `${dashboardData.currentTask.to_slot.block.yard.name} - ${dashboardData.currentTask.to_slot.block.code} - ${dashboardData.currentTask.to_slot.code}`
                            : 'Chưa xác định'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card card-padding-lg">
              <div className="card-header">
                <h3 className="card-title">Thao tác nhanh</h3>
              </div>
              <div className="card-content">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="btn btn-primary"
                  >
                    Xem công việc
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="btn btn-outline"
                  >
                    Xem lịch sử
                  </button>
                  <button
                    onClick={loadDashboardData}
                    className="btn btn-success"
                  >
                    Làm mới dữ liệu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="card card-padding-lg">
              <div className="card-header">
                <h3 className="card-title">Công việc được giao</h3>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Container</th>
                        <th>Từ vị trí</th>
                        <th>Đến vị trí</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedTasks.map((task) => (
                        <tr key={task.id} className="table-row">
                          <td>
                            <span className="container-id">{task.container_no}</span>
                          </td>
                          <td>
                            <span className="location-text">
                              {task.from_slot 
                                ? `${task.from_slot.block.yard.name} - ${task.from_slot.block.code} - ${task.from_slot.code}`
                                : 'Bên ngoài'
                              }
                            </span>
                          </td>
                          <td>
                            <span className="location-text">
                              {task.to_slot 
                                ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                : 'Chưa xác định'
                              }
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {task.status === 'PENDING' && (
                                <button
                                  onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
                                  className="btn btn-sm btn-primary"
                                >
                                  Bắt đầu
                                </button>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleStatusUpdate(task.id, 'COMPLETED')}
                                  className="btn btn-sm btn-success"
                                >
                                  Hoàn thành
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="card card-padding-lg">
              <div className="card-header">
                <h3 className="card-title">Lịch sử công việc</h3>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Container</th>
                        <th>Từ vị trí</th>
                        <th>Đến vị trí</th>
                        <th>Trạng thái</th>
                        <th>Ngày hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskHistory.map((task) => (
                        <tr key={task.id} className="table-row">
                          <td>
                            <span className="container-id">{task.container_no}</span>
                          </td>
                          <td>
                            <span className="location-text">
                              {task.from_slot 
                                ? `${task.from_slot.block.yard.name} - ${task.from_slot.block.code} - ${task.from_slot.code}`
                                : 'Bên ngoài'
                              }
                            </span>
                          </td>
                          <td>
                            <span className="location-text">
                              {task.to_slot 
                                ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                : 'Chưa xác định'
                              }
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </td>
                          <td>
                            <span className="eta-date">
                              {new Date(task.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
