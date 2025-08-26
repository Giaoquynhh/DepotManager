import { useState, useEffect } from 'react';
import Header from '@components/Header';
import { api } from '@services/api';
import { forkliftApi } from '@services/forklift';
import { isSaleAdmin, isYardManager, isSystemAdmin } from '@utils/rbac';

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
  from_slot?: {
    code: string;
    block: {
      code: string;
      yard: {
        name: string;
      };
    };
  };
  to_slot?: {
    code: string;
    block: {
      code: string;
      yard: {
        name: string;
      };
    };
  };
}

export default function Forklift() {
  const [tasks, setTasks] = useState<ForkliftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

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
      const response = await api.get('/forklift/tasks');
      console.log('🔍 Forklift tasks data:', response.data);
      setTasks(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách công việc xe nâng');
      console.error('Load tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/forklift/task/${taskId}/status`, { status: newStatus });
      // Reload danh sách sau khi cập nhật
      loadForkliftTasks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể cập nhật trạng thái');
      console.error('Update status error:', err);
    }
  };

  const assignForklift = async (taskId: string, forkliftId: string) => {
    try {
      await api.patch(`/forklift/assign`, { task_id: taskId, forklift_id: forkliftId });
      loadForkliftTasks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gán xe nâng');
      console.error('Assign forklift error:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa task này?')) return;
    
    try {
      await forkliftApi.deleteTask(taskId);
      // Reload danh sách sau khi xóa
      loadForkliftTasks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xóa task');
      console.error('Delete task error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  if (error && !userRole) {
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
                           {task.from_slot && task.from_slot.yard && task.from_slot.block ? (
                             <span className="location-info">
                               {task.from_slot.yard.name} / {task.from_slot.block.code} / {task.from_slot.code}
                             </span>
                           ) : (
                             <span className="text-gray-400">Bên ngoài</span>
                           )}
                         </td>
                                                 <td>
                           {task.to_slot && task.to_slot.yard && task.to_slot.block ? (
                             <span className="location-info">
                               {task.to_slot.yard.name} / {task.to_slot.block.code} / {task.to_slot.code}
                             </span>
                           ) : (
                             <span className="text-gray-400">-</span>
                           )}
                         </td>
                         <td>
                           <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                             {task.status === 'PENDING' && 'Chờ xử lý'}
                             {task.status === 'IN_PROGRESS' && 'Đang thực hiện'}
                             {task.status === 'COMPLETED' && 'Hoàn thành'}
                             {task.status === 'CANCELLED' && 'Đã hủy'}
                           </span>
                         </td>
                        <td>
                          {task.assigned_driver_id ? (
                            <span className="badge badge-info">
                              {task.assigned_driver_id}
                            </span>
                          ) : (
                            <span className="text-gray-400">Chưa gán</span>
                          )}
                        </td>
                        <td>
                          <span className="eta-date">
                            {new Date(task.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {task.status === 'PENDING' && (
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                >
                                  Bắt đầu
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => updateTaskStatus(task.id, 'CANCELLED')}
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                              >
                                Hoàn thành
                              </button>
                            )}
                                                         {!task.assigned_driver_id && task.status !== 'CANCELLED' && (
                               <button
                                 className="btn btn-sm btn-info"
                                 onClick={() => assignForklift(task.id, 'DR001')} // Tạm thời hardcode
                               >
                                 Gán tài xế
                               </button>
                             )}
                             {task.status === 'CANCELLED' && (
                               <button
                                 className="btn btn-sm btn-danger"
                                 onClick={() => deleteTask(task.id)}
                                 title="Xóa task đã hủy"
                               >
                                 🗑️ Xóa
                               </button>
                             )}
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
    </>
  );
}
