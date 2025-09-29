import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '@services/api';
import GateRequestTable from './GateRequestTable';
import GateSearchBar from './GateSearchBar';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';
import { useDebounce } from '../../../hooks/useDebounce';
import Link from 'next/link';


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
}

interface GateDashboardProps {
  title?: string;
  lockedType?: string; // Khóa loại yêu cầu (IMPORT/EXPORT)
}

export default function GateDashboard({ title, lockedType }: GateDashboardProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<GateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Thêm state cho sidebar
  const { t } = useTranslation();
  const { ToastContainer, showSuccess, showError } = useToast();


  const [searchParams, setSearchParams] = useState({
    status: '',
    statuses: '',
    container_no: '',
    type: lockedType ?? '',
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

      // Luôn gọi API để lấy dữ liệu, backend sẽ xử lý logic mặc định
      // Backend sẽ hiển thị FORWARDED, GATE_IN, IN_YARD, IN_CAR khi không có filter

      const params = new URLSearchParams();
      // Nếu có lockedType thì cưỡng bức type đó
      const paramsSource: any = lockedType ? { ...effectiveSearchParams, type: lockedType } : effectiveSearchParams;
      // Mặc định hiển thị cả THÊM MỚI (NEW_REQUEST) + các trạng thái đã vào cổng nếu không chọn bộ lọc
      // Bổ sung DONE_LIFTING để không ẩn khi xe nâng hoàn thành
      if (!String(paramsSource.status || '').trim() && !String((paramsSource as any).statuses || '').trim()) {
        (paramsSource as any).statuses = 'NEW_REQUEST,FORWARDED,GATE_IN,IN_YARD,IN_CAR,FORKLIFTING,DONE_LIFTING';
      }

      Object.entries(paramsSource as Record<string, any>).forEach(([key, value]) => {
        // Thêm tất cả tham số, backend sẽ xử lý logic mặc định
        if (key === 'page' || key === 'limit') {
          params.append(key, value.toString());
        } else if (value && value.toString().trim()) {
          params.append(key, value.toString().trim());
        }
      });

      // Luôn gọi API, backend sẽ hiển thị dữ liệu mặc định khi không có filter
      const response = await api.get(`/gate/requests/search?${params.toString()}`);
      
      setRequests(response.data.data);
      setPagination(response.data.pagination);
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

  // Refetch data when route changes (to handle navigation from other pages)
  useEffect(() => {
    if (router.isReady) {
      fetchRequests();
    }
  }, [router.pathname, router.isReady]);

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
            <h1 className="page-title gradient gradient-ultimate">{title || t('pages.gate.title')}</h1>
          </div>
          <div className="header-right">
            <Link 
              href={lockedType === 'EXPORT' ? '/LiftContainer/GateHistory' : '/LowerContainer/GateHistory'} 
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h13l3 7-3 7H3V4z"></path>
                <path d="M8 11l2 2 4-4"></path>
              </svg>
              <span>Lịch sử ra vào</span>
            </Link>
          </div>
        </div>
      </div>



        <GateSearchBar
          searchParams={searchParams}
          onSearch={handleSearch}
          onContainerSearch={handleContainerSearch}
          onLicensePlateChange={handleLicensePlateChange}
          lockedType={lockedType}
        />

        <GateRequestTable
          requests={requests}
          loading={loading}
          onRefresh={fetchRequests}
          showSuccess={showSuccess}
          showError={showError}
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
