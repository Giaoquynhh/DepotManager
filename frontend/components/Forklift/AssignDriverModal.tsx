import { useState, useEffect } from 'react';
import { api } from '@services/api';

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
  onAssign: (driverId: string) => void;
  jobData: {
    id: string;
    container_no: string;
    source_location: string;
    destination_location: string;
    status: string;
  };
}

export default function AssignDriverModal({ isOpen, onClose, onAssign, jobData }: AssignDriverModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
    }
  }, [isOpen]);

  const fetchDrivers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/users?role=Driver&status=ACTIVE');
      setDrivers(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      setError('Không thể tải danh sách tài xế');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDriver) {
      setError('Vui lòng chọn tài xế');
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/forklift/jobs/${jobData.id}/assign-driver`, {
        driver_id: selectedDriver
      });
      
      onAssign(selectedDriver);
      onClose();
    } catch (err: any) {
      console.error('Error assigning driver:', err);
      setError(err.response?.data?.message || 'Không thể gán tài xế');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2 className="modal-title">Gán Tài Xế</h2>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Job Information */}
        <div className="info-section">
          <h3 className="info-title">Thông Tin Công Việc</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Container:</strong> {jobData.container_no}
            </div>
            <div className="info-item">
              <strong>Trạng thái:</strong> {jobData.status}
            </div>
            <div className="info-item">
              <strong>Vị trí nguồn:</strong> {jobData.source_location}
            </div>
            <div className="info-item">
              <strong>Vị trí đích:</strong> {jobData.destination_location}
            </div>
          </div>
        </div>

        {/* Driver Selection */}
        <div className="form-group">
          <label className="form-label">
            Chọn Tài Xế:
          </label>
          {loading ? (
            <div className="loading-text">Đang tải danh sách tài xế...</div>
          ) : (
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="form-select"
            >
              <option value="">-- Chọn tài xế --</option>
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
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAssign}
            disabled={loading || !selectedDriver}
          >
            {loading ? 'Đang gán...' : 'Gán Tài Xế'}
          </button>
        </div>
      </div>
    </div>
  );
}
