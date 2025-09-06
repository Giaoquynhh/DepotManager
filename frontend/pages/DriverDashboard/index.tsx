import { useState, useEffect } from 'react';
import Header from '@components/Header';
import Card from '@components/Card';
import { driverDashboardApi } from '@services/driverDashboard';
import { useTranslation } from '@hooks/useTranslation';
import { useToast } from '@hooks/useToastHook';

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
  report_image?: string;
  created_at: string;
  updated_at: string;
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
  
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { t, currentLanguage } = useTranslation();
  const { showSuccess, showError, ToastContainer } = useToast();
  const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';

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
      showSuccess(t('pages.driverDashboard.messages.dataLoadedSuccessfully'));
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

  const handleImageUpload = async (taskId: string) => {
    if (!selectedFile) {
      showError(t('pages.driverDashboard.messages.selectImageFileBeforeUpload'));
      return;
    }
    
    const task = assignedTasks.find(t => t.id === taskId);
    if (task?.status === 'PENDING_APPROVAL') {
      const confirmUpdate = confirm(t('pages.driverDashboard.messages.confirmUploadPendingApproval'));
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
      showSuccess(t('pages.driverDashboard.messages.imageUploadedSuccessfully'));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      const errorMessage = error?.response?.data?.message || error?.message || t('pages.driverDashboard.messages.errorUploadingImage');
      showError(errorMessage);
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
          showError(t('pages.driverDashboard.messages.pleaseSelectImageFile'));
          event.target.value = '';
          setSelectedFile(null);
          return;
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          showError(t('pages.driverDashboard.messages.fileTooLarge5MB'));
          event.target.value = '';
          setSelectedFile(null);
          return;
        }
        
        if (file.name.length > 100) {
          showError(t('pages.driverDashboard.messages.fileNameTooLong'));
          event.target.value = '';
          setSelectedFile(null);
          return;
        }
        
        setSelectedFile(file);
        setUploadingImage(taskId);
        showSuccess(t('pages.driverDashboard.messages.fileSelectedSuccessfully'));
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      showError(t('pages.driverDashboard.messages.errorSelectingFile'));
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
      case 'PENDING': return t('pages.forklift.status.pending');
      case 'IN_PROGRESS': return t('pages.forklift.status.inProgress');
      case 'PENDING_APPROVAL': return t('pages.forklift.status.pendingApproval');
      case 'COMPLETED': return t('pages.forklift.status.completed');
      case 'CANCELLED': return t('pages.forklift.status.cancelled');
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
              <p className="page-subtitle">{t('pages.driverDashboard.subtitle')}</p>
            </div>
          </div>
        </div>

        <Card title="Điều hướng" padding="lg" className="driver-card">
          <div className="quick-actions">
            {[
              { id: 'overview', label: t('pages.driverDashboard.tabs.overview'), icon: '📊', className: 'pill-btn pill-primary' },
              { id: 'tasks', label: t('pages.driverDashboard.tabs.tasks'), icon: '📋', className: 'pill-btn pill-secondary' },
              { id: 'history', label: t('pages.driverDashboard.tabs.history'), icon: '📚', className: 'pill-btn pill-secondary' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={tab.className}
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
                <div className="table-container">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>{t('pages.driverDashboard.tableHeaders.container')}</th>
                        <th>{t('pages.driverDashboard.tableHeaders.from')}</th>
                        <th>{t('pages.driverDashboard.tableHeaders.to')}</th>
                        <th>{t('pages.driverDashboard.tableHeaders.report')}</th>
                        <th>{t('pages.driverDashboard.tableHeaders.status')}</th>
                        <th>{t('pages.driverDashboard.tableHeaders.actions')}</th>
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
                                <span className="location-text">
                                  {task.from_slot 
                                    ? `${task.from_slot.block.yard.name} - ${task.from_slot.block.code} - ${task.from_slot.code}`
                                    : t('pages.forklift.location.outside')
                                  }
                                </span>
                              )}
                            </div>
                          </td>
                          
                          <td>
                            <span className="location-text">
                              {task.actual_location 
                                ? `${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`
                                : (task.to_slot 
                                  ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                  : t('pages.requests.location.unknown')
                                )
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
                                     placeholder={t('pages.driverDashboard.cost.inputPlaceholder')}
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
                                           showError(t('pages.driverDashboard.messages.invalidNumber'));
                                          }
                                       }}
                                     >
                                       {t('common.save')}
                                     </button>
                                     <button
                                       className="btn btn-sm btn-outline"
                                       style={{ fontSize: '10px', padding: '2px 6px' }}
                                       onClick={() => {
                                         setEditingCost(null);
                                         showSuccess(t('pages.driverDashboard.messages.editCancelled'));
                                       }}
                                     >
                                       {t('common.cancel')}
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
                                         {task.cost.toLocaleString(locale)}
                                       </span>
                                       <span style={{
                                         fontSize: '10px',
                                         color: '#16a34a',
                                         backgroundColor: '#dcfce7',
                                         padding: '2px 4px',
                                         borderRadius: '2px',
                                         fontWeight: '600'
                                       }}>
                                         {t('pages.driverDashboard.cost.currencyShort')}
                                       </span>
                                     </div>
                                   ) : (
                                     <span style={{ 
                                       color: '#94a3b8', 
                                       fontSize: '12px',
                                       fontStyle: 'italic'
                                     }}>
                                       {t('pages.forklift.cost.noCost')}
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
                                        {task.cost ? t('common.edit') : t('common.add')}
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
                                         {t('pages.driverDashboard.report.upload')}
                                       </button>
                                       <button
                                         className="btn btn-sm btn-outline"
                                         style={{ fontSize: '10px', padding: '2px 6px' }}
                                         onClick={() => {
                                           setUploadingImage(null);
                                           setSelectedFile(null);
                                           showSuccess(t('pages.driverDashboard.messages.uploadCancelled'));
                                         }}
                                       >
                                         {t('common.cancel')}
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
                                     <a 
                                       href={task.report_image.startsWith('http') 
                                         ? task.report_image 
                                         : `http://localhost:1000${task.report_image}`
                                       } 
                                       target="_blank" 
                                       rel="noopener noreferrer" 
                                       className="text-blue-600 hover:underline"
                                     >
                                       {t('pages.driverDashboard.report.viewImage')}
                                     </a>
                                   ) : (
                                     <span style={{ 
                                       color: '#94a3b8', 
                                       fontSize: '12px',
                                       fontStyle: 'italic'
                                     }}>
                                       {t('pages.driverDashboard.report.none')}
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
                                      {task.report_image ? t('common.edit') : t('common.add')}
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
                                  {t('pages.driverDashboard.actions.start')}
                                </button>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <button 
                                  className={`btn btn-sm ${task.report_image ? 'btn-success' : 'btn-disabled'}`}
                                  onClick={() => {
                                    if (!task.report_image) {
                                      alert(t('pages.driverDashboard.messages.requireReportBeforeComplete'));
                                      return;
                                    }
                                    handleStatusUpdate(task.id, 'COMPLETED');
                                  }}
                                  disabled={!task.report_image}
                                  title={!task.report_image ? t('pages.driverDashboard.messages.requireReportTooltip') : ''}
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
                        <th>{t('pages.driverDashboard.tableHeaders.container')}</th>
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
                            <span className="container-id">{task.container_info?.container_no}</span>
                          </td>
                          <td>
                            <span className="location-text">
                              {task.from_slot 
                                ? `${task.from_slot.block.yard.name} - ${task.from_slot.block.code} - ${task.from_slot.code}`
                                : t('pages.forklift.location.outside')
                              }
                            </span>
                          </td>
                          <td>
                            <span className="location-text">
                              {task.actual_location 
                                ? `${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`
                                : (task.to_slot 
                                  ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.code} - ${task.to_slot.code}`
                                  : 'Chưa xác định'
                                )
                              }
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-md ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </td>
                          <td>
                            {new Date(task.updated_at).toLocaleString(locale)}
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
      <ToastContainer />
    </>
  );
}
