import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@services/api';
import LowerGateRequestTable from './LowerGateRequestTable';
import GateSearchBar from '../../Gate/components/GateSearchBar';
import { useTranslation } from '../../../hooks/useTranslation';
import { useDataRefresh } from '../../../hooks/useRouteRefresh';
// import { useToast } from '../../../hooks/useToastHook'; // Không cần nữa
import Link from 'next/link';

interface GateRequest {
  id: string;
  request_no?: string;
  container_no: string;
  type: string;
  status: string;
  appointment_time?: string;
  time_in?: string;
  time_out?: string;
  license_plate?: string;
  driver_name?: string;
  service_type?: string;
  container_type?: { code: string };
  attachments: any[];
}

interface LowerGateDashboardProps {
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
}

export default function LowerGateDashboard({ showSuccess, showError }: LowerGateDashboardProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<GateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { shouldRefresh, resetRefresh } = useDataRefresh();
  const [componentKey, setComponentKey] = useState(0);

  const [searchParams, setSearchParams] = useState({
    status: '',
    statuses: '',
    container_no: '',
    type: 'IMPORT',
    license_plate: '',
    page: 1,
    limit: 20
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Tạo bản sao của searchParams để xử lý
      const paramsSource = { ...searchParams };
      
      // Không tự động ẩn GATE_OUT nữa, để người dùng có thể chọn hiển thị "Đã ra cổng"
      // Logic filter sẽ được xử lý bởi GateSearchBar component
      
      Object.entries(paramsSource).forEach(([key, value]) => {
        if (key === 'page' || key === 'limit') {
          params.append(key, value.toString());
        } else if (value && value.toString().trim()) {
          params.append(key, value.toString().trim());
        }
      });
      
      const response = await api.get(`/gate/requests/search?${params.toString()}`);
      setRequests(response.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh when route changes to ensure fresh data
  useEffect(() => {
    if (router.isReady) {
      console.log('🔄 LowerGateDashboard: Route changed to', router.pathname);
      // Reset state and fetch fresh data when route changes
      setRequests([]);
      setLoading(true);
      setComponentKey(prev => prev + 1);
      fetchRequests();
    }
  }, [router.pathname, router.isReady]);

  // Additional refresh when shouldRefresh is true
  useEffect(() => {
    if (shouldRefresh) {
      console.log('🔄 LowerGateDashboard: shouldRefresh triggered');
      setRequests([]);
      setLoading(true);
      setComponentKey(prev => prev + 1);
      fetchRequests();
      resetRefresh();
    }
  }, [shouldRefresh, resetRefresh]);

  // Force refresh when component mounts (to ensure fresh data)
  useEffect(() => {
    console.log('🔄 LowerGateDashboard: Component mounted');
    setRequests([]);
    setLoading(true);
    setComponentKey(prev => prev + 1);
    fetchRequests();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [searchParams.status, searchParams.statuses, searchParams.type, searchParams.page, searchParams.container_no, searchParams.license_plate]);

  const handleSearch = (newParams: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({ ...prev, ...newParams, page: 1 }));
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
            <h1 className="page-title gradient gradient-ultimate">Bảng điều khiển cổng - Hạ container</h1>
          </div>
          <div className="header-right">
            <Link 
              href="/LowerContainer/GateHistory" 
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
        searchParams={searchParams as any}
        onSearch={handleSearch}
        onContainerSearch={handleContainerSearch as any}
        onLicensePlateChange={handleLicensePlateChange as any}
        lockedType="IMPORT"
        simpleStatusFilter
      />

      <LowerGateRequestTable
        key={`gate-table-${componentKey}`}
        requests={requests}
        loading={loading}
        onRefresh={fetchRequests}
        showSuccess={showSuccess}
        showError={showError}
      />
    </main>
  );
}


