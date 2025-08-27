import { useState, useEffect } from 'react';
import Header from '@components/Header';
import { api } from '@services/api';
import { isSaleAdmin, isYardManager, isSystemAdmin } from '@utils/rbac';
import AssignDriverModal from '@components/Forklift/AssignDriverModal';

interface ForkliftTask {
  id: string;
  container_no: string;
  from_slot_id?: string;
  to_slot_id?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned_driver_id?: string;
  created_by: string;
  cancel_reason?: string;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    full_name: string;
    email: string;
  };
  from_slot?: {
    id: string;
    code: string;
    row_label?: string;
    row_index?: number;
    col_index?: number;
    tier_capacity?: number;
    block: {
      code: string;
      yard: {
        name: string;
      };
    };
    placements?: Array<{
      id: string;
      tier: number;
      container_no?: string;
      status: string;
    }>;
  };
  to_slot?: {
    id: string;
    code: string;
    row_label?: string;
    row_index?: number;
    col_index?: number;
    tier_capacity?: number;
    block: {
      code: string;
      yard: {
        name: string;
      };
    };
    placements?: Array<{
      id: string;
      tier: number;
      container_no?: string;
      status: string;
    }>;
  };
}

export default function Forklift() {
  const [tasks, setTasks] = useState<ForkliftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ForkliftTask | null>(null);

  useEffect(() => {
    // Lấy thông tin user role
    api.get('/auth/me')
      .then(response => {
        const role = response.data?.role || response.data?.roles?.[0];
        setUserRole(role);
        
        // Kiểm tra quyền truy cập
        if (!isSaleAdmin(role) && !isYardManager(role) && !isSystemAdmin(role)) {
          setError('Bạn không có quyền truy cập trang này');
          return;
        }
        
        // Load danh sách công việc xe nâng
        loadForkliftTasks();
      })
      .catch(err => {
        setError('Không thể xác thực người dùng');
        console.error('Auth error:', err);
      });
  }, []);

  const loadForkliftTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forklift/jobs');
      console.log('🔍 Forklift jobs data:', response.data);
      setTasks(response.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách công việc xe nâng');
      console.error('Load tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = (task: ForkliftTask) => {
    setSelectedTask(task);
    setAssignModalOpen(true);
  };

  const handleDriverAssigned = (driverId: string) => {
    // Update the task in the list with the new driver
    if (selectedTask) {
      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { ...task, assigned_driver_id: driverId }
          : task
      ));
    }
    loadForkliftTasks(); // Refresh the list
  };

  const handleStartJob = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/start`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể bắt đầu công việc');
    }
  };

  const handleCompleteJob = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/complete`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể hoàn thành công việc');
    }
  };

  const handleCancelJob = async (taskId: string) => {
    const reason = prompt('Lý do hủy công việc:');
    if (!reason) return;

    try {
      await api.patch(`/forklift/jobs/${taskId}/cancel`, { reason });
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể hủy công việc');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  if (error) {
    return (
      <>
        <Header />
        <main className="container">
          <div className="card card-padding-lg">
            <div className="text-center">
              <h2 className="text-red-600">Lỗi truy cập</h2>
              <p>{error}</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Quản lý Xe nâng</h1>
            <p className="page-subtitle">Theo dõi và quản lý công việc xe nâng</p>
          </div>
          <div className="page-actions">
            <button 
              className="btn btn-primary"
              onClick={loadForkliftTasks}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {error && (
          <div className="card card-padding-md">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <button 
                className="btn btn-outline mt-2"
                onClick={() => setError(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <div className="card card-padding-lg">
          <div className="card-header">
            <h2 className="card-title">Danh sách công việc xe nâng</h2>
            <div className="card-actions">
              <span className="badge badge-primary">
                Tổng: {tasks.length} công việc
              </span>
            </div>
          </div>

          <div className="card-content">
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner spinner-lg spinner-primary"></div>
                <p className="mt-4">Đang tải danh sách công việc...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có công việc xe nâng nào</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Container</th>
                      <th>Vị trí nguồn</th>
                      <th>Vị trí đích</th>
                      <th>Trạng thái</th>
                      <th>Tài xế</th>
                      <th>Thời gian tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="table-row">
                        <td>
                          <span className="container-id">{task.container_no}</span>
                        </td>
                        <td>
                          <span className="location-text">{task.from_slot?.code || 'Bên ngoài'}</span>
                        </td>
                        <td>
                          <span className="location-text">{task.to_slot?.code || 'Bên ngoài'}</span>
                        </td>
                        <td>
                          <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </td>
                        <td>
                          {task.driver ? (
                            <span className="driver-name">{task.driver.full_name}</span>
                          ) : (
                            <span className="text-gray-400">Chưa gán</span>
                          )}
                        </td>
                        <td>
                          <span className="eta-date">
                            {formatDate(task.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {task.status === 'PENDING' && (
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleStartJob(task.id)}
                                >
                                  Bắt đầu
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleCancelJob(task.id)}
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleCompleteJob(task.id)}
                              >
                                Hoàn thành
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleAssignDriver(task)}
                            >
                              Gán tài xế
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assign Driver Modal */}
      {selectedTask && (
        <AssignDriverModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedTask(null);
          }}
          onAssign={handleDriverAssigned}
          jobData={{
            id: selectedTask.id,
            container_no: selectedTask.container_no,
            source_location: selectedTask.from_slot?.code || 'Vị trí nguồn',
            destination_location: selectedTask.to_slot?.code || 'Vị trí đích',
            status: selectedTask.status
          }}
        />
      )}
    </>
  );
}
