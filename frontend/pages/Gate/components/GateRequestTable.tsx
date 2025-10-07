import React, { useState } from 'react';
import GateActionButtons from './GateActionButtons';
import DocumentsModal from './DocumentsModal';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';

interface GateRequest {
  id: string;
  request_no?: string;        // Số yêu cầu
  container_no: string;
  type: string;
  status: string;
  eta?: string;
  forwarded_at?: string;
  license_plate?: string;     // Biển số xe
  driver_name?: string;       // Tên tài xế
  driver_phone?: string;      // SĐT tài xế
  time_in?: string;           // Thời gian vào
  time_out?: string;          // Thời gian ra
  appointment_time?: string;  // Thời gian hẹn
  booking_bill?: string;      // Số Booking
  service_type?: string;      // Loại dịch vụ (từ container_type)
  container_type?: {          // Thông tin loại container
    code: string;
  };
  docs: any[];
  attachments: any[];
  isPaid?: boolean;          // Trạng thái thanh toán
  created_at?: string;        // Thời gian tạo record
  updated_at?: string;        // Thời gian cập nhật record
}

interface GateRequestTableProps {
  requests: GateRequest[];
  loading: boolean;
  onRefresh: () => void;
  showSuccess?: (title: string, message?: string, duration?: number) => void;
  showError?: (title: string, message?: string, duration?: number) => void;
}

