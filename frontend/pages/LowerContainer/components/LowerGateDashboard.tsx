import React, { useEffect, useState } from 'react';
import { api } from '@services/api';
import LowerGateRequestTable from './LowerGateRequestTable';
import GateSearchBar from '../../Gate/components/GateSearchBar';
import { useTranslation } from '../../../hooks/useTranslation';

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

export default function LowerGateDashboard() {
  const [requests, setRequests] = useState<GateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useState({
    status: '',
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
      Object.entries(searchParams).forEach(([key, value]) => {
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

  useEffect(() => {
    fetchRequests();
  }, [searchParams.status, searchParams.type, searchParams.page, searchParams.container_no, searchParams.license_plate]);

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
        requests={requests}
        loading={loading}
        onRefresh={fetchRequests}
      />
    </main>
  );
}


