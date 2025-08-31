 import React, { useState, useEffect } from 'react';
import { financeApi } from '@services/finance';
import useSWR from 'swr';
import CreateInvoiceModal from './CreateInvoiceModal';

interface ContainersNeedInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContainersNeedInvoiceModal({ isOpen, onClose }: ContainersNeedInvoiceModalProps) {
  const { data: containers, error, mutate } = useSWR(
    isOpen ? 'containers-need-invoice' : null,
    () => financeApi.getContainersNeedInvoice()
  );
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'IMPORT': return 'Nhập';
      case 'EXPORT': return 'Xuất';
      case 'CONVERT': return 'Chuyển đổi';
      default: return type || '-';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'IN_YARD': return 'Trong bãi';
      case 'IN_CAR': return 'Trên xe';
      case 'GATE_OUT': return 'Đã ra cổng';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'IN_YARD': return 'status-in-yard';
      case 'IN_CAR': return 'status-in-car';
      case 'GATE_OUT': return 'status-gate-out';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Danh sách container cần tạo hóa đơn</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-message">
              Lỗi khi tải dữ liệu: {error.message}
            </div>
          )}
          
          {containers && containers.length === 0 && (
            <div className="no-data">
              Không có container nào cần tạo hóa đơn
            </div>
          )}
          
          {containers && containers.length > 0 && (
            <div className="table-container">
              <table className="containers-table">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Container No</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Chi phí dự kiến</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((container: any) => (
                    <tr key={container.id}>
                      <td>
                        <span className={`type-badge type-${container.type?.toLowerCase()}`}>
                          {getTypeLabel(container.type)}
                        </span>
                      </td>
                      <td>{container.container_no || '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(container.status)}`}>
                          {getStatusLabel(container.status)}
                        </span>
                      </td>
                      <td>
                        {container.createdAt ? new Date(container.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td>
                        <span className="estimated-cost">
                          {container.estimated_cost ? `${Number(container.estimated_cost).toLocaleString('vi-VN')} VND` : 'Chưa có'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-create-invoice"
                          onClick={() => {
                            setSelectedContainer(container);
                            setIsCreateInvoiceModalOpen(true);
                          }}
                        >
                          Tạo hóa đơn
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
      
      <CreateInvoiceModal
        isOpen={isCreateInvoiceModalOpen}
        onClose={() => {
          setIsCreateInvoiceModalOpen(false);
          setSelectedContainer(null);
          // Refresh danh sách container sau khi tạo hóa đơn
          mutate();
        }}
        container={selectedContainer}
      />
      
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
          max-width: 1000px;
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
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .containers-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }
        
        .containers-table th {
          background-color: #f5f5f5;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        
        .containers-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #eee;
          vertical-align: middle;
        }
        
        .containers-table tr:hover {
          background-color: #f9f9f9;
        }
        
        .type-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .type-import {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        
        .type-export {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }
        
        .type-convert {
          background-color: #e8f5e8;
          color: #2e7d32;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-in-yard {
          background-color: #fff3e0;
          color: #f57c00;
        }
        
        .status-in-car {
          background-color: #e8f5e8;
          color: #2e7d32;
        }
        
        .status-gate-out {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        
        .btn-create-invoice {
          background-color: #1976d2;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .btn-create-invoice:hover {
          background-color: #1565c0;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
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
          margin-bottom: 16px;
        }
        
        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .estimated-cost {
          font-weight: 500;
          color: #28a745;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