export default function GateRequestTable({ requests, loading, onRefresh, showSuccess: injectedSuccess, showError: injectedError }: GateRequestTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<GateRequest | null>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const { t, currentLanguage } = useTranslation();
  const { showSuccess: hookSuccess, showError: hookError, ToastContainer } = useToast();
  const showSuccess = injectedSuccess || hookSuccess;
  const showError = injectedError || hookError;

  // Helpers: map raw type/status codes to localized labels
  const typeLabel = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return `📥 ${t('pages.gate.typeOptions.import')}`;
      case 'EXPORT':
        return `📤 ${t('pages.gate.typeOptions.export')}`;
      case 'EMPTY':
        return `🗳️ ${t('pages.gate.typeOptions.empty')}`;
      default:
        return type;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return t('pages.gate.statusOptions.scheduled');
      case 'FORWARDED':
        return t('pages.gate.statusOptions.forwarded');
      case 'DONE_LIFTING':
        return `🟢 ${t('pages.gate.statusOptions.gateIn')}`;
      case 'FORKLIFTING':
        // Hiển thị như "Đã cho phép vào"
        return `🟢 ${t('pages.gate.statusOptions.gateIn')}`;
      case 'NEW_REQUEST':
        return `🆕 ${t('pages.gate.statusOptions.newRequest')}`;
      case 'IN_YARD':
        return `🏭 ${t('pages.gate.statusOptions.inYard')}`;
      case 'IN_CAR':
        return `🚛 ${t('pages.gate.statusOptions.inCar')}`;
      case 'GATE_IN':
        return `🟢 ${t('pages.gate.statusOptions.gateIn')}`;
      case 'GATE_OUT':
        return `🟣 ${t('pages.gate.statusOptions.gateOut')}`;
      case 'GATE_REJECTED':
        return `⛔ ${t('pages.gate.statusOptions.gateRejected')}`;
      case 'COMPLETED':
        return t('pages.gate.statusOptions.completed');
      default:
        return status;
    }
  };

  const handleViewDocuments = (request: GateRequest) => {
    setSelectedRequest(request);
    setDocumentsModalOpen(true);
  };

  const closeDocumentsModal = () => {
    setDocumentsModalOpen(false);
    setSelectedRequest(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3>{t('pages.gate.noData')}</h3>
        <p>{t('pages.gate.noRequestsToDisplay')}</p>
        <div className="validation-info" style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <strong>📋 Lưu ý:</strong> Chỉ hiển thị các yêu cầu có số container. Các yêu cầu không có số container sẽ không được hiển thị trong bảng này.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="gate-table-container">
        <table className="gate-table">
          <thead>
            <tr>
              <th data-column="request-no">{t('pages.gate.tableHeaders.requestNo')}</th>
              <th data-column="container">{t('pages.gate.tableHeaders.container')}</th>
              <th data-column="container-type">{t('pages.gate.tableHeaders.containerType')}</th>
              <th data-column="booking">{t('pages.gate.tableHeaders.booking')}</th>
              <th data-column="service-type">{t('pages.gate.tableHeaders.serviceType')}</th>
              <th data-column="vehicle">{t('pages.gate.tableHeaders.vehicle')}</th>
              <th data-column="driver">{t('pages.gate.tableHeaders.driverName')}</th>
              <th data-column="driver-phone">{t('pages.gate.tableHeaders.driverPhone')}</th>
              <th data-column="status">{t('pages.gate.tableHeaders.status')}</th>
              <th data-column="appointment">{t('pages.gate.tableHeaders.appointment')}</th>
              <th data-column="time-in">{t('pages.gate.tableHeaders.timeIn')}</th>
              <th data-column="time-out">{t('pages.gate.tableHeaders.timeOut')}</th>
              <th data-column="images">{t('pages.gate.tableHeaders.images')}</th>
              <th data-column="actions">{t('pages.gate.tableHeaders.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.request_no || t('common.na')}</strong>
                </td>
                <td>
                  <strong>{request.container_no}</strong>
                </td>
                <td>
                  <span className="container-type">
                    {request.container_type?.code || t('common.na')}
                  </span>
                </td>
                <td>
                  <span className="booking-number">
                    {request.booking_bill || t('common.na')}
                  </span>
                </td>
                 <td>
                   <span className="service-type-badge">
                     🔧 {request.service_type || t('common.na')}
                   </span>
                 </td>
                <td>
                  <span className="license-plate">
                    {request.license_plate || t('common.na')}
                  </span>
                </td>
                <td>
                  <span className="driver-name">
                    {request.driver_name || t('common.na')}
                  </span>
                </td>
                <td>
                  <span className="driver-phone">
                    {request.driver_phone || t('common.na')}
                  </span>
                </td>
                <td>
                  {(() => {
                    const visualStatus = (request.status === 'FORKLIFTING' || request.status === 'DONE_LIFTING') ? 'GATE_IN' : request.status;
                    return (
                      <span className={`status-badge status-${visualStatus.toLowerCase().replace(/_/g, '-')}`}>
                        {statusLabel(request.status)}
                      </span>
                    );
                  })()}
                </td>
                <td>
                  <span className="appointment-time">
                    {request.appointment_time ? new Date(request.appointment_time).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}
                  </span>
                </td>
                <td>
                  <span className="time-in">
                    {request.time_in ? new Date(request.time_in).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}
                  </span>
                </td>
                <td>
                  <span className="time-out">
                    {request.time_out ? new Date(request.time_out).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}
                  </span>
                </td>
                <td>
                  <div className="images-cell">
                    {request.attachments && request.attachments.length > 0 ? (
                      <>
                        <div className="image-count-badge">
                          <div className="image-count-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21,15 16,10 5,21"></polyline>
                            </svg>
                          </div>
                          <div className="image-count-content">
                            <span className="image-count-number">{request.attachments.length}</span>
                            <span className="image-count-label">Hình ảnh</span>
                          </div>
                        </div>
                        <button
                          className="view-images-btn"
                          onClick={() => handleViewDocuments(request)}
                          title="Xem hình ảnh"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Xem
                        </button>
                      </>
                    ) : (
                      <div className="no-images">
                        <div className="no-images-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21,15 16,10 5,21"></polyline>
                          </svg>
                        </div>
                        <span className="no-images-text">Không có</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <GateActionButtons
                    requestId={request.id}
                    requestType={request.type}
                    currentStatus={request.status}
                    onActionSuccess={onRefresh}
                    isPaid={request.isPaid}
                    showSuccess={showSuccess}
                    showError={showError}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Documents Modal */}
      {selectedRequest && (
        <DocumentsModal
          isOpen={documentsModalOpen}
          onClose={closeDocumentsModal}
          requestId={selectedRequest.id}
          containerNo={selectedRequest.container_no}
        />
      )}
      <ToastContainer />
    </>
  );
}
