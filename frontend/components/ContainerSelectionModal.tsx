import React, { useState, useEffect } from 'react';
import { requestsApi, AvailableContainer } from '@services/requests';

interface Container {
  container_no: string;
  location: string;
  status: string;
  placed_at: string;
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
      // Sử dụng API mới để lấy danh sách container available cho EXPORT
      const response = await requestsApi.getAvailableContainersForExport(searchQuery || undefined);
      const containers = response.data as AvailableContainer[];
      
      setContainers(containers);
      setTotalPages(1); // API mới không có pagination
      
      // Debug log
      console.log('🔍 ContainerSelectionModal: Loaded available containers:', {
        count: containers.length,
        sampleItems: containers.slice(0, 3)
      });
    } catch (error) {
      console.error('Error loading available containers:', error);
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
                          {container.location || '-'}
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
                            {container.status}
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
