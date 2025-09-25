import React from 'react';
import { useRouter } from 'next/router';
import Header from '@components/Header';
import Card from '@components/Card';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToastHook';
import { useRouteRefresh } from '../hooks/useRouteRefresh';
import { requestService } from '../services/requests';
import { maintenanceApi } from '../services/maintenance';

// Interface cho dữ liệu bảng
interface TableData {
  id: string;
  shippingLine: string; // Hãng tàu
  containerNumber: string; // Số Cont
  containerType: string; // Loại Cont
  status: string; // Trạng thái
  customer: string; // Khách hàng
  documents: string; // Chứng từ
  documentsCount?: number; // Số lượng chứng từ
  repairImagesCount?: number; // Số lượng ảnh kiểm tra
  repairTicketId?: string; // ID của repair ticket
}

export default function ManagerCont(){
  const router = useRouter();
  const { t } = useTranslation();
  const { showSuccess, ToastContainer } = useToast();
  const [localSearch, setLocalSearch] = React.useState('');
  const [localType, setLocalType] = React.useState('all');
  const [localStatus, setLocalStatus] = React.useState('all');
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const routeRefreshKey = useRouteRefresh();
  const [loading, setLoading] = React.useState(false);
  
  // Documents modal states
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<{id: string, containerNo: string} | null>(null);
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError] = React.useState<string | null>(null);

  // Repair images modal states
  const [isRepairImagesOpen, setIsRepairImagesOpen] = React.useState(false);
  const [selectedRepairTicket, setSelectedRepairTicket] = React.useState<{id: string, containerNo: string} | null>(null);
  const [repairImages, setRepairImages] = React.useState<any[]>([]);
  const [repairImagesLoading, setRepairImagesLoading] = React.useState(false);
  const [repairImagesError, setRepairImagesError] = React.useState<string | null>(null);

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

  // Repair images modal functions
  const openRepairImages = async (row: TableData) => {
    if (!row.repairTicketId) {
      showSuccess('Không có phiếu sửa chữa cho container này');
      return;
    }
    
    try {
      setSelectedRepairTicket({ id: row.repairTicketId, containerNo: row.containerNumber });
      setIsRepairImagesOpen(true);
      setRepairImagesLoading(true);
      setRepairImagesError(null);
      const res = await maintenanceApi.getRepairImages(row.repairTicketId);
      if (res.success) {
        setRepairImages(res.data || []);
      } else {
        setRepairImages([]);
        setRepairImagesError('Không thể tải danh sách ảnh kiểm tra');
      }
    } catch (err: any) {
      setRepairImagesError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải ảnh kiểm tra');
      setRepairImages([]);
    } finally {
      setRepairImagesLoading(false);
    }
  };

  const closeRepairImages = () => {
    setIsRepairImagesOpen(false);
    setSelectedRepairTicket(null);
    setRepairImages([]);
    setRepairImagesError(null);
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


  // Function để fetch import requests từ API
  const fetchImportRequests = async () => {
    setLoading(true);
    try {
      const response = await requestService.getRequests('IMPORT');
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Transform data từ API thành format của table
        const transformedData: TableData[] = await Promise.all(
          response.data.data.map(async (request: any) => {
            // Lấy repair ticket cho container này
            let repairImagesCount = 0;
            let repairTicketId = '';
            
            try {
              const repairResponse = await maintenanceApi.listRepairs({ 
                container_no: request.container_no,
                limit: 1 
              });
              
              if (repairResponse.data && repairResponse.data.length > 0) {
                const repairTicket = repairResponse.data[0];
                repairTicketId = repairTicket.id;
                repairImagesCount = repairTicket.imagesCount || 0;
              }
            } catch (repairError) {
              console.log('No repair ticket found for container:', request.container_no);
            }

            return {
              id: request.id,
              shippingLine: request.shipping_line?.name || '',
              containerNumber: request.container_no || '',
              containerType: request.container_type?.code || '',
              status: request.status || '',
              customer: request.customer?.name || '',
              documents: request.attachments?.map((att: any) => att.file_name).join(', ') || '',
              documentsCount: request.attachments?.length || 0,
              repairImagesCount,
              repairTicketId
            };
          })
        );
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
        /* Mobile scroll fix for ManagerCont page */
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

        .search-filter-section {
          margin-bottom: 1.5rem;
        }

        .search-filter-container {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          min-width: 180px;
          transition: border-color 0.2s;
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

        .btn-primary {
          background: #10b981;
          color: white;
        }

        .btn-primary:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        /* Specific styling for documents button */
        .data-table .btn-light {
          background: #f8f9fa !important;
          color: #1e3a8a !important;
          border: 1px solid #d1d5db !important;
          font-weight: 500 !important;
        }

        .data-table .btn-light:hover {
          background: #e5e7eb !important;
          border-color: #9ca3af !important;
          color: #1e40af !important;
        }

        .table-section {
          margin-top: 1.5rem;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .data-table th {
          background: #f3f4f6;
          padding: 0.75rem 0.5rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          white-space: nowrap;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .data-table td {
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
          white-space: nowrap;
        }

        .data-table tr:hover {
          background: #f9fafb;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-đang-xử-lý {
          background: #fef3c7;
          color: #92400e;
        }

        .status-hoàn-thành {
          background: #d1fae5;
          color: #065f46;
        }


        .action-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .btn-sm {
          padding: 0.375rem 0.5rem;
          font-size: 0.75rem;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.2s;
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

        .no-data {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .search-filter-container {
            padding: 0.75rem;
            flex-direction: column;
            gap: 0.75rem;
          }

          .search-input-wrapper {
            min-width: 100%;
          }

          .filter-select {
            min-width: 100%;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 1200px) {
          .data-table th,
          .data-table td {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
      <Header />
      <main className="container depot-requests">
        {/* Page Header */}
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">Quản lý container</h1>
            </div>

            <div className="header-actions">
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-filter-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm theo mã container"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>
            
                <select
                  className="filter-select"
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">
          <div className="table-container">
            
            <div className="table-wrapper">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hãng tàu</th>
                      <th>Số Cont</th>
                      <th>Loại Cont</th>
                      <th>Trạng thái</th>
                      <th>Khách hàng</th>
                      <th>Chứng từ</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="no-data">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row) => (
                        <tr key={row.id}>
                          <td>{row.shippingLine}</td>
                          <td>{row.containerNumber}</td>
                          <td>{row.containerType}</td>
                          <td>
                            <span className={`status-badge status-${row.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {row.status}
                            </span>
                          </td>
                          <td>{row.customer}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={() => openRepairImages(row)}
                                title="Xem ảnh kiểm tra"
                                style={{ padding: '4px 8px', fontSize: '12px', width: '100%' }}
                              >
                                {(row.repairImagesCount ?? 0)} ảnh kiểm tra
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={() => openDocuments(row)}
                                title="Xem chứng từ"
                                style={{ padding: '4px 8px', fontSize: '12px', width: '100%' }}
                              >
                                {(row.documentsCount ?? 0)} chứng từ
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleUpdateInfo(row.id)}
                                title="Cập nhật thông tin"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleCancel(row.id)}
                                title="Hủy"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                              </button>
              </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

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

        {/* Repair Images Modal */}
        {isRepairImagesOpen && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
            }}
            onClick={closeRepairImages}
          >
            <div
              style={{ background: '#fff', borderRadius: 12, width: '720px', maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Ảnh kiểm tra - {selectedRepairTicket?.containerNo || ''}</h3>
                <button onClick={closeRepairImages} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                {repairImagesLoading ? (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
                ) : repairImagesError ? (
                  <div style={{ color: '#ef4444' }}>{repairImagesError}</div>
                ) : repairImages.length === 0 ? (
                  <div style={{ color: '#64748b' }}>Không có ảnh kiểm tra</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {repairImages.map((img, idx) => (
                      <div key={img.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={img.storage_url} alt={img.file_name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.file_name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{Math.round((img.file_size || 0) / 1024)} KB</div>
                          <a href={img.storage_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Mở</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={closeRepairImages}>Đóng</button>
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
