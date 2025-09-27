import React from 'react';
import { useRouter } from 'next/router';
import Header from '@components/Header';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';
import { useRouteRefresh } from '../../../hooks/useRouteRefresh';
import { CreateLowerRequestModal, type LowerRequestData } from '../../Requests/components/CreateLowerRequestModal';
import { requestService } from '../../../services/requests';

// Interface cho dữ liệu bảng
interface TableData {
  id: string;
  shippingLine: string; // Hãng tàu
  requestNumber: string; // Số yêu cầu
  containerNumber: string; // Số Cont
  containerType: string; // Loại Cont
  serviceType: string; // Loại dịch vụ
  status: string; // Trạng thái
  reuseStatus: boolean; // Trạng thái reuse
  customer: string; // Khách hàng
  truckCompany: string; // Nhà xe
  truckNumber: string; // Số xe
  driverName: string; // Tên tài xế
  driverPhone: string; // SDT tài xế
  appointmentTime: string; // Thời gian hẹn
  actualInTime: string; // Giờ vào thực tế
  actualOutTime: string; // Giờ ra thực tế
  totalAmount: number; // Tổng tiền
  paymentStatus: string; // Trạng thái dịch vụ
  documents: string; // Chứng từ
  documentsCount?: number; // Số lượng chứng từ
  demDet: string; // Dem/Det
  notes: string; // Ghi chú
}

