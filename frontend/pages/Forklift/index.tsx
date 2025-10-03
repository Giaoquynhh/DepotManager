import { useState, useEffect } from 'react';
import Header from '@components/Header';
import { api, API_BASE } from '@services/api';
import { isTechnicalDepartment, isYardManager, isSystemAdmin } from '@utils/rbac';
import AssignDriverModal from '@components/Forklift/AssignDriverModal';
import { useTranslation } from '@hooks/useTranslation';
import { useToast } from '@hooks/useToastHook';

interface ForkliftTask {
  id: string;
  container_no: string;
  from_slot_id?: string;
  to_slot_id?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'CANCELLED';
  assigned_driver_id?: string;
  created_by: string;
  cancel_reason?: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    full_name: string;
    email: string;
  };
  container_info?: {
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
  fixed_location?: {
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
  display_location?: {
    id: string;
    code: string;
    block: {
      code: string;
      yard: {
        name: string;
      };
    };
  } | null;
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

export default function Forklift({ typeFilter }: { typeFilter?: 'IMPORT' | 'EXPORT' } = {}) {
  const { t } = useTranslation();
  const { showSuccess, showError, ToastContainer } = useToast();
  const [tasks, setTasks] = useState<ForkliftTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ForkliftTask | null>(null);
  const [costModalOpen, setCostModalOpen] = useState(false);

  // Modal styles
  const modalStyles = {
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '0',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
    },
    modalHeader: {
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937'
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '0',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    modalBody: {
      padding: '20px'
    },
    modalFooter: {
      padding: '20px',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#374151'
    },
    formInput: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s'
    }
  };

  useEffect(() => {
    // Lấy thông tin user role
    api.get('/auth/me')
      .then(response => {
        const role = response.data?.role || response.data?.roles?.[0];
        setUserRole(role);
        
        // Kiểm tra quyền truy cập
        if (!isTechnicalDepartment(role) && !isYardManager(role) && !isSystemAdmin(role)) {
          setError(t('pages.forklift.accessDenied'));
          return;
        }
        
        // Load danh sách công việc xe nâng
        loadForkliftTasks();
      })
      .catch(err => {
        setError(t('pages.forklift.authError'));
        console.error('Auth error:', err);
      });
  }, []);


  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      // Clear any pending intervals
    };
  }, []);

  const loadForkliftTasks = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Thêm type filter vào API call
      const params = new URLSearchParams();
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      
      const response = await api.get(`/forklift/jobs?${params.toString()}`);
      const allTasks: ForkliftTask[] = response.data.data || [];
      
      // Backend đã filter, không cần filter thêm ở frontend
      const newTasks = allTasks;
      
      // Chỉ cập nhật state nếu có thay đổi thực sự
      setTasks(prevTasks => {
        if (JSON.stringify(prevTasks) !== JSON.stringify(newTasks)) {
          return newTasks;
        }
        return prevTasks;
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || t('pages.forklift.loadError'));
      console.error('Load tasks error:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleAssignDriver = (task: ForkliftTask) => {
    setSelectedTask(task);
    setAssignModalOpen(true);
  };

  const handleDriverAssigned = (driverId: string, driverName: string) => {
    // Update the task in the list with the new driver
    if (selectedTask) {
      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { ...task, assigned_driver_id: driverId }
          : task
      ));
      
      // Hiển thị thông báo thành công
      showSuccess(
        t('pages.forklift.modal.assignSuccess'),
        t('pages.forklift.modal.assignSuccessMessage').replace('{driverName}', driverName).replace('{containerNo}', selectedTask.container_no)
      );
    }
    loadForkliftTasks(); // Refresh the list
  };
  const handleUpdateCost = async (taskId: string, cost: number) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/cost`, { cost });
      loadForkliftTasks(); // Refresh the list
      setCostModalOpen(false);
      setSelectedTask(null);
      
      // Hiển thị thông báo thành công
      showSuccess(
        t('pages.forklift.messages.updateCostSuccess'),
        t('pages.forklift.messages.updateCostSuccessMessage').replace('{cost}', cost.toLocaleString('vi-VN'))
      );
    } catch (err: any) {
      showError(t('pages.forklift.messages.updateCostError'), err?.response?.data?.message || t('pages.forklift.messages.updateCostError'));
    }
  };

  const handleStartJob = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/start`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.startJobError'));
    }
  };

  const handleBeginWork = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/begin-work`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.beginWorkError'));
    }
  };

  const handleCompleteJob = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/complete`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.completeJobError'));
    }
  };

  const handleApproveJob = async (taskId: string) => {
    try {
      await api.patch(`/forklift/jobs/${taskId}/approve`);
      loadForkliftTasks();
    } catch (err: any) {
      alert(err?.response?.data?.message || t('pages.forklift.messages.approveJobError'));
    }
  };


  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return t('pages.forklift.status.pending');
      case 'ASSIGNED': return t('pages.forklift.status.assigned');
      case 'IN_PROGRESS': return t('pages.forklift.status.inProgress');
      case 'PENDING_APPROVAL': return t('pages.forklift.status.pendingApproval');
      case 'COMPLETED': return t('pages.forklift.status.completed');
      case 'CANCELLED': return t('pages.forklift.status.cancelled');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-yellow';
      case 'ASSIGNED': return 'badge-orange';
      case 'IN_PROGRESS': return 'badge-blue';
      case 'PENDING_APPROVAL': return 'badge-orange';
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
        <style>{`
          /* Mobile scroll fix for Forklift page */
          @media (max-width: 768px) {
            body {
              overflow-y: auto !important;
              overflow-x: hidden !important;
              -webkit-overflow-scrolling: touch;
            }
            
            .container {
              overflow: visible !important;
              padding-bottom: 2rem;
            }
          }
        `}</style>
        <Header />
        <main className="container">
          <div className="card card-padding-lg">
            <div className="text-center">
              <h2 className="text-red-600">{t('common.error')}</h2>
              <p>{error}</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{`
        /* Mobile scroll fix for Forklift page */
        @media (max-width: 768px) {
          body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch;
          }
          
          .container.depot-requests {
            overflow: visible !important;
            padding-bottom: 2rem;
          }
        }
      `}</style>
      <Header />
      <main className="container depot-requests">
        {/* Page Header */}
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">{t('pages.forklift.title')}</h1>
            </div>

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
                {t('common.close')}
              </button>
            </div>
          </div>
        )}

        <div className="gate-table-header">
          <div className="header-actions">
            <span className="badge badge-primary">
              {t('pages.forklift.totalJobs').replace('{count}', tasks.length.toString())}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="loading-spinner spinner-lg spinner-primary"></div>
            <p className="mt-4">{t('pages.forklift.loadingJobs')}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{t('pages.forklift.noJobs')}</p>
          </div>
        ) : (
          <div className="gate-table-container">
            <table className="gate-table">
                  <thead>
                    <tr>
                      <th data-column="requestNo">Số yêu cầu</th>
                      <th data-column="container">Số container</th>
                      <th data-column="ctype">Loại container</th>
                      <th data-column="vehicle">Số xe</th>
                      <th data-column="driver">Tài xế</th>
                      <th data-column="driverPhone">SĐT tài xế</th>
                      <th data-column="location">Vị trí</th>
                      <th data-column="status">Trạng Thái</th>
                      <th data-column="forklift">Tài xế xe nâng</th>
                      <th data-column="start">Thời gian bắt đầu</th>
                      <th data-column="end">Thời gian kết thúc</th>
                      <th data-column="image">Hình ảnh</th>
                      <th data-column="actions">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, index) => (
                      <tr key={task.id}>
                        <td data-column="requestNo">{task.container_info?.request_no || '-'}</td>
                        <td data-column="container"><strong>{task.container_no}</strong></td>
                        <td data-column="ctype">{task.container_info?.container_type?.code || '-'}</td>
                        <td data-column="vehicle">{task.container_info?.license_plate || '-'}</td>
                        <td data-column="driver">{task.container_info?.driver_name || '-'}</td>
                        <td data-column="driverPhone">{task.container_info?.driver_phone || '-'}</td>
                        <td data-column="location">
                          {task.display_location ? (
                            <span className="location-badge">
                              {`${task.display_location.block.yard.name} / ${task.display_location.block.code} / ${task.display_location.code}`}
                            </span>
                          ) : task.fixed_location ? (
                            <span className="location-badge">
                              {`${task.fixed_location.slot.block.yard.name} / ${task.fixed_location.slot.block.code} / ${task.fixed_location.slot.code}`}
                            </span>
                          ) : task.actual_location ? (
                            <span className="location-badge">
                              {`${task.actual_location.slot.block.yard.name} / ${task.actual_location.slot.block.code} / ${task.actual_location.slot.code}`}
                            </span>
                          ) : (
                            <span className="location-placeholder">{task.from_slot?.code || task.to_slot?.code || t('pages.forklift.location.outside')}</span>
                          )}
                        </td>
                        <td data-column="status">
                          <span className={`status-badge status-${task.status.toLowerCase().replace(/_/g, '-')}`}>
                            {getStatusText(task.status)}
                          </span>
                        </td>
                        <td data-column="forklift">
                          {task.driver ? (
                            <div className="driver-assigned">
                              <span className="driver-name">{task.driver.full_name}</span>
                              <span className="assigned-badge">{t('pages.forklift.driver.assigned')}</span>
                            </div>
                          ) : (
                            <div className="driver-not-assigned">{t('pages.forklift.driver.notAssigned')}</div>
                          )}
                        </td>
                        <td data-column="start">{formatDate(task.createdAt)}</td>
                        <td data-column="end">{task.status === 'COMPLETED' ? formatDate(task.updatedAt) : '-'}</td>
                        <td data-column="image">
                          {task as any && (task as any).report_image ? (
                            <img
                              src={`${API_BASE}${(task as any).report_image}`}
                              alt="report"
                              style={{ maxWidth: '72px', maxHeight: '48px', objectFit: 'cover', borderRadius: '4px' }}
                              onError={(e) => {
                                const el = e.currentTarget as HTMLImageElement;
                                el.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td data-column="actions">
                          {task.status === 'IN_PROGRESS' ? (
                            <div className="action-in-progress">
                              {t('pages.forklift.actions.inProgress')}
                            </div>
                          ) : (
                            <div className="action-buttons">
                              
                              {task.status === 'ASSIGNED' && (
                                <div className="action-info">
                                  {t('pages.forklift.actions.driverAssigned')}
                                </div>
                              )}
                              
                              {task.status === 'ASSIGNED' && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleBeginWork(task.id)}
                                >
                                  {t('pages.forklift.actions.startWork')}
                                </button>
                              )}
                              
                              {task.status === 'PENDING_APPROVAL' && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleApproveJob(task.id)}
                                  title={t('pages.forklift.actions.approveTitle')}
                                >
                                  {t('pages.forklift.actions.approve')}
                                </button>
                              )}
                              
                              {task.status === 'PENDING' && !task.assigned_driver_id && (
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleAssignDriver(task)}
                                >
                                  {t('pages.forklift.actions.assignDriver')}
                                </button>
                              )}
                              
                              {task.status === 'PENDING' && task.assigned_driver_id && (
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() => handleAssignDriver(task)}
                                >
                                  {t('pages.forklift.actions.reassignDriver')}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
            </table>
          </div>
        )}
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
            source_location: selectedTask.from_slot?.code || t('pages.forklift.location.sourceLocation'),
            destination_location: selectedTask.actual_location ? 
              `${selectedTask.actual_location.slot.code} (Tier ${selectedTask.actual_location.tier})` : 
              (selectedTask.to_slot?.code || t('pages.forklift.location.destinationLocation')),
            status: selectedTask.status
          }}
          currentDriverId={selectedTask.assigned_driver_id}
        />
      )}
      {/* Update Cost Modal */}
      {selectedTask && costModalOpen && (
        <div style={modalStyles.modal}>
          <div style={modalStyles.modalContent}>
            <div style={modalStyles.modalHeader}>
              <h3 style={modalStyles.modalTitle}>{t('pages.forklift.modal.editCost')}</h3>
              <button
                style={modalStyles.modalClose}
                onClick={() => {
                  setCostModalOpen(false);
                  setSelectedTask(null);
                }}
              >
                ×
              </button>
            </div>
            <div style={modalStyles.modalBody}>
              <div style={modalStyles.formGroup}>
                <label htmlFor="cost" style={modalStyles.formLabel}>{t('pages.forklift.modal.costLabel')}</label>
                <input
                  type="number"
                  id="cost"
                  style={modalStyles.formInput}
                  placeholder={t('pages.forklift.modal.costPlaceholder')}
                  defaultValue={selectedTask.cost || 0}
                  min="0"
                  step="1"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    const formattedValue = value.toLocaleString('vi-VN');
                    
                    // Hiển thị số đã format
                    const displayElement = document.getElementById('cost-formatted-display');
                    if (displayElement) {
                      if (value > 0) {
                        displayElement.textContent = `Số đã nhập: ${formattedValue} VNĐ`;
                        displayElement.style.display = 'block';
                      } else {
                        displayElement.style.display = 'none';
                      }
                    }
                  }}
                />
                {/* Gợi ý chi phí */}
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef',
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>💡 Gợi ý chi phí:</div>
                  <div style={{ marginBottom: '2px' }}>• <strong>Dịch vụ cơ bản:</strong> 50,000 - 200,000 VNĐ</div>
                  <div style={{ marginBottom: '2px' }}>• <strong>Dịch vụ phức tạp:</strong> 200,000 - 500,000 VNĐ</div>
                  <div style={{ marginBottom: '2px' }}>• <strong>Dịch vụ đặc biệt:</strong> 500,000 - 1,000,000 VNĐ</div>
                  <div style={{ color: '#dc3545', fontWeight: '500' }}>• <strong>Giới hạn tối đa:</strong> 1,000,000,000 VNĐ (1 tỷ)</div>
                </div>
                {/* Hiển thị số đã format */}
                <div id="cost-formatted-display" style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  color: '#28a745',
                  fontWeight: '500',
                  fontFamily: 'monospace'
                }}></div>
              </div>
            </div>
            <div style={modalStyles.modalFooter}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setCostModalOpen(false);
                  setSelectedTask(null);
                }}
              >
{t('pages.forklift.modal.cancel')}
              </button>
                             <button
                 className="btn btn-primary"
                 onClick={() => {
                   const costInput = document.getElementById('cost') as HTMLInputElement;
                   const costValue = costInput.value.trim();
                   
                   // Kiểm tra có nhập gì không
                   if (!costValue) {
                     showError(t('pages.forklift.messages.pleaseEnterCost'));
                     return;
                   }
                   
                   // Kiểm tra có phải là số không
                   if (isNaN(Number(costValue))) {
                     showError(t('pages.forklift.messages.costMustBeNumber'));
                     return;
                   }
                   
                   const cost = parseInt(costValue);
                   
                   // Kiểm tra có phải là số nguyên không
                   if (!Number.isInteger(cost)) {
                     showError(t('pages.forklift.messages.costMustBeInteger'));
                     return;
                   }
                   
                   // Kiểm tra có phải là số không âm không
                   if (cost < 0) {
                     showError(t('pages.forklift.messages.costCannotBeNegative'));
                     return;
                   }
                   
                   // Kiểm tra giới hạn chi phí (1 tỷ VNĐ)
                   if (cost > 1000000000) {
                     showError(t('pages.forklift.messages.costTooHigh'));
                     return;
                   }
                   
                   handleUpdateCost(selectedTask.id, cost);
                 }}
               >
{t('pages.forklift.modal.update')}
               </button>
            </div>
          </div>
        </div>
      )}


      <ToastContainer />
    </>
  );
}
