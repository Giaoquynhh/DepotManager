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
  task_name: string;
  from_slot_id?: string;
  to_slot_id?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'CANCELLED';
  assigned_driver_id?: string;
  created_by: string;
  cost?: number;
  report_image?: string;
  created_at: string;
  updated_at: string;
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
  container_info?: {
    container_no?: string;
    driver_name?: string;
    license_plate?: string;
    status?: string;
    type?: string;
  };
}

export default function DriverDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<ForkliftTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<ForkliftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'history'>('overview');
  
  const [editingCost, setEditingCost] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải dữ liệu';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string, notes?: string) => {
    try {
      if (newStatus === 'PENDING_APPROVAL') {
        const task = assignedTasks.find(t => t.id === taskId);
        if (!task) {
          alert('Không tìm thấy thông tin công việc');
          return;
        }
        
        if (!task.cost || task.cost <= 0) {
          alert('Vui lòng nhập chi phí trước khi chuyển sang chờ duyệt');
          return;
        }
      }
      
      await driverDashboardApi.updateTaskStatus(taskId, newStatus, notes);
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error updating task status:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái';
      alert(errorMessage);
    }
  };

  const handleCostUpdate = async (taskId: string, newCost: number) => {
    try {
      if (!newCost || newCost <= 0) {
        alert('Vui lòng nhập chi phí hợp lệ (lớn hơn 0)');
        return;
      }
      
      if (newCost > 1000000000) {
        alert('Chi phí quá cao. Vui lòng kiểm tra lại');
        return;
      }
      
      if (!Number.isInteger(newCost)) {
        alert('Chi phí phải là số nguyên');
        return;
      }
      
      if (newCost < 0) {
        alert('Chi phí không thể là số âm');
        return;
      }
      
      const task = assignedTasks.find(t => t.id === taskId);
      if (task?.status === 'PENDING_APPROVAL') {
        const confirmUpdate = confirm('Task này đang chờ duyệt. Bạn có chắc muốn cập nhật chi phí? Việc này có thể ảnh hưởng đến quá trình duyệt.');
        if (!confirmUpdate) {
          return;
        }
      }
      
      await driverDashboardApi.updateTaskCost(taskId, newCost);
      setEditingCost(null);
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error updating task cost:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật chi phí';
      alert(errorMessage);
    } finally {
      setEditingCost(null);
    }
  };

  const handleImageUpload = async (taskId: string) => {
    if (!selectedFile) {
      alert('Vui lòng chọn file ảnh trước khi upload');
      return;
    }
    
    const task = assignedTasks.find(t => t.id === taskId);
    if (task?.status === 'PENDING_APPROVAL') {
      const confirmUpdate = confirm('Task này đang chờ duyệt. Bạn có chắc muốn cập nhật báo cáo? Việc này có thể ảnh hưởng đến quá trình duyệt.');
      if (!confirmUpdate) {
        return;
      }
    }
    
    try {
      setUploadingImage(taskId);
      const formData = new FormData();
      formData.append('report_image', selectedFile);
      
      await driverDashboardApi.uploadReportImage(taskId, formData);
      setSelectedFile(null);
      setUploadingImage(null);
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi upload ảnh báo cáo';
      alert(errorMessage);
      setUploadingImage(null);
    } finally {
      if (uploadingImage === taskId) {
        setUploadingImage(null);
      }
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Vui lòng chọn file ảnh (JPG, PNG, GIF, etc.)');
          event.target.value = '';
          setSelectedFile(null);
          return;
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
          event.target.value = '';
          setSelectedFile(null);
          return;
        }
        
        if (file.name.length > 100) {
          alert('Tên file quá dài. Vui lòng đổi tên file ngắn hơn');
          event.target.value = '';
          setSelectedFile(null);
          return;
        }
        
        setSelectedFile(file);
        setUploadingImage(taskId);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      alert('Có lỗi xảy ra khi chọn file');
      event.target.value = '';
      setSelectedFile(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-yellow';
      case 'IN_PROGRESS': return 'badge-blue';
      case 'PENDING_APPROVAL': return 'badge-orange';
      case 'COMPLETED': return 'badge-green';
      case 'CANCELLED': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ thực hiện';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'PENDING_APPROVAL': return 'Chờ duyệt';
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

        {activeTab === 'overview' && (
          <div className="space-y-6">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tỷ lệ hoàn thành</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.completionRate || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {dashboardData?.currentTask && (
              <div className="card card-padding-lg">
                <div className="card-header">
                  <h3 className="card-title">Công việc hiện tại</h3>
                </div>
                <div className="card-content">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-blue-800">
                        Container: {dashboardData.currentTask.container_info?.container_no}
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
                        <th>Chi phí</th>
                        <th>Báo cáo</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedTasks.map((task) => (
                        <tr key={task.id} className="table-row">
                          <td>
                            <span className="container-id">{task.container_info?.container_no}</span>
                          </td>
                          
                          <td>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              padding: '4px'
                            }}>
                              {task.container_info?.driver_name && task.container_info?.license_plate ? (
                                <>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px'
                                  }}>
                                    <span style={{ 
                                      color: '#64748b', 
                                      fontWeight: '600',
                                      minWidth: '50px'
                                    }}>Tài xế:</span>
                                    <span style={{ 
                                      color: '#1e293b', 
                                      fontWeight: '500',
                                      backgroundColor: '#dbeafe',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      fontSize: '11px'
                                    }}>
                                      {task.container_info.driver_name}
                                    </span>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px'
                                  }}>
                                    <span style={{ 
                                      color: '#64748b', 
                                      fontWeight: '600',
                                      minWidth: '50px'
                                    }}>Biển số:</span>
                                    <span style={{ 
                                      color: '#1e293b', 
                                      fontWeight: '500',
                                      backgroundColor: '#fef3c7',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      fontFamily: 'monospace',
                                      fontSize: '11px'
                                    }}>
                                      {task.container_info.license_plate}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <span className="location-text">
                                  {task.from_slot 
                                    ? `${task.from_slot.block.yard.name} - ${task.from_slot.block.code} - ${task.from_slot.code}`
                                    : 'Bên ngoài'
                                  }
                                </span>
                              )}
                            </div>
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
                             <div style={{
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center'
                             }}>
                               {editingCost === task.id ? (
                                 <div style={{
                                   display: 'flex',
                                   flexDirection: 'column',
                                   alignItems: 'center',
                                   gap: '6px',
                                   padding: '8px',
                                   backgroundColor: '#fef3c7',
                                   borderRadius: '6px',
                                   border: '1px solid #f59e0b'
                                 }}>
                                   <input
                                     type="number"
                                     min="0"
                                     placeholder="Nhập chi phí"
                                     className="input input-sm"
                                     data-task-id={task.id}
                                     style={{
                                       width: '100px',
                                       textAlign: 'center',
                                       fontSize: '12px'
                                     }}
                                     defaultValue={task.cost || ''}
                                     onKeyPress={(e) => {
                                       if (e.key === 'Enter') {
                                         const value = parseInt((e.target as HTMLInputElement).value);
                                         if (!isNaN(value) && value >= 0) {
                                           handleCostUpdate(task.id, value);
                                         }
                                       }
                                     }}
                                   />
                                   <div style={{
                                     display: 'flex',
                                     gap: '4px'
                                   }}>
                                     <button
                                       className="btn btn-sm btn-success"
                                       style={{ fontSize: '10px', padding: '2px 6px' }}
                                       onClick={() => {
                                         const input = document.querySelector(`input[data-task-id="${task.id}"]`) as HTMLInputElement;
                                         if (!input) {
                                           console.error('Input not found for task:', task.id);
                                           return;
                                         }
                                         const value = parseInt(input.value || '0');
                                         if (!isNaN(value) && value >= 0) {
                                           handleCostUpdate(task.id, value);
                                         } else {
                                           alert('Vui lòng nhập số hợp lệ');
                                         }
                                       }}
                                     >
                                       Lưu
                                     </button>
                                     <button
                                       className="btn btn-sm btn-outline"
                                       style={{ fontSize: '10px', padding: '2px 6px' }}
                                       onClick={() => setEditingCost(null)}
                                     >
                                       Hủy
                                     </button>
                                   </div>
                                 </div>
                               ) : (
                                 <div style={{
                                   display: 'flex',
                                   flexDirection: 'column',
                                   alignItems: 'center',
                                   gap: '4px',
                                   padding: '6px'
                                 }}>
                                   {task.cost && task.cost > 0 ? (
                                     <div style={{
                                       display: 'flex',
                                       flexDirection: 'column',
                                       alignItems: 'center',
                                       gap: '4px',
                                       padding: '6px',
                                       backgroundColor: '#f0fdf4',
                                       borderRadius: '4px',
                                       border: '1px solid #bbf7d0'
                                     }}>
                                       <span style={{ 
                                         color: '#059669', 
                                         fontWeight: '700',
                                         fontSize: '14px',
                                         fontFamily: 'monospace'
                                       }}>
                                         {task.cost.toLocaleString('vi-VN')}
                                       </span>
                                       <span style={{
                                         fontSize: '10px',
                                         color: '#16a34a',
                                         backgroundColor: '#dcfce7',
                                         padding: '2px 4px',
                                         borderRadius: '2px',
                                         fontWeight: '600'
                                       }}>
                                         VNĐ
                                       </span>
                                     </div>
                                   ) : (
                                     <span style={{ 
                                       color: '#94a3b8', 
                                       fontSize: '12px',
                                       fontStyle: 'italic'
                                     }}>
                                       Chưa có
                                     </span>
                                   )}
                                   {task.status !== 'PENDING_APPROVAL' && (
                                      <button
                                        className="btn btn-sm btn-outline"
                                        style={{
                                          fontSize: '10px',
                                          padding: '2px 6px',
                                          marginTop: '4px'
                                        }}
                                        onClick={() => setEditingCost(task.id)}
                                      >
                                        {task.cost ? 'Sửa' : 'Thêm'}
                                      </button>
                                    )}
                                 </div>
                               )}
                             </div>
                           </td>
                          
                           <td>
                             <div style={{
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center'
                             }}>
                               {uploadingImage === task.id ? (
                                 <div style={{
                                   display: 'flex',
                                   flexDirection: 'column',
                                   alignItems: 'center',
                                   gap: '6px',
                                   padding: '8px',
                                   backgroundColor: '#fef3c7',
                                   borderRadius: '6px',
                                   border: '1px solid #f59e0b'
                                 }}>
                                   <input
                                     type="file"
                                     accept="image/*"
                                     className="input input-sm"
                                     style={{
                                       fontSize: '10px',
                                       width: '120px'
                                     }}
                                     onChange={(e) => handleFileSelect(e, task.id)}
                                   />
                                   {selectedFile && (
                                     <div style={{
                                       display: 'flex',
                                       gap: '4px',
                                       marginTop: '4px'
                                     }}>
                                       <button
                                         className="btn btn-sm btn-success"
                                         style={{ fontSize: '10px', padding: '2px 6px' }}
                                         onClick={() => handleImageUpload(task.id)}
                                       >
                                         Upload
                                       </button>
                                       <button
                                         className="btn btn-sm btn-outline"
                                         style={{ fontSize: '10px', padding: '2px 6px' }}
                                         onClick={() => {
                                           setUploadingImage(null);
                                           setSelectedFile(null);
                                         }}
                                       >
                                         Hủy
                                       </button>
                                     </div>
                                   )}
                                 </div>
                               ) : (
                                 <div style={{
                                   display: 'flex',
                                   flexDirection: 'column',
                                   alignItems: 'center',
                                   gap: '4px',
                                   padding: '6px'
                                 }}>
                                   {task.report_image ? (
                                     <a href={task.report_image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                       Xem ảnh
                                     </a>
                                   ) : (
                                     <span style={{ 
                                       color: '#94a3b8', 
                                       fontSize: '12px',
                                       fontStyle: 'italic'
                                     }}>
                                       Chưa có
                                     </span>
                                   )}
                                   {task.status !== 'PENDING_APPROVAL' && (
                                    <button
                                      className="btn btn-sm btn-outline"
                                      style={{
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        marginTop: '4px'
                                      }}
                                      onClick={() => setUploadingImage(task.id)}
                                    >
                                      {task.report_image ? 'Sửa' : 'Thêm'}
                                    </button>
                                   )}
                                 </div>
                               )}
                             </div>
                           </td>

                          <td>
                            <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </td>

                          <td>
                            <div className="flex items-center justify-center space-x-2">
                              {task.status === 'PENDING' && (
                                <button 
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
                                >
                                  Bắt đầu
                                </button>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleStatusUpdate(task.id, 'PENDING_APPROVAL')}
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
                        <th>Chi phí</th>
                        <th>Trạng thái</th>
                        <th>Ngày hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskHistory.map((task) => (
                        <tr key={task.id} className="table-row">
                          <td>
                            <span className="container-id">{task.container_info?.container_no}</span>
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
                            {task.cost ? `${task.cost.toLocaleString('vi-VN')} VNĐ` : 'N/A'}
                          </td>
                          <td>
                            <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </td>
                          <td>
                            {new Date(task.updated_at).toLocaleString('vi-VN')}
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
