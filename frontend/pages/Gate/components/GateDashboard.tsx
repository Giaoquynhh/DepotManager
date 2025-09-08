import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import GateRequestTable from './GateRequestTable';
import GateSearchBar from './GateSearchBar';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';
import { useDebounce } from '../../../hooks/useDebounce';


interface GateRequest {
  id: string;
  container_no: string;
  type: string;
  status: string;
  eta?: string;
  forwarded_at?: string;
  license_plate?: string; // Thêm trường biển số xe
  driver_name?: string;   // Tên tài xế
  time_in?: string;       // Thời gian vào
  time_out?: string;      // Thời gian ra
  docs: any[];
  attachments: any[];
}

export default function GateDashboard() {
  const [requests, setRequests] = useState<GateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Thêm state cho sidebar
  const { t } = useTranslation();
  const { ToastContainer } = useToast();


  const [searchParams, setSearchParams] = useState({
    status: '',
    container_no: '',
    type: '',
    license_plate: '', // Thêm trường biển số xe
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Debounce các tham số tìm kiếm để tránh gọi API liên tục
  const debouncedContainerNo = useDebounce(searchParams.container_no, 500);
  const debouncedLicensePlate = useDebounce(searchParams.license_plate, 500);





  // Theo dõi trạng thái sidebar
  useEffect(() => {
    const checkSidebarState = () => {
      // Kiểm tra sidebar có visible không bằng cách kiểm tra CSS hoặc DOM
      const sidebar = document.querySelector('.sidebar');
      console.log('🔍 Checking sidebar state:', sidebar);
      
      if (sidebar) {
        // Sidebar đang sử dụng class 'closed' khi bị thu gọn (không phải 'hidden')
        const isVisible = !sidebar.classList.contains('closed');
        console.log('📱 Sidebar visible:', isVisible);
        setSidebarVisible(isVisible);
      } else {
        console.log('❌ Sidebar not found');
        // Fallback: dùng body class 'with-sidebar' nếu có
        const bodyHasWithSidebar = document.body.classList.contains('with-sidebar');
        setSidebarVisible(bodyHasWithSidebar);
      }
    };

    // Kiểm tra ban đầu
    checkSidebarState();

    // Theo dõi thay đổi sidebar
    const observer = new MutationObserver((mutations) => {
      console.log('🔄 Sidebar mutations detected:', mutations);
      checkSidebarState();
    });
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class']
      });
      console.log('👀 Observer attached to sidebar');
    } else {
      console.log('⚠️ Sidebar not found, trying main-content');
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        observer.observe(mainContent, {
          attributes: true,
          attributeFilter: ['style']
        });
        console.log('👀 Observer attached to main-content');
      }
    }

    // Luôn theo dõi thay đổi class của body (with-sidebar)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up observer');
      observer.disconnect();
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // Sử dụng debounced values cho tìm kiếm
      const effectiveSearchParams = {
        ...searchParams,
        container_no: debouncedContainerNo,
        license_plate: debouncedLicensePlate
      };

      // Kiểm tra xem có tham số tìm kiếm thực sự nào không (không bao gồm page/limit)
      const hasSearchParams = (effectiveSearchParams.container_no && effectiveSearchParams.container_no.trim()) || 
                             (effectiveSearchParams.license_plate && effectiveSearchParams.license_plate.trim()) || 
                             (effectiveSearchParams.status && effectiveSearchParams.status.trim()) || 
                             (effectiveSearchParams.type && effectiveSearchParams.type.trim());

      // Nếu không có tham số tìm kiếm nào, hiển thị trạng thái rỗng
      if (!hasSearchParams) {
        setRequests([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        });
        return;
      }

      const params = new URLSearchParams();
      Object.entries(effectiveSearchParams).forEach(([key, value]) => {
        // Chỉ thêm tham số tìm kiếm thực sự, không thêm page/limit khi không có search params
        if (key === 'page' || key === 'limit') {
          params.append(key, value.toString());
        } else if (value && value.toString().trim()) {
          params.append(key, value.toString().trim());
        }
      });

      // Chỉ gửi request khi có tham số tìm kiếm thực sự
      if (hasSearchParams) {
        const response = await api.get(`/gate/requests/search?${params.toString()}`);
        
        setRequests(response.data.data);
        setPagination(response.data.pagination);
      } else {
        // Nếu không có tham số nào sau khi filter, hiển thị trạng thái rỗng
        setRequests([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        });
      }
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách requests:', error);
      
      // Xử lý các loại lỗi cụ thể
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          // Redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/Login';
        }
        
        console.error('Response error:', {
          status,
          data,
          headers: error.response.headers
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Gọi API khi debounced values thay đổi
    fetchRequests();
  }, [debouncedContainerNo, debouncedLicensePlate, searchParams.status, searchParams.type, searchParams.page]);

  const handleSearch = (newParams: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({ ...prev, ...newParams, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleContainerSearch = (container_no: string) => {
    setSearchParams(prev => ({ ...prev, container_no, page: 1 }));
  };


  const handleLicensePlateChange = (license_plate: string) => {
    setSearchParams(prev => ({ ...prev, license_plate, page: 1 }));
  };



  return (
    <main className="container gate-page">
      <div className="page-header modern-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title gradient gradient-ultimate">{t('pages.gate.title')}</h1>
          </div>
          <div className="header-actions">
            <button
              onClick={() => window.location.href = '/Gate/History'}
              className="action-btn action-btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-blue-600)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h13l3 7-3 7H3V4z"></path>
                <path d="M8 11l2 2 4-4"></path>
              </svg>
              Lịch sử ra vào
            </button>
          </div>
        </div>
      </div>



        <GateSearchBar
          searchParams={searchParams}
          onSearch={handleSearch}
          onContainerSearch={handleContainerSearch}
          onLicensePlateChange={handleLicensePlateChange}
        />

        <GateRequestTable
          requests={requests}
          loading={loading}
          onRefresh={fetchRequests}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="pagination-btn"
            >
              ← {t('common.previous')}
            </button>
            
            <button
              className="pagination-btn active"
              disabled
            >
              {pagination.page} / {pagination.pages}
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="pagination-btn"
            >
              {t('common.next')} →
            </button>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer />
    </main>
  );
}
