import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useState } from 'react';
import {
  PendingContainersModal,
  RepairTable,
  RepairPageHeader,
  MessageDisplay,
  RepairInvoiceModal
} from '@components/Maintenance';

export default function RepairsPage() {
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
      setMsg('Đã duyệt phiếu');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi duyệt');
    }
  };

  const reject = async (id: string) => {
    setMsg('');
    try {
      const c = window.prompt('Lý do từ chối?') || undefined;
      await maintenanceApi.rejectRepair(id, c);
      mutate(key);
      setMsg('Đã từ chối phiếu');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi từ chối');
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
      
      setMsg('Đã hoàn thành kiểm tra - Đạt chuẩn');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi hoàn thành kiểm tra');
    }
  };

  const handleFailStandard = async (id: string) => {
    setMsg('');
    try {
      // Khi bấm "Không đạt chuẩn", lưu manager_comment để hiển thị 2 button mới
      await maintenanceApi.updateRepairStatus(id, 'CHECKING', 'Container không đạt chuẩn');
      
      // Refresh danh sách
      mutate(key);
      
      setMsg('Container không đạt chuẩn - chọn option sửa chữa');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi xử lý');
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
      
      setMsg('Đã từ chối - Container không đạt chuẩn và không thể sửa chữa');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi xử lý');
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
      setMsg('Mở modal sửa hóa đơn');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi mở modal sửa hóa chữa');
    }
  };

  const handleRequestConfirmation = async (id: string) => {
    setMsg('');
    try {
      // Gọi API để gửi yêu cầu xác nhận
      const result = await maintenanceApi.sendConfirmationRequest(id);
      setMsg(result.message || 'Đã gửi yêu cầu xác nhận thành công');
      
      // Refresh danh sách để cập nhật trạng thái
      mutate(key);
      
      // Hiển thị thông báo lâu hơn để user đọc
      setTimeout(() => setMsg(''), 5000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi gửi yêu cầu xác nhận');
    }
  };

  const handleStartRepair = async (id: string) => {
    setMsg('');
    try {
      // Gọi API để tiến hành sửa chữa
      const result = await maintenanceApi.startRepair(id);
      setMsg(result.message || 'Đã tiến hành sửa chữa thành công');
      
      // Refresh danh sách để cập nhật trạng thái
      mutate(key);
      
      // Hiển thị thông báo
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi tiến hành sửa chữa');
    }
  };

  const handleCompleteRepair = async (id: string) => {
    setMsg('');
    try {
      // Gọi API để hoàn thành sửa chữa
      const result = await maintenanceApi.completeRepair(id);
      setMsg(result.message || 'Đã hoàn thành sửa chữa thành công');
      
      // Refresh danh sách để cập nhật trạng thái
      mutate(key);
      
      // Hiển thị thông báo
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Lỗi khi hoàn thành sửa chữa');
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    mutate(key);
  };

  const handleRepairInvoiceSuccess = () => {
    // Refresh danh sách sau khi tạo hóa đơn thành công
    mutate(key);
    setMsg('Đã tạo hóa đơn sửa chữa thành công');
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
      <main className="container repair-page">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">Danh sách phiếu sửa chữa</h1>
            </div>
            <div className="header-actions">
              <button 
                onClick={() => setIsPendingContainersModalOpen(true)}
                className="btn btn-outline pending-containers-btn"
                title="Danh sách container đang chờ"
              >
                📋 Danh sách container đang chờ
              </button>
            </div>
          </div>
        </div>

        <div className="search-filter-section modern-search">
          <div className="search-row">
            <div className="filter-group">
              <label className="filter-label">Lọc theo trạng thái:</label>
              <select 
                value={filter} 
                onChange={e => handleFilterChange(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả</option>
                <option value="CHECKING">Đang kiểm tra</option>
                <option value="PENDING_ACCEPT">Chờ chấp nhận</option>
                <option value="REPAIRING">Đang sửa chữa</option>
                <option value="CHECKED">Đã kiểm tra</option>
                <option value="REJECTED">Đã từ chối</option>
              </select>
            </div>
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