export default function NewSubmenu() {
	const router = useRouter();
	const { t } = useTranslation();
	const { showSuccess, ToastContainer } = useToast();
	const [localSearch, setLocalSearch] = React.useState('');
	const [localType, setLocalType] = React.useState('all');
	const [localStatus, setLocalStatus] = React.useState('all');
	const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const routeRefreshKey = useRouteRefresh();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  // Documents modal states
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<{id: string, containerNo: string} | null>(null);
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError] = React.useState<string | null>(null);

  // Dữ liệu bảng từ database
  const [tableData, setTableData] = React.useState<TableData[]>([]);

  // Force refresh when route changes to ensure fresh data
  React.useEffect(() => {
    if (router.isReady) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [router.pathname, router.isReady]);

  // Additional refresh when route changes (using custom hook)
  React.useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [routeRefreshKey]);

  // Fetch data when component mounts
  React.useEffect(() => {
    fetchImportRequests();
  }, [refreshTrigger]);

  const handleCreateNew = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSubmit = async (data: LowerRequestData) => {
    // TODO: Implement submit logic
    console.log('Modal submitted with data:', data);
    showSuccess('Tạo yêu cầu hạ container thành công!');
    setIsModalOpen(false);
    
    // Refresh table to show new record
    await fetchImportRequests();
  };

  // Documents modal functions
  const openDocuments = async (row: TableData) => {
    try {
      setSelectedRequest({ id: row.id, containerNo: row.containerNumber });
      setIsDocsOpen(true);
      setDocsLoading(true);
      setDocsError(null);
      const res = await requestService.getFiles(row.id);
      if (res.data?.success) {
        setAttachments(res.data.data || res.data.attachments || []);
      } else {
        setAttachments([]);
        setDocsError(res.data?.message || 'Không thể tải danh sách chứng từ');
      }
    } catch (err: any) {
      setDocsError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải chứng từ');
      setAttachments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const closeDocuments = () => {
    setIsDocsOpen(false);
    setSelectedRequest(null);
    setAttachments([]);
    setDocsError(null);
  };

  const handleUpdateInfo = (id: string) => {
    // TODO: Implement update functionality
    console.log('Update info for:', id);
    showSuccess('Cập nhật thông tin thành công!');
  };

  const handleCancel = (id: string) => {
    // TODO: Implement cancel functionality
    console.log('Cancel for:', id);
    showSuccess('Đã hủy yêu cầu!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Map hiển thị trạng thái thân thiện
  const renderStatusText = (status: string) => {
    if (!status) return '';
    const normalized = String(status).toUpperCase();
    if (normalized === 'PENDING') return 'Thêm mới';
    if (normalized === 'CHECKED') return 'Chấp nhận';
    if (normalized === 'GATE_IN') return 'Đã vào cổng';
    if (normalized === 'FORKLIFTING') return 'Đang hạ container';
    // Trạng thái mới cho Import: hiển thị ngay sau FORKLIFTING
    if (normalized === 'IN_YARD') return 'Đã hạ thành công';
    if (normalized === 'GATE_OUT') return 'Xe đã rời khỏi bãi';
    return status;
  };

  // Function để fetch import requests từ API
  const fetchImportRequests = async () => {
    setLoading(true);
    try {
      const response = await requestService.getRequests('IMPORT');
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Transform data từ API thành format của table
        const transformedData: TableData[] = response.data.data.map((request: any) => {
          return {
            id: request.id,
            shippingLine: request.shipping_line?.name || '',
            requestNumber: request.request_no || '',
            containerNumber: request.container_no || '',
            containerType: request.container_type?.code || '',
            serviceType: 'Hạ cont', // Mặc định cho import request
            status: request.status || '',
            reuseStatus: request.reuse_status || false,
            customer: request.customer?.name || '',
            truckCompany: request.vehicle_company?.name || '',
            truckNumber: request.license_plate || '',
            driverName: request.driver_name || '',
            driverPhone: request.driver_phone || '',
            appointmentTime: request.appointment_time ? new Date(request.appointment_time).toLocaleString('vi-VN') : '',
            actualInTime: request.time_in ? new Date(request.time_in).toLocaleString('vi-VN') : '',
            actualOutTime: request.time_out ? new Date(request.time_out).toLocaleString('vi-VN') : '',
            totalAmount: request.total_amount || 0,
            paymentStatus: request.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán',
            documents: request.attachments?.map((att: any) => att.file_name).join(', ') || '',
            documentsCount: request.attachments?.length || 0,
            demDet: request.dem_det || '',
            notes: request.appointment_note || ''
          };
        });
        setTableData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching import requests:', error);
      showSuccess('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          body { overflow-y: auto !important; overflow-x: hidden !important; -webkit-overflow-scrolling: touch; }
          .container.depot-requests { overflow: visible !important; padding-bottom: 2rem; }
        }

        .gate-search-section .search-row {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
        }
        .gate-search-section .search-section { flex: 0 0 320px; max-width: 320px; }
        .gate-search-section .filter-group { display: flex; gap: 4px; }
        .gate-search-section .filter-group select { height: 40px; min-width: 140px; }
        .gate-search-section .action-group { margin-left: 0; }
        .gate-search-section .action-group .btn { height: 40px; }
        @media (max-width: 1024px) {
          .gate-search-section .search-row { flex-wrap: wrap; }
          .gate-search-section .action-group { margin-left: 0; width: 100%; display: flex; justify-content: flex-end; }
        }

        .gate-table-container .table-scroll-container {
          scrollbar-width: auto !important;
          -ms-overflow-style: scrollbar !important;
        }
        .gate-table-container .table-scroll-container::-webkit-scrollbar {
          display: block !important;
          width: 8px !important;
          height: 8px !important;
        }
        .gate-table-container .table-scroll-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .gate-table-container .table-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .gate-table-container .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .table-empty.modern-empty {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-style: italic;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          white-space: nowrap;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn-light {
          background: #f8f9fa !important;
          color: #1e3a8a !important;
          border: 1px solid #d1d5db !important;
          font-weight: 500 !important;
        }

        .btn-light:hover {
          background: #e5e7eb !important;
          border-color: #9ca3af !important;
          color: #1e40af !important;
        }

        .btn-outline {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-outline:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .reuse-status {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .reuse-status.on {
          background: #d1fae5;
          color: #065f46;
        }

        .reuse-status.off {
          background: #fee2e2;
          color: #991b1b;
        }

        .payment-status {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .payment-status.paid {
          background: #d1fae5;
          color: #065f46;
        }

        .payment-status.unpaid {
          background: #fee2e2;
          color: #991b1b;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      <Header />
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">
                Tạo yêu cầu hạ container
              </h1>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="gate-search-section">
          <div className="search-row">
            <div className="search-section">
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo mã container"
                aria-label="Tìm kiếm theo mã container"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select
                aria-label="Trạng thái"
                className="filter-select"
                value={localStatus}
                onChange={(e) => setLocalStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="SCHEDULED">Đã lên lịch</option>
                <option value="IN_PROGRESS">Đang thực hiện</option>
                <option value="GATE_IN">Gate-in</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
            <div className="action-group">
              <button 
                className="btn btn-success"
                onClick={handleCreateNew}
              >
                Tạo yêu cầu hạ container
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="gate-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : tableData.length === 0 ? (
            <div className="table-empty modern-empty">
              <div className="empty-icon">📦⬇️</div>
              <p>Chưa có yêu cầu hạ container nào</p>
              <small>Không có yêu cầu hạ container nào để xử lý</small>
            </div>
          ) : (
            <div className="table-scroll-container">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1800 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#0f172a' }}>
                    <th style={{...thStyle, minWidth: '100px'}}>Hãng tàu</th>
                    <th style={{...thStyle, minWidth: '150px'}}>Số yêu cầu</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Số Cont</th>
                    <th style={{...thStyle, minWidth: '100px'}}>Loại cont</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Loại dịch vụ</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Trạng thái</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Trạng thái reuse</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Khách hàng</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Nhà xe</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Số xe</th>
                    <th style={{...thStyle, minWidth: '100px'}}>Tài xế</th>
                    <th style={{...thStyle, minWidth: '120px'}}>SDT Tài xế</th>
                    <th style={{...thStyle, minWidth: '160px'}}>Thời gian hẹn</th>
                    <th style={{...thStyle, minWidth: '160px'}}>Giờ vào thực tế</th>
                    <th style={{...thStyle, minWidth: '160px'}}>Giờ ra thực tế</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Tổng tiền</th>
                    <th style={{...thStyle, minWidth: '150px'}}>Trạng thái thanh toán</th>
                    <th style={{...thStyle, minWidth: '100px'}}>Chứng từ</th>
                    <th style={{...thStyle, minWidth: '100px'}}>Dem/Det</th>
                    <th style={{...thStyle, minWidth: '150px'}}>Ghi chú</th>
                    <th style={{...thStyle, minWidth: '200px'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{...tdStyle, minWidth: '100px'}}>{row.shippingLine}</td>
                      <td style={{...tdStyle, minWidth: '150px'}}>{row.requestNumber}</td>
                      <td style={{...tdStyle, minWidth: '120px'}}>{row.containerNumber}</td>
                      <td style={{...tdStyle, minWidth: '100px'}}>{row.containerType}</td>
                      <td style={{...tdStyle, minWidth: '120px'}}>Hạ container</td>
                      <td style={{...tdStyle, minWidth: '120px'}}>{renderStatusText(row.status)}</td>
                      <td style={{...tdStyle, minWidth: '120px'}}>
                        <span className={`reuse-status ${row.reuseStatus ? 'on' : 'off'}`}>
                          {row.reuseStatus ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td style={{...tdStyle, minWidth: '120px'}}>{row.customer}</td>
                      <td style={{...tdStyle, minWidth: '120px'}}>{row.truckCompany}</td>
                      <td style={{...tdStyle, minWidth: '120px'}}>{row.truckNumber}</td>
                      <td style={{...tdStyle, minWidth: '100px'}}>{row.driverName}</td>
                      <td style={{...tdStyle, minWidth: '120px'}}>{row.driverPhone}</td>
                      <td style={{...tdStyle, minWidth: '160px'}}>{row.appointmentTime || '-'}</td>
                      <td style={{...tdStyle, minWidth: '160px'}}>{row.actualInTime || '-'}</td>
                      <td style={{...tdStyle, minWidth: '160px'}}>{row.actualOutTime || '-'}</td>
                      <td style={{...tdStyle, minWidth: '120px'}}>{formatCurrency(row.totalAmount)}</td>
                      <td style={{...tdStyle, minWidth: '150px'}}>
                        <span className={`payment-status ${row.paymentStatus === 'Đã thanh toán' ? 'paid' : 'unpaid'}`}>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td style={{...tdStyle, minWidth: '100px'}}>
                        <button 
                          type="button" 
                          className="btn btn-light" 
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => openDocuments(row)}
                          title="Xem chứng từ"
                        >
                          {(row.documentsCount ?? 0)} file
                        </button>
                      </td>
                      <td style={{...tdStyle, minWidth: '100px'}}>{row.demDet || '-'}</td>
                      <td style={{...tdStyle, minWidth: '150px'}}>{row.notes || '-'}</td>
                      <td style={{ ...tdStyle, minWidth: '200px', whiteSpace: 'nowrap' }}>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                          onClick={() => handleUpdateInfo(row.id)}
                          title="Cập nhật thông tin"
                        >
                          Cập nhật thông tin
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-danger" 
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => handleCancel(row.id)}
                          title="Hủy"
                        >
                          Hủy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        <CreateLowerRequestModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />

        {/* Documents Modal */}
        {isDocsOpen && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
            }}
            onClick={closeDocuments}
          >
            <div
              style={{ background: '#fff', borderRadius: 12, width: '720px', maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Chứng từ - {selectedRequest?.containerNo || ''}</h3>
                <button onClick={closeDocuments} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                {docsLoading ? (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
                ) : docsError ? (
                  <div style={{ color: '#ef4444' }}>{docsError}</div>
                ) : attachments.length === 0 ? (
                  <div style={{ color: '#64748b' }}>Không có chứng từ</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {attachments.map((f, idx) => (
                      <div key={f.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {f.file_type === 'image' ? (
                          <img src={f.storage_url} alt={f.file_name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        ) : (
                          <div style={{ width: 64, height: 64, border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>PDF</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{Math.round((f.file_size || 0) / 1024)} KB</div>
                          <a href={f.storage_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Mở</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={closeDocuments}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer />
      </main>
    </>
  );
}

// Styles cho table cells
const thStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  textAlign: 'left',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  padding: '12px 16px',
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap',
  minWidth: '120px'
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#0f172a',
  verticalAlign: 'top',
  background: 'white',
  borderTop: '1px solid #f1f5f9',
  whiteSpace: 'nowrap',
  minWidth: '120px'
};