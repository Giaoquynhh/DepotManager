import React, { useState, useEffect } from 'react';
import { reportsApi } from '@services/reports';

interface Container {
  container_no: string;
  yard_name: string;
  block_code: string;
  slot_code: string;
  derived_status: string;
  service_gate_checked_at?: string;
  service_license_plate?: string;
  service_driver_name?: string;
}

interface ContainerSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectContainer: (containerNo: string) => void;
  requestType: string;
  requestId: string;
  onContainerSelected: (containerNo: string) => void; // Thêm callback khi chọn container
}

export default function ContainerSelectionModal({
  visible,
  onClose,
  onSelectContainer,
  requestType,
  requestId,
  onContainerSelected
}: ContainerSelectionModalProps) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Chỉ load containers khi modal mở và request type là EXPORT
  useEffect(() => {
    console.log('🔍 ContainerSelectionModal useEffect:', { visible, requestType, currentPage, searchQuery });
    if (visible && requestType === 'EXPORT') {
      console.log('🔍 ContainerSelectionModal: Loading containers...');
      loadContainers();
    }
  }, [visible, requestType, currentPage, searchQuery]);

  const loadContainers = async () => {
    setLoading(true);
    try {
      // Sử dụng logic giống hệt như trong ContainersPage - không filter status
      const params = {
        q: searchQuery || undefined,
        // Không set status để lấy tất cả container
        page: currentPage,
        pageSize
      };
      
      const response = await reportsApi.listContainers(params);
      
      // Sử dụng logic lọc giống hệt như trong ContainersPage
      const items = (response.items || []).map((it: any) => {
        const inYard = !!it.slot_code;
        
        if (inYard) {
          // Container có slot_code - đã xếp chỗ trong bãi
          if (it.service_status === 'CHECKED' || it.repair_checked === true) {
            // Container đã được kiểm tra (CHECKED) - trạng thái bình thường
            return { ...it, derived_status: 'ASSIGNED' };
          } else if (it.service_status === 'SYSTEM_ADMIN_ADDED') {
            // Container được SystemAdmin nhập trực tiếp vào bãi
            return { ...it, derived_status: 'EMPTY_IN_YARD' };
          } else {
            // Container KHÔNG có service_status = 'CHECKED' nhưng có slot_code
            // => Đây là container được SystemAdmin nhập tùy ý
            return { ...it, derived_status: 'EMPTY_IN_YARD' };
          }
        } else {
          // Container chưa có slot_code
          if (it.service_status === 'CHECKED' || it.repair_checked === true) {
            // Container đã kiểm tra nhưng chưa xếp chỗ - đang chờ sắp xếp
            return { ...it, derived_status: 'WAITING' };
          } else {
            // Container chưa được kiểm tra - không có derived_status
            return { ...it, derived_status: null };
          }
        }
      });
      
      // Lọc chỉ lấy container có derived_status = 'EMPTY_IN_YARD'
      const emptyInYardContainers = items.filter((i: any) => i.derived_status === 'EMPTY_IN_YARD');

      setContainers(emptyInYardContainers);
      setTotalPages(Math.ceil(response.total / pageSize));
      
      // Debug log
      console.log('🔍 ContainerSelectionModal: Loaded containers:', {
        totalItems: response.items?.length || 0,
        emptyInYardCount: emptyInYardContainers.length,
        sampleItems: emptyInYardContainers.slice(0, 3)
      });
    } catch (error) {
      console.error('Error loading containers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadContainers();
  };

  const handleContainerSelect = (containerNo: string) => {
    console.log('🔍 ContainerSelectionModal: handleContainerSelect called with:', containerNo);
    console.log('🔍 ContainerSelectionModal: onContainerSelected function:', onContainerSelected);
    console.log('🔍 ContainerSelectionModal: onContainerSelected type:', typeof onContainerSelected);
    
    // Gọi callback để thông báo container đã được chọn
    try {
      onContainerSelected(containerNo);
      console.log('🔍 ContainerSelectionModal: onContainerSelected called successfully');
    } catch (error) {
      console.error('❌ ContainerSelectionModal: Error calling onContainerSelected:', error);
    }
    
    // Không đóng modal ngay, để parent component xử lý
    console.log('🔍 ContainerSelectionModal: handleContainerSelect completed');
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chọn Container cho Request EXPORT</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="search-section" style={{ marginBottom: '20px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Tìm kiếm container..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: '8px 16px' }}
              >
                {loading ? '⏳' : '🔍'} Tìm kiếm
              </button>
            </form>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div>⏳ Đang tải danh sách container...</div>
            </div>
          ) : containers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              {searchQuery ? 'Không tìm thấy container phù hợp.' : 'Không có container rỗng trong bãi.'}
            </div>
          ) : (
            <>
              <div className="containers-table" style={{ marginBottom: '20px' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead style={{ background: '#f7f9ff' }}>
                    <tr>
                      <th>Container</th>
                      <th>Vị trí</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {containers.map((container) => (
                      <tr key={container.container_no}>
                        <td style={{ fontWeight: '700' }}>{container.container_no}</td>
                        <td>
                          {container.yard_name || '-'} / {container.block_code || '-'} / {container.slot_code || '-'}
                        </td>
                        <td>
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontWeight: '700',
                              fontSize: '12px'
                            }}
                          >
                            Container rỗng có trong bãi
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleContainerSelect(container.container_no)}
                            title="Chọn container này"
                          >
                            ✅ Chọn
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="muted">
                    Trang {currentPage} / {totalPages}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      ← Trước
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
