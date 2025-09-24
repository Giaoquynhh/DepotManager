import React, { useState } from 'react';
import GateActionButtons from '../../Gate/components/GateActionButtons';
import DocumentsModal from '../../Gate/components/DocumentsModal';
import { useTranslation } from '../../../hooks/useTranslation';

interface GateRequest {
  id: string;
  request_no?: string;        // Số yêu cầu
  container_no: string;
  type: string;
  status: string;
  appointment_time?: string;  // Thời gian hẹn
  time_in?: string;           // Thời gian vào
  time_out?: string;          // Thời gian ra
  license_plate?: string;     // Số xe
  driver_name?: string;       // Tài xế
  driver_phone?: string;      // SDT tài xế
  service_type?: string;      // Loại dịch vụ
  container_type?: {          // Loại cont
    code: string;
  };
  attachments: any[];
  repair_ticket_id?: string | null;
  repair_ticket_code?: string | null;
  repair_ticket_status?: string | null;
}

interface LowerGateRequestTableProps {
  requests: GateRequest[];
  loading: boolean;
  onRefresh: () => void;
}

export default function LowerGateRequestTable({ requests, loading, onRefresh }: LowerGateRequestTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<GateRequest | null>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const { t, currentLanguage } = useTranslation();

  const statusLabel = (status: string) => {
    // Chỉ 2 hiển thị theo yêu cầu: Pending và các trạng thái khác
    if (status === 'PENDING' || status === 'NEW_REQUEST') {
      return 'Đang tới';
    }
    return 'Đã vào cổng';
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
      </div>
    );
  }

  return (
    <>
      <div className="gate-table-container">
        <table className="gate-table">
          <thead>
            <tr>
              <th data-column="request-no">Số yêu cầu</th>
              <th data-column="container">Số cont</th>
              <th data-column="container-type">Loại cont</th>
              <th data-column="service-type">Loại dịch vụ</th>
              <th data-column="vehicle">Số xe</th>
              <th data-column="driver">Tài xế</th>
              <th data-column="driver-phone">SDT tài xế</th>
              <th data-column="ticket-code">Mã phiếu kiểm tra</th>
              <th data-column="ticket-status">Trạng thái phiếu</th>
              <th data-column="status">Trạng thái cổng</th>
              <th data-column="appointment">Thời gian hẹn</th>
              <th data-column="time-in">Thời gian vào</th>
              <th data-column="time-out">Thời gian ra</th>
              <th data-column="images">Hình ảnh</th>
              <th data-column="actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td><strong>{request.request_no || t('common.na')}</strong></td>
                <td><strong>{request.container_no}</strong></td>
                <td>{request.container_type?.code || t('common.na')}</td>
                <td>
                  {request.service_type
                    || (request.type === 'IMPORT' ? 'Hạ' : (request.type === 'EXPORT' ? 'Nâng' : t('common.na')))}
                </td>
                <td>{request.license_plate || t('common.na')}</td>
                <td>{request.driver_name || t('common.na')}</td>
                <td>{request.driver_phone || t('common.na')}</td>
                <td>
                  {request.repair_ticket_code ? (
                    <strong>{request.repair_ticket_code}</strong>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>{t('common.na')}</span>
                  )}
                </td>
                <td>
                  {request.repair_ticket_status ? (
                    <span className={`status-badge status-${request.repair_ticket_status.toLowerCase().replace(/_/g, '-')}`}>
                      {request.repair_ticket_status === 'PENDING' ? 'Chờ xử lý' : request.repair_ticket_status}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>{t('common.na')}</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${request.status.toLowerCase().replace(/_/g, '-')}`}>
                    {statusLabel(request.status)}
                  </span>
                </td>
                <td>
                  {request.appointment_time ? new Date(request.appointment_time).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}
                </td>
                <td>
                  {request.time_in ? new Date(request.time_in).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}
                </td>
                <td>
                  {request.time_out ? new Date(request.time_out).toLocaleString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US') : t('common.na')}
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
                    initialLicensePlate={request.license_plate}
                    initialDriverName={request.driver_name}
                    initialDriverPhone={request.driver_phone}
                    onActionSuccess={onRefresh}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <DocumentsModal
          isOpen={documentsModalOpen}
          onClose={closeDocumentsModal}
          requestId={selectedRequest.id}
          containerNo={selectedRequest.container_no}
        />
      )}
    </>
  );
}


