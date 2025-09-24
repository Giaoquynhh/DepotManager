import Header from '@components/Header';
import Card from '@components/Card';
import { useState, useEffect } from 'react';
import { useTranslation } from '@hooks/useTranslation';
import { api } from '@services/api';

interface RepairTicket {
  id: string;
  code: string;
  container_no?: string;
  problem_description: string;
  estimated_cost?: number;
  labor_cost?: number;
  manager_comment?: string;
  createdAt: string;
  updatedAt: string;
  serviceRequest?: {
    id: string;
    request_no?: string;
    container_no: string;
    license_plate?: string;
    driver_name?: string;
    driver_phone?: string;
    container_type?: {
      code: string;
    };
    attachments: any[];
  };
}

export default function RepairsPage() {
  const { t } = useTranslation();
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      
      const response = await api.get(`/maintenance/repairs?${params.toString()}`);
      setRepairs(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching repairs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [page]);

  const getContainerStatusLabel = (serviceRequest: any) => {
    if (!serviceRequest) return 'Không có thông tin';
    
    // Dựa vào status của service request để xác định trạng thái container
    const statusMap: { [key: string]: string } = {
      'GATE_IN': 'Đã vào cổng',
      'IN_YARD': 'Trong bãi',
      'CHECKING': 'Đang kiểm tra',
      'COMPLETED': 'Hoàn thành'
    };
    return statusMap[serviceRequest.status] || serviceRequest.status || 'Không xác định';
  };


  return (
    <>
      <Header />
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">Danh sách phiếu kiểm tra</h1>
            </div>
            <div className="header-actions">
            </div>
          </div>
        </div>


        <Card>
          <div style={{ overflow: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: '1400px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số yêu cầu</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số cont</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Loại cont</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Số xe</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Tài xế</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>SDT tài xế</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Trạng thái phiếu</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Trạng thái cont</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Thời gian bắt đầu</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Thời gian kết thúc</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Hình ảnh</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} style={{
                      padding: '40px 8px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : repairs.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{
                      padding: '40px 8px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      Không có phiếu sửa chữa nào để hiển thị
                    </td>
                  </tr>
                ) : (
                  repairs.map((repair) => (
                    <tr key={repair.id}>
                      <td style={{ padding: '12px 8px' }}>
                        {repair.serviceRequest?.request_no || repair.code}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {repair.container_no || repair.serviceRequest?.container_no || '-'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {repair.serviceRequest?.container_type?.code || '-'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {repair.serviceRequest?.license_plate || '-'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {repair.serviceRequest?.driver_name || '-'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {repair.serviceRequest?.driver_phone || '-'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#e0e7ff',
                          color: '#2563eb'
                        }}>
                          Chưa định nghĩa
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#374151'
                        }}>
                          {getContainerStatusLabel(repair.serviceRequest)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {new Date(repair.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {new Date(repair.updatedAt).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {repair.serviceRequest?.attachments && repair.serviceRequest.attachments.length > 0 ? (
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#e0e7ff',
                            color: '#2563eb',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {repair.serviceRequest.attachments.length} ảnh
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Từ chối
                          </button>
                          <button
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Chấp nhận
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                    </tbody>
                  </table>
                </div>

          {/* Pagination */}
          {totalPages > 1 && (
              <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
                marginTop: '20px',
              padding: '20px'
              }}>
                <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: page === 1 ? '#f3f4f6' : '#3b82f6',
                  color: page === 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Trước
              </button>
              <span style={{ padding: '0 16px' }}>
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                  style={{
                    padding: '8px 16px',
                  backgroundColor: page === totalPages ? '#f3f4f6' : '#3b82f6',
                  color: page === totalPages ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                Sau
                </button>
          </div>
        )}
        </Card>


      </main>
    </>
  );
}


