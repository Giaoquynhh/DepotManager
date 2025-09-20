import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';
import { useDebounce } from '../../../hooks/useDebounce';
import Link from 'next/link';

interface GateHistoryItem {
  id: string;
  container_no: string;
  type: string;
  driver_name?: string;
  license_plate?: string;
  time_in?: string;
  time_out?: string;
  status: string;
  createdAt: string;
}

interface GateHistoryProps {
  // No props needed
}

export default function GateHistory({}: GateHistoryProps) {
  const [history, setHistory] = useState<GateHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchParams, setSearchParams] = useState({
    container_no: '',
    driver_name: '',
    license_plate: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const { t, currentLanguage } = useTranslation();
  const { showError } = useToast();

  // Debounce các tham số tìm kiếm để giảm số lần gọi API
  const debouncedContainerNo = useDebounce(searchParams.container_no, 800);
  const debouncedDriverName = useDebounce(searchParams.driver_name, 800);
  const debouncedLicensePlate = useDebounce(searchParams.license_plate, 800);

  const fetchHistory = async (useDebouncedValues = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Sử dụng debounced values nếu được yêu cầu, ngược lại dùng giá trị hiện tại
      const containerNo = useDebouncedValues ? debouncedContainerNo : searchParams.container_no;
      const driverName = useDebouncedValues ? debouncedDriverName : searchParams.driver_name;
      const licensePlate = useDebouncedValues ? debouncedLicensePlate : searchParams.license_plate;
      
      if (containerNo) params.append('container_no', containerNo);
      if (driverName) params.append('driver_name', driverName);
      if (licensePlate) params.append('license_plate', licensePlate);
      params.append('page', searchParams.page.toString());
      params.append('limit', searchParams.limit.toString());

      console.log('🔍 Frontend: Calling API with params:', params.toString());
      const response = await api.get(`/gate/history?${params.toString()}`);
      console.log('📊 Frontend: API response:', response.data);
      
      setHistory(response.data.data || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error: any) {
      console.error('❌ Frontend: API error:', error);
      showError(
        'Lỗi khi tải lịch sử',
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Effect cho debounced search - chỉ gọi API sau khi user ngừng gõ 800ms
  useEffect(() => {
    console.log('🔄 Frontend: Debounced search triggered');
    setSearching(true);
    fetchHistory(true); // Sử dụng debounced values
  }, [debouncedContainerNo, debouncedDriverName, debouncedLicensePlate]);

  // Effect cho pagination - gọi API ngay lập tức khi chuyển trang
  useEffect(() => {
    console.log('🔄 Frontend: Page change triggered');
    fetchHistory(false); // Sử dụng giá trị hiện tại
  }, [searchParams.page]);

  const handleSearch = () => {
    console.log('🔍 Frontend: handleSearch called');
    setSearchParams(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    console.log('🔄 Frontend: handlePageChange called with page:', newPage);
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return t('common.na');
    return new Date(dateString).toLocaleString(
      currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
    );
  };

  // Debug: Log current state
  console.log('🔍 Frontend: Current state - history:', history.length, 'loading:', loading, 'pagination:', pagination);

  return (
    <div className="gate-dashboard">
      {/* Header */}
      <div className="page-header modern-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title gradient gradient-ultimate">Lịch sử ra vào cổng</h1>
          </div>
          <div className="header-right">
            <Link 
              href="/Gate" 
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
              <span>Quay lại</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="search-filters" style={{
        backgroundColor: 'white',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)'
        }}>
          <div>
            <input
              type="text"
              value={searchParams.container_no}
              onChange={(e) => setSearchParams(prev => ({ ...prev, container_no: e.target.value, page: 1 }))}
              placeholder="Tìm kiếm theo mã container..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
          <div>
            <input
              type="text"
              value={searchParams.driver_name}
              onChange={(e) => setSearchParams(prev => ({ ...prev, driver_name: e.target.value, page: 1 }))}
              placeholder="Tìm kiếm theo tên tài xế..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
          <div>
            <input
              type="text"
              value={searchParams.license_plate}
              onChange={(e) => setSearchParams(prev => ({ ...prev, license_plate: e.target.value, page: 1 }))}
              placeholder="Tìm kiếm theo biển số xe..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {searching && (
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-blue-600)',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <div className="loading-spinner" style={{ width: '12px', height: '12px' }}></div>
              Đang tìm kiếm tự động...
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="history-table-container" style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div className="loading-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--space-12)',
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-gray-500)'
          }}>
            <div className="loading-spinner"></div>
            <span style={{ marginLeft: 'var(--space-3)' }}>Đang tải dữ liệu...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'var(--space-12)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: 'var(--space-4)',
              opacity: 0.5
            }}>
              📋
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Không có dữ liệu
            </h3>
            <p style={{
              color: 'var(--color-gray-500)',
              fontSize: 'var(--font-size-sm)'
            }}>
              Không tìm thấy lịch sử xe ra vào cổng nào
            </p>
          </div>
        ) : (
          <>
            <div className="table-header" style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-gray-50)',
              borderBottom: '1px solid var(--color-gray-200)'
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-gray-800)',
                margin: 0
              }}>
                Danh sách xe đã ra khỏi cổng ({pagination.total} xe)
              </h3>
            </div>
            <div className="table-responsive gate-history-scroll" style={{
              maxHeight: '50vh', /* Giảm chiều cao cho mobile */
              overflowY: 'scroll', /* Thay đổi từ 'auto' thành 'scroll' để luôn hiển thị scrollbar */
              overflowX: 'auto',
              /* Custom scrollbar styling */
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--color-gray-300) var(--color-gray-100)',
              /* Mobile touch scrolling */
              WebkitOverflowScrolling: 'touch',
              /* Đảm bảo scroll hoạt động trên mobile */
              position: 'relative',
              zIndex: 1
            }}>
              <table className="history-table" style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-gray-50)' }}>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Mã Container
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Loại yêu cầu
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Tên tài xế
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Biển số xe
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Thời gian vào
                    </th>
                    <th style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-gray-700)',
                      borderBottom: '1px solid var(--color-gray-200)'
                    }}>
                      Thời gian ra
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid var(--color-gray-100)',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td data-label="Mã Container" style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-blue-600)'
                      }}>
                        {item.container_no}
                      </td>
                      <td data-label="Loại yêu cầu" style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          backgroundColor: item.type === 'IMPORT' ? 'var(--color-blue-100)' : 'var(--color-green-100)',
                          color: item.type === 'IMPORT' ? 'var(--color-blue-800)' : 'var(--color-green-800)'
                        }}>
                          {typeLabel(item.type)}
                        </span>
                      </td>
                      <td data-label="Tên tài xế" style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-700)'
                      }}>
                        {item.driver_name || t('common.na')}
                      </td>
                      <td data-label="Biển số xe" style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-700)',
                        fontFamily: 'var(--font-family-mono)'
                      }}>
                        {item.license_plate || t('common.na')}
                      </td>
                      <td data-label="Thời gian vào" style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        color: item.time_in ? 'var(--color-green-600)' : 'var(--color-gray-500)'
                      }}>
                        {formatDateTime(item.time_in)}
                      </td>
                      <td data-label="Thời gian ra" style={{
                        padding: 'var(--space-4)',
                        fontSize: 'var(--font-size-sm)',
                        color: item.time_out ? 'var(--color-red-600)' : 'var(--color-gray-500)'
                      }}>
                        {formatDateTime(item.time_out)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-6)'
        }}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="pagination-btn"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: pagination.page <= 1 ? 'var(--color-gray-100)' : 'white',
              color: pagination.page <= 1 ? 'var(--color-gray-400)' : 'var(--color-gray-700)',
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            ← Trước
          </button>
          
          <span style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--color-blue-600)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {pagination.page} / {pagination.pages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="pagination-btn"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: pagination.page >= pagination.pages ? 'var(--color-gray-100)' : 'white',
              color: pagination.page >= pagination.pages ? 'var(--color-gray-400)' : 'var(--color-gray-700)',
              cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
