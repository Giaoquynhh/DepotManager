import { useState, useEffect, useRef } from 'react';
import Header from '@components/Header';
import Card from '@components/Card';
import { driverDashboardApi } from '@services/driverDashboard';
import { useTranslation } from '@hooks/useTranslation';
import { useToast } from '@hooks/useToastHook';
import { API_BASE } from '@services/api';

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
  container_no?: string;
  from_slot_id?: string;
  to_slot_id?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'CANCELLED';
  assigned_driver_id?: string;
  created_by: string;
  report_image?: string;
  createdAt: string;
  updatedAt: string;
  actual_location?: {
    id: string;
    tier: number;
    status: string;
    slot: {
      id: string;
      code: string;
      block: {
        code: string;
        yard: {
          name: string;
        };
      };
    };
  } | null;
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
    driver_phone?: string;
    license_plate?: string;
    status?: string;
    type?: string;
    request_no?: string;
    container_type?: {
      code?: string;
    };
  };
  report_images_count?: number;
}

export default function DriverDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<ForkliftTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<ForkliftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'history'>('overview');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentUploadTask, setCurrentUploadTask] = useState<ForkliftTask | null>(null);
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [currentTaskImages, setCurrentTaskImages] = useState<any[]>([]);
  
  // Đã loại bỏ tính năng ảnh báo cáo ở DriverDashboard
  const { t, currentLanguage } = useTranslation();
  const { showSuccess, showError, ToastContainer } = useToast();
  const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
  const hasShownInitialToast = useRef(false);

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
      if (!hasShownInitialToast.current) {
        showSuccess(t('pages.driverDashboard.messages.dataLoadedSuccessfully'));
        hasShownInitialToast.current = true;
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('pages.driverDashboard.messages.errorLoading');
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string, notes?: string) => {
    try {
      await driverDashboardApi.updateTaskStatus(taskId, newStatus, notes);
      await loadDashboardData();
      showSuccess(t('pages.driverDashboard.messages.statusUpdatedSuccessfully'));
    } catch (error: any) {
      console.error('Error updating task status:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('pages.driverDashboard.messages.errorUpdatingStatus');
      showError(errorMessage);
    }
  };

  // Đã bỏ toàn bộ handler upload/xem ảnh

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
      case 'PENDING': return t('pages.forklift.status.pending');
      case 'IN_PROGRESS': return t('pages.forklift.status.inProgress');
      case 'PENDING_APPROVAL': return t('pages.forklift.status.pendingApproval');
      case 'COMPLETED': return t('pages.forklift.status.completed');
      case 'CANCELLED': return t('pages.forklift.status.cancelled');
      default: return status;
    }
  };

  // Bỏ các modal ảnh
  const handleViewReportImages = async (task: ForkliftTask) => {
    try {
      const images = await driverDashboardApi.getTaskImages(task.id);
      if (!images || images.length === 0) {
        showError(t('pages.driverDashboard.messages.noReportImages'));
        return;
      }
      setCurrentUploadTask(task);
      setCurrentTaskImages(images);
      setIsImagesModalOpen(true);
    } catch (e: any) {
      showError(e?.message || 'Không tải được danh sách ảnh');
    }
  };

  const handleUploadImages = (task: ForkliftTask) => {
    setCurrentUploadTask(task);
    setSelectedFiles([]);
    // cleanup old previews
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setIsUploadModalOpen(true);
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const accepted: File[] = [];
    const urls: string[] = [];
    const maxSize = 5 * 1024 * 1024;

    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        showError(t('pages.driverDashboard.messages.pleaseSelectImageFile'));
        continue;
      }
      if (f.size > maxSize) {
        showError(t('pages.driverDashboard.messages.fileTooLarge5MB'));
        continue;
      }
      if (f.name.length > 100) {
        showError(t('pages.driverDashboard.messages.fileNameTooLong'));
        continue;
      }
      accepted.push(f);
      urls.push(URL.createObjectURL(f));
    }

    // cleanup old urls
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setSelectedFiles(accepted);
    setPreviewUrls(urls);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setCurrentUploadTask(null);
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setSelectedFiles([]);
  };

  const getImageUrl = (storage_url?: string) => {
    if (!storage_url) return '#';
    let u = storage_url.replace(/\\/g, '/');
    const idx = u.lastIndexOf('/uploads/');
    if (idx >= 0) {
      u = u.substring(idx);
    } else if (/^[A-Za-z]:\//.test(u)) {
      // Absolute path Windows -> lấy tên file và đưa về uploads
      const name = u.split('/').pop() || '';
      u = `/uploads/reports/${name}`;
    } else if (!u.startsWith('/uploads/')) {
      // Fallback: đảm bảo prefix
      u = `/uploads/${u.replace(/^\//,'')}`;
    }
    return `${API_BASE}${u}`;
  };

  const submitUpload = async () => {
    try {
      if (!currentUploadTask) return;
      if (selectedFiles.length === 0) {
        showError(t('pages.driverDashboard.messages.pleaseSelectImageFile'));
        return;
      }
      // Gọi API upload
      await driverDashboardApi.uploadTaskImages(currentUploadTask.id, selectedFiles);
      showSuccess('Tải ảnh thành công');
      closeUploadModal();
      // Reload để cập nhật số ảnh
      await loadDashboardData();
    } catch (e: any) {
      showError(e?.message || 'Upload failed');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="container">
            <div className="text-center py-8">
              <div className="loading-spinner spinner-lg spinner-primary"></div>
              <p className="mt-4">{t('pages.driverDashboard.messages.loadingData')}</p>
            </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="container driver-dashboard-modern">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">{t('pages.driverDashboard.title')}</h1>
            </div>
          </div>
        </div>

        <Card padding="lg" className="driver-card">
          <div className="quick-actions">
            {[
              { id: 'overview', label: t('pages.driverDashboard.tabs.overview'), icon: '📊' },
              { id: 'tasks', label: t('pages.driverDashboard.tabs.tasks'), icon: '📋' },
              { id: 'history', label: t('pages.driverDashboard.tabs.history'), icon: '📚' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pill-btn ${activeTab === tab.id ? 'pill-primary' : 'pill-secondary'}`}
                onMouseDown={(e)=>{
                  const t=e.currentTarget;const r=document.createElement('span');const d=t.getBoundingClientRect();const x=e.clientX-d.left;const y=e.clientY-d.top;r.className='ripple';r.style.left=`${x}px`;r.style.top=`${y}px`;r.style.width=r.style.height=Math.max(d.width,d.height)+'px';t.appendChild(r);setTimeout(()=>r.remove(),650);
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {activeTab === 'overview' && (
          <div className="space-y-16" style={{ marginTop: '32px' }}>
            <div className="stat-grid grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card padding="md" hoverable className="driver-card stat-tile">
                <div className="flex items-center">
                  <div className="stat-icon stat-blue">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('pages.driverDashboard.stats.totalTasks')}</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.totalTasks || 0}</p>
                  </div>
                </div>
              </Card>

              <Card padding="md" hoverable className="driver-card stat-tile">
                <div className="flex items-center">
                  <div className="stat-icon stat-green">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('pages.driverDashboard.stats.completedToday')}</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.completedToday || 0}</p>
                  </div>
                </div>
              </Card>

              <Card padding="md" hoverable className="driver-card stat-tile">
                <div className="flex items-center">
                  <div className="stat-icon stat-orange">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('pages.driverDashboard.stats.pending')}</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.pendingTasks || 0}</p>
                  </div>
                </div>
              </Card>

              <Card padding="md" hoverable className="driver-card stat-tile">
                <div className="flex items-center">
                  <div className="stat-icon stat-purple">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('pages.driverDashboard.stats.completionRate')}</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData?.summary.completionRate || 0}%</p>
                  </div>
                </div>
              </Card>
            </div>


          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-16">
            <Card title={t('pages.driverDashboard.assignedTasks.title')} padding="lg">
                <div className="table-container" style={{ height: '55vh', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
                  <table className="table-modern sticky-header">
                    <thead>
                      <tr>
                        <th>📋 {t('pages.driverDashboard.tableHeaders.requestNo')}</th>
                        <th>📦 {t('pages.driverDashboard.tableHeaders.container')}</th>
                        <th>📦 {t('pages.driverDashboard.tableHeaders.containerType')}</th>
                        <th>📍 {t('pages.driverDashboard.tableHeaders.from')}</th>
                        <th>🎯 {t('pages.driverDashboard.tableHeaders.to')}</th>
                        <th>📊 {t('pages.driverDashboard.tableHeaders.report')}</th>
                        <th>⚡ {t('pages.driverDashboard.tableHeaders.status')}</th>
                        <th>🔧 {t('pages.driverDashboard.tableHeaders.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedTasks.map((task) => (
                        <tr key={task.id} className="table-row">
                          <td>
                            <span className="container-id">
                              {task.container_info?.request_no || '-'}
                            </span>
                          </td>
                          <td>
                            <span className="container-id">{task.container_no || task.container_info?.container_no}</span>
                          </td>
                          <td>
                            <span className="container-id">
                              {task.container_info?.container_type?.code || '-'}
                            </span>
                          </td>
                          
                          <td>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              padding: '4px'
                            }}>
                              {/* Từ vị trí: theo quy tắc Forklift - EXPORT = bãi, IMPORT = xe */}
                              {task.container_info?.type === 'EXPORT' ? (
                                task.actual_location ? (
                                  <span style={{
                                    color: '#1f2937',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    backgroundColor: '#f3f4f6',
                                    padding: '6px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid #d1d5db'
                                  }}>
                                    {`${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`}
                                  </span>
                                ) : (
                                  <span className="location-text">
                                    {task.from_slot?.code || t('pages.forklift.location.outside')}
                                  </span>
                                )
                              ) : task.container_info?.type === 'IMPORT' ? (
                                task.container_info?.driver_name && task.container_info?.license_plate ? (
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
                                      }}>{t('pages.forklift.driver.driverName')}</span>
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
                                      }}>{t('pages.forklift.driver.licensePlate')}</span>
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
                                  <span style={{ 
                                    color: '#94a3b8', 
                                    fontSize: '12px',
                                    fontStyle: 'italic'
                                  }}>
                                    {t('pages.forklift.driver.noInfo')}
                                  </span>
                                )
                              ) : (
                                // Fallback giữ nguyên như Forklift
                                task.from_slot ? (
                                  <span className="location-text">
                                    {`${task.from_slot.block.yard.name} - ${task.from_slot.block.code} - ${task.from_slot.code}`}
                                  </span>
                                ) : (
                                  <span className="location-text">{t('pages.forklift.location.outside')}</span>
                                )
                              )}
                            </div>
                          </td>
                          
                          <td>
                            {/* Đến vị trí: theo quy tắc Forklift - EXPORT = xe, IMPORT = bãi */}
                            {task.container_info?.type === 'EXPORT' ? (
                              task.container_info?.driver_name && task.container_info?.license_plate ? (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  padding: '4px'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px'
                                  }}>
                                    <span style={{ color: '#64748b', fontWeight: '600', minWidth: '50px' }}>{t('pages.forklift.driver.driverName')}</span>
                                    <span style={{ color: '#1e293b', fontWeight: '500', backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>
                                      {task.container_info.driver_name}
                                    </span>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px'
                                  }}>
                                    <span style={{ color: '#64748b', fontWeight: '600', minWidth: '50px' }}>{t('pages.forklift.driver.licensePlate')}</span>
                                    <span style={{ color: '#1e293b', fontWeight: '500', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px' }}>
                                      {task.container_info.license_plate}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>{t('pages.forklift.driver.noInfo')}</span>
                              )
                            ) : task.container_info?.type === 'IMPORT' ? (
                              task.actual_location ? (
                                <span className="location-text">
                                  {`${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`}
                                </span>
                              ) : (
                                <span className="location-text">
                                  {task.to_slot 
                                    ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                    : t('pages.requests.location.unknown')}
                                </span>
                              )
                            ) : (
                              // Fallback giữ nguyên
                              <span className="location-text">
                                {task.actual_location 
                                  ? `${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`
                                  : (task.to_slot 
                                    ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                    : t('pages.requests.location.unknown')
                                  )
                                }
                              </span>
                            )}
                          </td>
                          
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                            <span
                              role="button"
                              onClick={() => handleViewReportImages(task)}
                              title="Xem ảnh kiểm tra"
                              className="badge badge-sm badge-blue"
                              style={{ cursor: 'pointer' }}
                            >
                              {(task.report_images_count ?? 0)} ảnh kiểm tra
                            </span>
                            <button
                              className="btn btn-xs btn-primary"
                              title="Tải ảnh"
                              disabled={task.status !== 'IN_PROGRESS'}
                              onClick={() => {
                                if (task.status !== 'IN_PROGRESS') {
                                  showError('Vui lòng nhấn Bắt đầu trước khi tải ảnh');
                                  return;
                                }
                                handleUploadImages(task);
                              }}
                            >
                              Tải ảnh
                            </button>
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
                                  {t('pages.driverDashboard.actions.start')}
                                </button>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <button 
                                  className={`btn btn-sm ${(task.report_images_count ?? 0) > 0 ? 'btn-success' : 'btn-disabled'}`}
                                  disabled={(task.report_images_count ?? 0) === 0}
                                  onClick={() => {
                                    if ((task.report_images_count ?? 0) === 0) {
                                      showError('Vui lòng tải ảnh kiểm tra trước khi hoàn thành công việc');
                                      return;
                                    }
                                    handleStatusUpdate(task.id, 'COMPLETED');
                                  }}
                                  title={(task.report_images_count ?? 0) === 0 ? 'Vui lòng tải ảnh kiểm tra trước khi hoàn thành' : 'Hoàn thành công việc'}
                                >
                                  {t('pages.driverDashboard.actions.complete')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-16">
            <Card title={t('pages.driverDashboard.history.title')} padding="lg">
                <div className="table-container">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>📋 {t('pages.driverDashboard.tableHeaders.requestNo')}</th>
                        <th>📦 {t('pages.driverDashboard.tableHeaders.container')}</th>
                        <th>📦 {t('pages.driverDashboard.tableHeaders.containerType')}</th>
                        <th>{t('pages.driverDashboard.tableHeaders.from')}</th>
                        <th>{t('pages.driverDashboard.tableHeaders.to')}</th>
                        <th>{t('pages.driverDashboard.tableHeaders.status')}</th>
                        <th>{t('pages.driverDashboard.history.completedAt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskHistory.map((task) => (
                        <tr key={task.id} className="table-row">
                          <td>
                            <span className="container-id">
                              {task.container_info?.request_no || '-'}
                            </span>
                          </td>
                          <td>
                            <span className="container-id">{task.container_no || task.container_info?.container_no}</span>
                          </td>
                          <td>
                            <span className="container-id">
                              {task.container_info?.container_type?.code || '-'}
                            </span>
                          </td>
                          <td>
                            {/* Lịch sử: Từ vị trí theo quy tắc như Forklift */}
                            {task.container_info?.type === 'EXPORT' ? (
                              task.actual_location ? (
                                <span className="location-text">
                                  {`${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`}
                                </span>
                              ) : (
                                <span className="location-text">{task.from_slot?.code || t('pages.forklift.location.outside')}</span>
                              )
                            ) : task.container_info?.type === 'IMPORT' ? (
                              task.container_info?.driver_name && task.container_info?.license_plate ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b', fontWeight: '600', minWidth: '50px' }}>{t('pages.forklift.driver.driverName')}</span>
                                    <span style={{ color: '#1e293b', fontWeight: '500', backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>{task.container_info.driver_name}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b', fontWeight: '600', minWidth: '50px' }}>{t('pages.forklift.driver.licensePlate')}</span>
                                    <span style={{ color: '#1e293b', fontWeight: '500', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px' }}>{task.container_info.license_plate}</span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>{t('pages.forklift.driver.noInfo')}</span>
                              )
                            ) : (
                              <span className="location-text">
                                {task.from_slot 
                                  ? `${task.from_slot.block.yard.name} - ${task.from_slot.block.code} - ${task.from_slot.code}`
                                  : t('pages.forklift.location.outside')}
                              </span>
                            )}
                          </td>
                          <td>
                            {/* Lịch sử: Đến vị trí theo quy tắc như Forklift */}
                            {task.container_info?.type === 'EXPORT' ? (
                              task.container_info?.driver_name && task.container_info?.license_plate ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b', fontWeight: '600', minWidth: '50px' }}>{t('pages.forklift.driver.driverName')}</span>
                                    <span style={{ color: '#1e293b', fontWeight: '500', backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>{task.container_info.driver_name}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b', fontWeight: '600', minWidth: '50px' }}>{t('pages.forklift.driver.licensePlate')}</span>
                                    <span style={{ color: '#1e293b', fontWeight: '500', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px' }}>{task.container_info.license_plate}</span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>{t('pages.forklift.driver.noInfo')}</span>
                              )
                            ) : task.container_info?.type === 'IMPORT' ? (
                              task.actual_location ? (
                                <span className="location-text">
                                  {`${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`}
                                </span>
                              ) : (
                                <span className="location-text">
                                  {task.to_slot 
                                    ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                    : t('pages.requests.location.unknown')}
                                </span>
                              )
                            ) : (
                              <span className="location-text">
                                {task.actual_location 
                                  ? `${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`
                                  : (task.to_slot 
                                    ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                    : 'Chưa xác định'
                                  )
                                }
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </td>
                          <td>
                            {task.updatedAt ? new Date(task.updatedAt).toLocaleString(locale) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </Card>
          </div>
        )}
      </main>
      {/* Modal upload ảnh báo cáo */}
      {isUploadModalOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            style={{
              width: '90%',
              maxWidth: '720px',
              background: '#fff',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            <div className="modal-header" style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 className="modal-title">Tải ảnh báo cáo</h3>
            </div>
            <div className="modal-body" style={{ padding: '16px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleModalFileChange}
                />
                <span className="text-sm text-gray-500">
                  Chỉ nhận ảnh, tối đa 5MB/ảnh
                </span>
              </div>
              {previewUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="preview-tile">
                      <img src={url} alt={`preview-${idx}`} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                      <div className="text-xs text-gray-600" style={{ marginTop: '6px', wordBreak: 'break-all' }}>
                        {selectedFiles[idx]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500" style={{ padding: '24px 0' }}>
                  Chưa chọn ảnh nào
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
              <button className="btn btn-sm btn-outline" onClick={closeUploadModal}>Đóng</button>
              <button className="btn btn-sm btn-primary" onClick={submitUpload} disabled={selectedFiles.length === 0}>Tải lên</button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />

      {/* Modal xem ảnh đã upload */}
      {isImagesModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: '92%', maxWidth: '900px', background: '#fff', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Ảnh kiểm tra</h3>
              <button className="btn btn-xs btn-outline" onClick={() => setIsImagesModalOpen(false)}>Đóng</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="grid grid-cols-3 gap-4">
                {currentTaskImages.map((img: any) => (
                  <div key={img.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <img src={`${API_BASE}/${img.storage_url?.replace(/^\//,'')}`} alt={img.file_name} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-xs" style={{ wordBreak: 'break-all' }}>{img.file_name}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a className="btn btn-xs btn-outline" href={getImageUrl(img.storage_url)} target="_blank" rel="noreferrer">Xem</a>
                        <button className="btn btn-xs btn-danger" onClick={async () => {
                          if (!currentUploadTask) return;
                          await driverDashboardApi.deleteTaskImage(currentUploadTask.id, img.id);
                          const refreshed = await driverDashboardApi.getTaskImages(currentUploadTask.id);
                          setCurrentTaskImages(refreshed);
                          await loadDashboardData();
                        }}>Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
