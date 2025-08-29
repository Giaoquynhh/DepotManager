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
  cost?: number; // Chi phí dịch vụ xe nâng
  report_status?: string; // Trạng thái báo cáo: PENDING, SUBMITTED, APPROVED, REJECTED
  report_image?: string; // Đường dẫn file ảnh báo cáo
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
  container_info?: {
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
  
  // State cho việc nhập chi phí và upload ảnh
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

  // Hàm xử lý cập nhật chi phí
  const handleCostUpdate = async (taskId: string, newCost: number) => {
    try {
      await driverDashboardApi.updateTaskCost(taskId, newCost);
      setEditingCost(null);
      await loadDashboardData();
    } catch (error) {
      console.error('Error updating task cost:', error);
    }
  };

  // Hàm xử lý upload ảnh báo cáo
  const handleImageUpload = async (taskId: string) => {
    if (!selectedFile) return;
    
    try {
      setUploadingImage(taskId);
      const formData = new FormData();
      formData.append('report_image', selectedFile);
      
      await driverDashboardApi.uploadReportImage(taskId, formData);
      setSelectedFile(null);
      setUploadingImage(null);
      await loadDashboardData();
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(null);
    }
  };

  // Hàm xử lý chọn file
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadingImage(taskId);
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
                        <th>Chi phí</th>
                        <th>Báo cáo</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedTasks.map((task) => (
                        <tr key={task.id} className="table-row">
                          {/* Cột Container */}
                          <td>
                            <span className="container-id">{task.container_no}</span>
                          </td>
                          
                          {/* Cột Từ vị trí - Hiển thị thông tin tài xế */}
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
                          
                          {/* Cột Đến vị trí - Hiển thị vị trí đích */}
                          <td>
                            <span className="location-text">
                              {task.to_slot 
                                ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                : 'Chưa xác định'
                              }
                            </span>
                          </td>
                          
                                                     {/* Cột Chi phí - Có thể nhập liệu */}
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
                                       console.log('Saving cost:', { taskId: task.id, value, inputValue: input.value });
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
                                 </div>
                               )}
                             </div>
                           </td>
                          
                                                     {/* Cột Báo cáo - Có thể upload ảnh */}
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
                                       gap: '4px'
                                     }}>
                                       <button
                                         className="btn btn-sm btn-success"
                                         style={{ fontSize: '10px', padding: '2px 6px' }}
                                         onClick={() => handleImageUpload(task.id)}
                                       >
                                         Gửi
                                       </button>
                                       <button
                                         className="btn btn-sm btn-outline"
                                         style={{ fontSize: '10px', padding: '2px 6px' }}
                                         onClick={() => {
                                           setSelectedFile(null);
                                           setUploadingImage(null);
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
                                   {task.report_status ? (
                                     <div style={{
                                       display: 'flex',
                                       flexDirection: 'column',
                                       alignItems: 'center',
                                       gap: '4px',
                                       padding: '6px',
                                       backgroundColor: '#fef3c7',
                                       borderRadius: '4px',
                                       border: '1px solid #f59e0b'
                                     }}>
                                       <span style={{ 
                                         color: '#92400e', 
                                         fontWeight: '600',
                                         fontSize: '12px'
                                       }}>
                                         {task.report_status}
                                       </span>
                                       {task.report_image && (
                                         <button
                                           className="btn btn-sm btn-outline"
                                           style={{
                                             fontSize: '10px',
                                             padding: '2px 4px'
                                           }}
                                           onClick={() => {
                                             // Tạo URL đầy đủ cho backend
                                             if (task.report_image) {
                                               let imageUrl;
                                               if (task.report_image.startsWith('http')) {
                                                 imageUrl = task.report_image;
                                               } else if (task.report_image.startsWith('/uploads/')) {
                                                 // Sử dụng static file serving
                                                 imageUrl = `http://localhost:1000${task.report_image}`;
                                               } else {
                                                 // Sử dụng route reports
                                                 const filename = task.report_image.split('/').pop();
                                                 imageUrl = `http://localhost:1000/driver-dashboard/reports/${filename}`;
                                               }
                                               console.log('Opening image URL:', imageUrl);
                                               window.open(imageUrl, '_blank');
                                             }
                                           }}
                                         >
                                           Xem ảnh
                                         </button>
                                       )}
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
                                   <button
                                     className="btn btn-sm btn-primary"
                                     style={{
                                       fontSize: '10px',
                                       padding: '2px 6px',
                                       marginTop: '4px'
                                     }}
                                     onClick={() => setUploadingImage(task.id)}
                                   >
                                     Gửi tài liệu
                                   </button>
                                 </div>
                               )}
                             </div>
                           </td>
                          
                          {/* Cột Trạng thái - Hiển thị trạng thái công việc */}
                          <td>
                            <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </td>
                          
                          {/* Cột Thao tác - Hiển thị các nút hành động */}
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
