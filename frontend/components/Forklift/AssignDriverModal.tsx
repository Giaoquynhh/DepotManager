import { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useTranslation } from '@hooks/useTranslation';

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
}

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (driverId: string, driverName: string) => void;
  jobData: {
    id: string;
    container_no: string;
    source_location: string;
    destination_location: string;
    status: string;
  };
  currentDriverId?: string;
}

export default function AssignDriverModal({ isOpen, onClose, onAssign, jobData, currentDriverId }: AssignDriverModalProps) {
  const { t } = useTranslation();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      // Set tài xế hiện tại làm giá trị mặc định
      if (currentDriverId) {
        setSelectedDriver(currentDriverId);
      } else {
        setSelectedDriver('');
      }
    }
  }, [isOpen, currentDriverId]);

  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/users?role=Driver&status=ACTIVE');
      setDrivers(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      setError(t('pages.forklift.modal.errorLoadingDrivers'));
    } finally {
      setLoading(false);
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

  const handleAssign = async () => {
    if (!selectedDriver) {
      setError(t('pages.forklift.modal.pleaseSelectDriver'));
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/forklift/jobs/${jobData.id}/assign-driver`, {
        driver_id: selectedDriver
      });
      
      // Tìm tên tài xế được chọn
      const selectedDriverInfo = drivers.find(driver => driver.id === selectedDriver);
      const driverName = selectedDriverInfo?.full_name || 'Tài xế';
      
      onAssign(selectedDriver, driverName);
      onClose();
    } catch (err: any) {
      console.error('Error assigning driver:', err);
      const errorMessage = err.response?.data?.message || t('pages.forklift.modal.cannotAssignDriver');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2 className="modal-title">{t('pages.forklift.modal.assignDriver')}</h2>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Job Information */}
        <div className="info-section">
          <h3 className="info-title">{t('pages.forklift.modal.jobInfo')}</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>{t('pages.forklift.modal.container')}:</strong> {jobData.container_no}
            </div>
            <div className="info-item">
              <strong>{t('pages.forklift.modal.status')}:</strong> {getStatusText(jobData.status)}
            </div>
            <div className="info-item">
              <strong>{t('pages.forklift.location.sourceLocation')}:</strong> {jobData.source_location}
            </div>
            <div className="info-item">
              <strong>{t('pages.forklift.location.destinationLocation')}:</strong> {jobData.destination_location}
            </div>
          </div>
        </div>

        {/* Driver Selection */}
        <div className="form-group">
          <label className="form-label">
            {t('pages.forklift.modal.selectDriver')}:
          </label>
          {loading ? (
            <div className="loading-text">{t('pages.forklift.modal.loadingDrivers')}</div>
          ) : (
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="form-select"
            >
              <option value="">{t('pages.forklift.modal.selectDriverPlaceholder')}</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name} - {driver.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAssign}
            disabled={loading || !selectedDriver}
          >
            {loading ? t('pages.forklift.modal.assigning') : t('pages.forklift.modal.assignDriver')}
          </button>
        </div>
      </div>
    </div>
  );
}
