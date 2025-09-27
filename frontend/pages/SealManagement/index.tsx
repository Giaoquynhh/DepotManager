import { useState, useEffect } from 'react';
import Header from '@components/Header';
import Card from '@components/Card';
import { useTranslation } from '@hooks/useTranslation';
import { useToast } from '@hooks/useToastHook';
import { sealsApi, Seal, CreateSealData, UpdateSealData, SealListParams } from '@services/seals';
import { setupService, ShippingLine } from '@services/setupService';
import { CreateSealModal } from './components/CreateSealModal';
import { EditSealModal } from './components/EditSealModal';
import { SealUsageHistoryModal } from './components/SealUsageHistoryModal';


function SealManagement() {
  const { t } = useTranslation();
  const { showSuccess, showError, ToastContainer } = useToast();
  
  const [seals, setSeals] = useState<Seal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditSealModalOpen, setIsEditSealModalOpen] = useState(false);
  const [isCreateSealModalOpen, setIsCreateSealModalOpen] = useState(false);
  const [isUsageHistoryModalOpen, setIsUsageHistoryModalOpen] = useState(false);
  const [editingSeal, setEditingSeal] = useState<Seal | null>(null);
  const [selectedSealForHistory, setSelectedSealForHistory] = useState<Seal | null>(null);
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  
  // Filters and pagination
  const [filters, setFilters] = useState<SealListParams>({
    search: '',
    shipping_company: '',
    status: '',
    page: 1,
    pageSize: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });

  useEffect(() => {
    loadSeals();
    loadShippingLines();
  }, [filters]);

  // Refresh seals data every 30 seconds to catch updates from other pages
  useEffect(() => {
    const interval = setInterval(() => {
      loadSeals();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [filters]);

  const loadSeals = async () => {
    try {
      setLoading(true);
      const response = await sealsApi.list(filters);
      setSeals(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load seals');
      showError('Error', err?.response?.data?.message || 'Failed to load seals');
    } finally {
      setLoading(false);
    }
  };

  const loadShippingLines = async () => {
    try {
      console.log('Loading shipping lines...');
      const response = await setupService.getShippingLines({ page: 1, limit: 100 });
      console.log('Setup service response:', response);
      
      if (response.success && response.data) {
        setShippingLines(response.data.data || []);
        console.log('Received shipping lines:', response.data.data);
      } else {
        console.error('Failed to load shipping lines:', response.message);
        setShippingLines([]);
        showError(t('common.error'), response.message || 'Không thể tải danh sách hãng tàu');
      }
    } catch (err: any) {
      console.error('Failed to load shipping lines:', err);
      setShippingLines([]);
      showError(t('common.error'), 'Không thể tải danh sách hãng tàu');
    }
  };

  const handleCreateSeal = async (data: CreateSealData) => {
    try {
      await sealsApi.create(data);
      showSuccess(t('common.success'), t('seal.createdSuccessfully'));
      setIsCreateSealModalOpen(false);
      loadSeals();
    } catch (err: any) {
      showError(t('common.error'), err?.response?.data?.message || t('seal.createFailed'));
    }
  };

  const handleEdit = (seal: Seal) => {
    setEditingSeal(seal);
    setIsEditSealModalOpen(true);
  };

  const handleViewHistory = (seal: Seal) => {
    setSelectedSealForHistory(seal);
    setIsUsageHistoryModalOpen(true);
  };

  const handleUpdateSeal = async (data: UpdateSealData) => {
    if (!editingSeal) return;
    
    try {
      await sealsApi.update(editingSeal.id, data);
      showSuccess(t('common.success'), t('seal.updatedSuccessfully'));
      setIsEditSealModalOpen(false);
      setEditingSeal(null);
      loadSeals();
    } catch (err: any) {
      showError(t('common.error'), err?.response?.data?.message || t('seal.updateFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa seal này?')) return;
    
    try {
      await sealsApi.delete(id);
      showSuccess(t('common.success'), t('seal.deletedSuccessfully'));
      loadSeals();
    } catch (err: any) {
      showError(t('common.error'), err?.response?.data?.message || t('seal.deleteFailed'));
    }
  };

  const handleFilterChange = (key: keyof SealListParams, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const parseFormattedNumber = (str: string) => {
    return parseInt(str.replace(/\./g, '')) || 0;
  };

  const getShippingLineName = (shippingCompany: string): string => {
    const shippingLine = shippingLines.find(line => line.name === shippingCompany);
    return shippingLine ? `${shippingLine.code} - ${shippingLine.name}` : shippingCompany;
  };

  if (error) {
    return (
      <>
        <style>{`
          body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
        <Header />
        <main className="container depot-requests">
          <div className="card card-padding-lg">
            <div className="text-center">
              <h2 className="text-red-600">{t('common.error')}</h2>
              <p>{error}</p>
              <button 
                className="btn btn-outline mt-2"
                onClick={() => setError(null)}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{`
        /* Mobile scroll fix for Seal Management page */
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
        
        /* Table styling like invoice table */
        .table-container {
          border-radius: 8px;
          overflow: hidden;
        }
        
        .table-container tbody tr:hover {
          background-color: #f9fafb;
        }

        /* Button styling for table actions */
        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 4px;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-outline {
          background: transparent;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .btn-outline:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .btn-danger:hover {
          background: #dc2626;
          border-color: #dc2626;
        }

        .btn-info {
          background: #0ea5e9;
          color: white;
          border-color: #0ea5e9;
        }

        .btn-info:hover {
          background: #0284c7;
          border-color: #0284c7;
        }

        /* Table responsive styling */
        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .table th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          font-size: 14px;
        }

        .table tbody tr:hover {
          background-color: #f9fafb;
        }
      `}</style>
      <Header />
      <main className="container depot-requests">
        {/* Page Header */}
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">Quản lý Seal</h1>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-success"
                onClick={() => setIsCreateSealModalOpen(true)}
              >
                Tạo Seal
              </button>
            </div>
          </div>
        </div>

        {/* Seals Table */}
        <Card>
          <div style={{overflowX:'auto'}}>
            <table className="table" style={{minWidth:'1000px'}}>
              <thead>
                <tr>
                  <th>Hãng Tàu</th>
                  <th>Ngày mua</th>
                  <th>Số lượng mua</th>
                  <th>Số lượng đã xuất</th>
                  <th>Số lượng còn lại</th>
                  <th>Đơn giá</th>
                  <th>Tổng tiền</th>
                  <th>Nơi lấy</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{textAlign:'center', padding:'40px 20px'}}>
                      Đang tải...
                    </td>
                  </tr>
                ) : seals.length > 0 ? (
                  seals.map((seal) => (
                    <tr key={seal.id}>
                      <td>{getShippingLineName(seal.shipping_company)}</td>
                      <td>{formatDate(seal.purchase_date)}</td>
                      <td>{formatNumber(seal.quantity_purchased)}</td>
                      <td>{formatNumber(seal.quantity_exported)}</td>
                      <td>{formatNumber(seal.quantity_remaining)}</td>
                      <td>{formatCurrency(seal.unit_price)}</td>
                      <td>{formatCurrency(seal.total_amount)}</td>
                      <td>{seal.pickup_location}</td>
                      <td style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => handleEdit(seal)}
                          style={{padding:'4px 8px', fontSize:'12px'}}
                        >
                          Sửa
                        </button>
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => handleViewHistory(seal)}
                          style={{padding:'4px 8px', fontSize:'12px'}}
                        >
                          Lịch sử
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(seal.id)}
                          style={{padding:'4px 8px', fontSize:'12px'}}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{textAlign:'center', padding:'40px 20px', color:'#666'}}>
                      Không có seal nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Edit Seal Modal */}
        <EditSealModal
          isOpen={isEditSealModalOpen}
          onClose={() => {
            setIsEditSealModalOpen(false);
            setEditingSeal(null);
          }}
          onSubmit={handleUpdateSeal}
          seal={editingSeal}
        />

        {/* Create Seal Modal */}
        <CreateSealModal
          isOpen={isCreateSealModalOpen}
          onClose={() => setIsCreateSealModalOpen(false)}
          onSubmit={handleCreateSeal}
        />

        {/* Seal Usage History Modal */}
        <SealUsageHistoryModal
          isOpen={isUsageHistoryModalOpen}
          onClose={() => {
            setIsUsageHistoryModalOpen(false);
            setSelectedSealForHistory(null);
          }}
          seal={selectedSealForHistory}
        />
      </main>
      <ToastContainer />
    </>
  );
}

export default SealManagement;