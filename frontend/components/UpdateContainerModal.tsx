import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { setupService } from '@services/setupService';

interface UpdateContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: any;
  onUpdate: (containerData: any) => void;
}

export const UpdateContainerModal: React.FC<UpdateContainerModalProps> = ({
  isOpen,
  onClose,
  container,
  onUpdate
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    shipping_line_id: '',
    container_type_id: '',
    customer_id: '',
    vehicle_company_id: '',
    seal_number: '',
    dem_det: ''
  });

  const [shippingLines, setShippingLines] = useState<any[]>([]);
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && container) {
      setFormData({
        shipping_line_id: container.shipping_line_id || '',
        container_type_id: container.container_type_id || '',
        customer_id: container.customer_id || '',
        vehicle_company_id: container.vehicle_company_id || '',
        seal_number: container.seal_number || '',
        dem_det: container.dem_det || ''
      });
    }
  }, [isOpen, container]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [slRes, ctRes, custRes, tcRes] = await Promise.all([
        setupService.getShippingLines({ page: 1, limit: 100 }),
        setupService.getContainerTypes({ page: 1, limit: 100 }),
        setupService.getCustomers(),
        setupService.getTransportCompanies({ page: 1, limit: 100 })
      ]);

      if (slRes.success && slRes.data) setShippingLines(slRes.data.data);
      if (ctRes.success && ctRes.data) setContainerTypes(ctRes.data.data);
      if (custRes.success && custRes.data) setCustomers(custRes.data.data || []);
      if (tcRes.success && tcRes.data) setTransportCompanies(tcRes.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate({
        ...container,
        ...formData
      });
      onClose();
    } catch (error) {
      console.error('Error updating container:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cập nhật thông tin container</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Container Number</label>
            <input 
              type="text" 
              value={container?.container_no || ''} 
              disabled 
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Hãng tàu</label>
            <select
              value={formData.shipping_line_id}
              onChange={(e) => setFormData({...formData, shipping_line_id: e.target.value})}
              className="form-input"
            >
              <option value="">Chọn hãng tàu</option>
              {shippingLines.map(sl => (
                <option key={sl.id} value={sl.id}>{sl.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Loại container</label>
            <select
              value={formData.container_type_id}
              onChange={(e) => setFormData({...formData, container_type_id: e.target.value})}
              className="form-input"
            >
              <option value="">Chọn loại container</option>
              {containerTypes.map(ct => (
                <option key={ct.id} value={ct.id}>{ct.code} - {ct.description}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Khách hàng</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              className="form-input"
            >
              <option value="">Chọn khách hàng</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nhà xe</label>
            <select
              value={formData.vehicle_company_id}
              onChange={(e) => setFormData({...formData, vehicle_company_id: e.target.value})}
              className="form-input"
            >
              <option value="">Chọn nhà xe</option>
              {transportCompanies.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Số seal</label>
            <input
              type="text"
              value={formData.seal_number}
              onChange={(e) => setFormData({...formData, seal_number: e.target.value})}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>DEM/DET</label>
            <input
              type="text"
              value={formData.dem_det}
              onChange={(e) => setFormData({...formData, dem_det: e.target.value})}
              className="form-input"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateContainerModal;
