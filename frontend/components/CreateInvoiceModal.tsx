import React, { useState, useEffect } from 'react';
import { financeApi } from '@services/finance';
import { api } from '@services/api';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: any;
}

export default function CreateInvoiceModal({ isOpen, onClose, container }: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [containerCosts, setContainerCosts] = useState<any>(null);
  const [eirFile, setEirFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen && container) {
      loadContainerCosts();
    }
  }, [isOpen, container]);

  const loadContainerCosts = async () => {
    if (!container?.container_no) return;
    
    setLoading(true);
    try {
      // Lấy chi phí sửa chữa từ RepairTicket
      const repairResponse = await api.get(`/maintenance/repairs?container_no=${encodeURIComponent(container.container_no)}`);
      let repairs = [];
      if (repairResponse.data?.data) {
        repairs = repairResponse.data.data;
      } else if (Array.isArray(repairResponse.data)) {
        repairs = repairResponse.data;
      }

      // Lấy chi phí LOLO từ ForkliftTask
      const forkliftResponse = await api.get(`/forklift/jobs?container_no=${encodeURIComponent(container.container_no)}`);
      let forkliftTasks = [];
      if (forkliftResponse.data?.data) {
        forkliftTasks = forkliftResponse.data.data;
      } else if (Array.isArray(forkliftResponse.data)) {
        forkliftTasks = forkliftResponse.data;
      }

      // Tính tổng chi phí - chỉ sử dụng estimated_cost để phù hợp với bảng Maintenance
      const totalRepairCost = repairs.reduce((sum: number, ticket: any) => {
        return sum + (ticket.estimated_cost || 0);
      }, 0);

      const totalLoloCost = forkliftTasks.reduce((sum: number, task: any) => {
        return sum + (task.cost || 0);
      }, 0);

      setContainerCosts({
        container_no: container.container_no,
        repair_tickets: repairs,
        forklift_tasks: forkliftTasks,
        total_repair_cost: totalRepairCost,
        total_lolo_cost: totalLoloCost,
        total_cost: totalRepairCost + totalLoloCost
      });
    } catch (error) {
      console.error('Lỗi khi tải thông tin chi phí:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Kiểm tra loại file
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setEirFile(file);
        console.log('📁 File EIR đã được chọn:', file.name, 'Size:', file.size, 'bytes');
      } else {
        alert('Chỉ chấp nhận file PDF hoặc hình ảnh');
        event.target.value = '';
      }
    }
  };

  const handleCreateInvoice = async () => {
    console.log('🚀 handleCreateInvoice được gọi');
    console.log('📊 containerCosts:', containerCosts);
    console.log('📦 container:', container);
    console.log('📁 EIR file:', eirFile);
    
    if (!containerCosts || !container) {
      console.log('❌ Thiếu dữ liệu để tạo hóa đơn');
      return;
    }

    try {
      // Nếu có file EIR, upload trước khi tạo hóa đơn
      let eirFilePath = null;
      if (eirFile) {
        console.log('📤 Đang upload file EIR...');
        setLoading(true);
        
        try {
          console.log('🔍 Debug upload EIR:');
          console.log('  - container:', container);
          console.log('  - container.container_no:', container.container_no);
          console.log('  - eirFile:', eirFile);
          
          const formData = new FormData();
          formData.append('file', eirFile);
          formData.append('container_no', container.container_no);
          formData.append('type', 'EIR');

          console.log('📤 Uploading file:', eirFile.name, 'to backend...');
          const uploadResponse = await api.post('/finance/upload/eir', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (uploadResponse.data.success) {
            eirFilePath = uploadResponse.data.data.upload_path;
            console.log('✅ Upload EIR thành công:', eirFilePath);
          } else {
            console.error('❌ Upload EIR thất bại:', uploadResponse.data);
            alert('Upload file EIR thất bại! Vui lòng thử lại.');
            setLoading(false);
            return;
          }
        } catch (uploadError: any) {
          console.error('❌ Lỗi khi upload EIR:', uploadError);
          alert(`Lỗi khi upload file EIR: ${uploadError?.message || 'Không xác định'}`);
          setLoading(false);
          return;
        }
      }

      // Tạo hóa đơn với thông tin chi phí
      const invoiceData = {
        customer_id: container.customer_id || 'default_customer',
        currency: 'VND',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 ngày
        notes: `Hóa đơn cho container ${container.container_no}${eirFilePath ? ` - Đã đính kèm EIR: ${eirFile?.name}` : ''}`,
        source_module: 'REQUESTS',
        source_id: container.id, // Liên kết với ServiceRequest
        // TODO: Thêm eir_file vào schema để lưu tên file EIR
        items: [
          // Chi phí sửa chữa
          ...(containerCosts.repair_tickets.length > 0 ? [{
            service_code: 'REPAIR',
            description: 'Chi phí sửa chữa container',
            qty: 1,
            unit_price: containerCosts.total_repair_cost,
            tax_rate: 10 // 10% VAT
          }] : []),
          // Chi phí LOLO
          ...(containerCosts.total_lolo_cost > 0 ? [{
            service_code: 'LOLO',
            description: 'Chi phí xe nâng (LOLO)',
            qty: 1,
            unit_price: containerCosts.total_lolo_cost,
            tax_rate: 10 // 10% VAT
          }] : [])
        ]
      };

      console.log('📋 Invoice data:', invoiceData);
      
      // Gọi API tạo hóa đơn
      console.log('🌐 Gọi API tạo hóa đơn...');
      console.log('📤 Request data:', invoiceData);
      
      const invoiceResponse = await api.post('/finance/invoices', invoiceData);
      console.log('📥 API response status:', invoiceResponse.status);
      console.log('📥 API response data:', invoiceResponse.data);

      
      // API trả về trực tiếp invoice object, không có success field
      if (invoiceResponse.data && invoiceResponse.data.id) {
        console.log('🎉 Tạo hóa đơn thành công!');
        console.log('📄 Invoice ID:', invoiceResponse.data.id);
        
        // Cập nhật trạng thái has_invoice = true
        try {
          console.log('🔄 Cập nhật trạng thái has_invoice...');
          const updateResponse = await api.patch(`/finance/requests/${container.id}/invoice-status`, {
            has_invoice: true
          });
          console.log('✅ Đã cập nhật has_invoice = true:', updateResponse.data);
          
          // Hiển thị thông báo thành công
          const successMessage = eirFilePath 
            ? `Tạo hóa đơn thành công! File EIR "${eirFile?.name}" đã được upload thành công.`
            : 'Tạo hóa đơn thành công!';
          alert(successMessage);
          
          onClose();
          
          // Refresh danh sách container cần tạo hóa đơn
          // Container này sẽ bị xóa khỏi danh sách vì has_invoice = true
          if (window.location.pathname === '/finance/invoices') {
            window.location.reload();
          }
        } catch (updateError) {
          console.error('Lỗi cập nhật has_invoice:', updateError);
          alert('Tạo hóa đơn thành công nhưng không thể cập nhật trạng thái!');
          onClose();
        }
      } else {
        console.error('❌ API không trả về invoice ID:', invoiceResponse.data);
        alert('Tạo hóa đơn thất bại: Dữ liệu không hợp lệ');
      }
    } catch (error: any) {
      console.error('Lỗi khi tạo hóa đơn:', error);
      
      if (error?.response?.status === 400) {
        alert('Dữ liệu hóa đơn không hợp lệ!');
      } else if (error?.response?.status === 401) {
        alert('Không có quyền tạo hóa đơn!');
      } else if (error?.response?.status === 500) {
        alert('Lỗi server! Vui lòng thử lại sau.');
      } else {
        alert(`Lỗi khi tạo hóa đơn: ${error?.message || 'Không xác định'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tạo hóa đơn cho container {container?.container_no}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading">Đang xử lý...</div>
          ) : containerCosts ? (
            <div className="costs-section">
              <h3>Thông tin chi phí</h3>
              
              {/* Chi phí sửa chữa */}
              <div className="cost-item">
                <h4>Chi phí sửa chữa</h4>
                {containerCosts.repair_tickets.length > 0 ? (
                  <div className="cost-details">
                    {containerCosts.repair_tickets.map((ticket: any, index: number) => (
                      <div key={ticket.id} className="cost-detail-row">
                        <span className="ticket-code">{ticket.code}</span>
                        <span className="cost-amount">
                          {ticket.estimated_cost || 0} VND
                        </span>
                      </div>
                    ))}
                    <div className="cost-total">
                      <strong>Tổng chi phí sửa chữa: {containerCosts.total_repair_cost.toLocaleString('vi-VN')} VND</strong>
                    </div>
                  </div>
                ) : (
                  <p className="no-costs">Không có chi phí sửa chữa</p>
                )}
              </div>

              {/* Chi phí LOLO */}
              <div className="cost-item">
                <h4>Chi phí LOLO (Xe nâng)</h4>
                {containerCosts.forklift_tasks.length > 0 ? (
                  <div className="cost-details">
                    {containerCosts.forklift_tasks.map((task: any, index: number) => (
                      <div key={task.id} className="cost-detail-row">
                        <span className="task-id">Task #{task.id.slice(-8)}</span>
                        <span className="cost-amount">{task.cost || 0} VND</span>
                      </div>
                    ))}
                    <div className="cost-total">
                      <strong>Tổng chi phí LOLO: {containerCosts.total_lolo_cost.toLocaleString('vi-VN')} VND</strong>
                    </div>
                  </div>
                ) : (
                  <p className="no-costs">Không có chi phí LOLO</p>
                )}
              </div>

              {/* Tổng chi phí */}
              <div className="total-costs">
                <h4>Tổng chi phí</h4>
                <div className="total-amount">
                  {containerCosts.total_cost.toLocaleString('vi-VN')} VND
                </div>
              </div>

              {/* Upload EIR */}
              <div className="eir-section">
                <h4>Upload EIR (Equipment Interchange Receipt)</h4>
                <div className="file-upload">
                  <input
                    id="eir-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="file-input"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('eir-file-input')?.click()}
                    className="btn-upload"
                  >
                    Chọn file EIR
                  </button>
                </div>
                {eirFile && (
                  <div className="file-info">
                    <p><strong>File đã chọn:</strong> {eirFile.name}</p>
                    <p><strong>Kích thước:</strong> {(eirFile.size / 1024).toFixed(2)} KB</p>
                    <p><strong>Loại file:</strong> {eirFile.type}</p>
                    <p className="note">💡 <em>File sẽ được tự động upload khi click "Hoàn tất"</em></p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="error-message">
              Không thể tải thông tin chi phí
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            type="button"
            className="btn-secondary" 
            onClick={onClose}
          >
            Hủy
          </button>
          <button 
            type="button"
            className="btn-primary" 
            onClick={handleCreateInvoice}
            disabled={!containerCosts || loading}
          >
            {loading ? 'Đang xử lý...' : 'Hoàn tất'}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-button:hover {
          color: #333;
        }
        
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        
        .modal-footer {
          padding: 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          position: relative;
          z-index: 5;
        }
        
        .loading {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .costs-section h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
          border-bottom: 2px solid #1976d2;
          padding-bottom: 8px;
        }
        
        .cost-item {
          margin-bottom: 24px;
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #1976d2;
        }
        
        .cost-item h4 {
          margin: 0 0 12px 0;
          color: #1976d2;
          font-size: 16px;
        }
        
        .cost-details {
          margin-top: 12px;
        }
        
        .cost-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        
        .cost-detail-row:last-child {
          border-bottom: none;
        }
        
        .ticket-code, .task-id {
          font-weight: 500;
          color: #495057;
        }
        
        .cost-amount {
          font-weight: 600;
          color: #dc3545;
        }
        
        .cost-total {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 2px solid #dee2e6;
          text-align: right;
        }
        
        .no-costs {
          color: #6c757d;
          font-style: italic;
          margin: 0;
        }
        
        .total-costs {
          margin-top: 24px;
          padding: 20px;
          background-color: #e8f5e8;
          border-radius: 6px;
          border: 2px solid #28a745;
        }
        
        .total-costs h4 {
          margin: 0 0 12px 0;
          color: #155724;
          font-size: 18px;
        }
        
        .total-amount {
          font-size: 24px;
          font-weight: 700;
          color: #155724;
          text-align: center;
        }
        
        .eir-section {
          margin-top: 24px;
          padding: 16px;
          background-color: #fff3cd;
          border-radius: 6px;
          border: 1px solid #ffeaa7;
        }
        
        .eir-section h4 {
          margin: 0 0 12px 0;
          color: #856404;
          font-size: 16px;
        }
        
        .file-upload {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .file-input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .btn-upload {
          background-color: #17a2b8;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn-upload:hover:not(:disabled) {
          background-color: #138496;
        }
        
        .btn-upload:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .file-info {
          margin: 0;
          color: #856404;
          font-size: 14px;
        }
        
        .file-info p {
          margin: 4px 0;
        }
        
        .note {
          background-color: #e7f3ff;
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid #2196f3;
          margin-top: 8px !important;
        }
        
        .btn-primary {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          position: relative;
          z-index: 10;
          user-select: none;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #218838;
        }
        
        .btn-primary:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .btn-primary:active {
          transform: translateY(1px);
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-secondary:hover {
          background-color: #5a6268;
        }
        
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
