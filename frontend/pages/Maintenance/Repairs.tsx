import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useState } from 'react';
import { useTranslation } from '@hooks/useTranslation';
import {
  PendingContainersModal,
  RepairTable,
  RepairPageHeader,
  MessageDisplay,
  RepairInvoiceModal
} from '@components/Maintenance';

export default function RepairsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('CHECKING');
  const [isPendingContainersModalOpen, setIsPendingContainersModalOpen] = useState(false);
  const [isRepairInvoiceModalOpen, setIsRepairInvoiceModalOpen] = useState(false);
  const [selectedRepairTicket, setSelectedRepairTicket] = useState<any>(null);
  const key = ['repairs', filter].join(':');
  const { data: repairs } = useSWR(key, async () => {
    const repairsList = await maintenanceApi.listRepairs(filter || undefined);
    
    // Kiểm tra hóa đơn thực tế cho mỗi phiếu
    const repairsWithInvoice = await Promise.all(
      repairsList.map(async (repair) => {
        try {
          const invoiceCheck = await maintenanceApi.checkRepairInvoice(repair.id);
          return { ...repair, hasInvoice: invoiceCheck.hasInvoice };
        } catch (error) {
          return { ...repair, hasInvoice: false };
        }
      })
    );
    
    return repairsWithInvoice;
  });
  const [msg, setMsg] = useState('');

  const approve = async (id: string) => {
    setMsg('');
    try {
      await maintenanceApi.approveRepair(id);
      mutate(key);
      setMsg(t('pages.maintenance.repairs.messages.repairApproved'));
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const reject = async (id: string) => {
    setMsg('');
    try {
      const c = window.prompt('Lý do từ chối?') || undefined;
      await maintenanceApi.rejectRepair(id, c);
      mutate(key);
      setMsg(t('pages.maintenance.repairs.messages.repairRejected'));
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const handlePassStandard = async (id: string) => {
    setMsg('');
    try {
      // Hoàn thành kiểm tra với kết quả PASS
      await maintenanceApi.completeRepairCheck(id, 'PASS');
      
      // Refresh danh sách
      mutate(key);
      mutate(['repairs', 'CHECKED']);
      
      setMsg(t('pages.maintenance.repairs.messages.checkCompleted'));
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const handleFailStandard = async (id: string) => {
    setMsg('');
    try {
      // Khi bấm "Không đạt chuẩn", lưu manager_comment để hiển thị 2 button mới
      await maintenanceApi.updateRepairStatus(id, 'CHECKING', 'Container không đạt chuẩn');
      
      // Refresh danh sách
      mutate(key);
      
      setMsg(t('pages.maintenance.repairs.messages.checkFailed'));
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const handleRepairable = async (id: string) => {
    setMsg('');
    try {
      // Tìm repair ticket để hiển thị trong popup
      const repairTicket = repairs?.find(r => r.id === id);
      if (repairTicket) {
        setSelectedRepairTicket(repairTicket);
        setIsRepairInvoiceModalOpen(true);
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi xử lý');
    }
  };

  const handleUnrepairable = async (id: string) => {
    setMsg('');
    try {
      // Chuyển cả repair ticket và service request sang REJECTED
      await maintenanceApi.completeRepairCheck(id, 'FAIL', 'Container không đạt chuẩn và không thể sửa chữa');
      
      // Refresh danh sách
      mutate(key);
      mutate(['repairs', 'REJECTED']);
      
      setMsg(t('pages.maintenance.repairs.messages.unrepairableCompleted'));
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const handleEditInvoice = async (id: string) => {
    setMsg('');
    try {
      // Tìm repair ticket để hiển thị trong popup sửa hóa đơn
      const repairTicket = repairs?.find(r => r.id === id);
      if (repairTicket) {
        setSelectedRepairTicket(repairTicket);
        setIsRepairInvoiceModalOpen(true);
      }
      setMsg(t('pages.maintenance.repairs.messages.invoiceModalOpened'));
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const handleRequestConfirmation = async (id: string) => {
    setMsg('');
    try {
      // Gọi API để gửi yêu cầu xác nhận
      const result = await maintenanceApi.sendConfirmationRequest(id);
      setMsg(result.message || t('pages.maintenance.repairs.messages.confirmationSent'));
      
      // Refresh danh sách để cập nhật trạng thái
      mutate(key);
      
      // Hiển thị thông báo lâu hơn để user đọc
      setTimeout(() => setMsg(''), 5000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const handleStartRepair = async (id: string) => {
    setMsg('');
    try {
      // Gọi API để tiến hành sửa chữa
      const result = await maintenanceApi.startRepair(id);
      setMsg(result.message || t('pages.maintenance.repairs.messages.repairStarted'));
      
      // Refresh danh sách để cập nhật trạng thái
      mutate(key);
      
      // Hiển thị thông báo
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const handleCompleteRepair = async (id: string) => {
    setMsg('');
    try {
      // Gọi API để hoàn thành sửa chữa
      const result = await maintenanceApi.completeRepair(id);
      setMsg(result.message || t('pages.maintenance.repairs.messages.repairCompleted'));
      
      // Refresh danh sách để cập nhật trạng thái
      mutate(key);
      
      // Hiển thị thông báo
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('common.error'));
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    mutate(key);
  };

  const handleRepairInvoiceSuccess = () => {
    // Refresh danh sách sau khi tạo hóa đơn thành công
    mutate(key);
    setMsg(t('pages.maintenance.repairs.messages.invoiceCreated'));
    setTimeout(() => setMsg(''), 3000);
  };

  const handleInvoiceCreated = (repairTicketId: string) => {
    // Cập nhật trạng thái hóa đơn cho phiếu vừa tạo trong cache
    mutate(key, (currentRepairs: any[] | undefined) => 
      currentRepairs?.map(repair => 
        repair.id === repairTicketId 
          ? { ...repair, hasInvoice: true }
          : repair
      ) || []
    );
    
    // Refresh lại để đảm bảo dữ liệu chính xác
    mutate(key);
  };

  const handleCloseRepairInvoiceModal = () => {
    setIsRepairInvoiceModalOpen(false);
    setSelectedRepairTicket(null);
  };

  return (
    <>
      <Header />
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">{t('pages.maintenance.repairs.title')}</h1>
            </div>
            <div className="header-actions">
            </div>
          </div>
        </div>

        <div className="search-filter-section modern-search" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <div className="filter-group" style={{marginLeft: '0'}}>
            <label className="filter-label">{t('pages.maintenance.repairs.filterByStatus')}</label>
            <select 
              value={filter} 
              onChange={e => handleFilterChange(e.target.value)}
              className="filter-select"
              style={{marginLeft: '0'}}
            >
              <option value="">{t('pages.maintenance.repairs.allStatuses')}</option>
              <option value="CHECKING">{t('pages.maintenance.repairs.statusChecking')}</option>
              <option value="PENDING_ACCEPT">{t('pages.maintenance.repairs.statusPendingAccept')}</option>
              <option value="REPAIRING">{t('pages.maintenance.repairs.statusRepairing')}</option>
              <option value="CHECKED">{t('pages.maintenance.repairs.statusChecked')}</option>
              <option value="REJECTED">{t('pages.maintenance.repairs.statusRejected')}</option>
            </select>
          </div>
          <div style={{marginLeft: 'auto'}}>
            <button 
              onClick={() => setIsPendingContainersModalOpen(true)}
              className="btn btn-outline pending-containers-btn"
              title={t('pages.maintenance.repairs.pendingContainersList')}
              style={{
                padding: '8px 16px',
                border: '1px solid #1e40af',
                borderRadius: '4px',
                background: 'white',
                color: '#1e40af',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📋 {t('pages.maintenance.repairs.pendingContainersList')}
            </button>
          </div>
        </div>

        <Card>
          <MessageDisplay message={msg} />

          <RepairTable
            repairs={repairs || []}
            onPassStandard={handlePassStandard}
            onFailStandard={handleFailStandard}
            onRepairable={handleRepairable}
            onUnrepairable={handleUnrepairable}
            onEditInvoice={handleEditInvoice}
            onRequestConfirmation={handleRequestConfirmation}
            onStartRepair={handleStartRepair}
            onCompleteRepair={handleCompleteRepair}
          />
        </Card>

                <PendingContainersModal 
          isOpen={isPendingContainersModalOpen} 
          onClose={() => setIsPendingContainersModalOpen(false)}
          onRepairCreated={() => mutate(key)}
        />

        {selectedRepairTicket && (
          <RepairInvoiceModal
            isOpen={isRepairInvoiceModalOpen}
            onClose={handleCloseRepairInvoiceModal}
            repairTicket={selectedRepairTicket}
            onSuccess={handleRepairInvoiceSuccess}
            onInvoiceCreated={handleInvoiceCreated}
          />
        )}
      </main>
    </>
  );
}


