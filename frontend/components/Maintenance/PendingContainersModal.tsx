import { useEffect, useState } from 'react';
import { maintenanceApi } from '@services/maintenance';
import { mutate } from 'swr';
import ContainerRepairModal from './ContainerRepairModal';
import PendingContainersModalContainer from './PendingContainersModalContainer';

interface PendingContainersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepairCreated?: () => void;
}

export default function PendingContainersModal({ isOpen, onClose, onRepairCreated }: PendingContainersModalProps) {
  // State quản lý danh sách container IMPORT đang chờ kiểm tra
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkResults, setCheckResults] = useState<{[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null}>({});
  const [isCreateRepairModalOpen, setIsCreateRepairModalOpen] = useState(false);
  const [selectedContainerForRepair, setSelectedContainerForRepair] = useState<any>(null);

  const fetchPendingContainers = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Lấy tất cả container có trạng thái GATE_IN (sẽ filter theo loại IMPORT ở frontend)
      const response = await fetch('/backend/gate/requests/search?status=GATE_IN&limit=100', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Lọc chỉ lấy container có loại IMPORT
      const importContainers = (data.data || []).filter((request: any) => {
        return request.type === 'IMPORT';
      });
      
      console.log('🔍 Total containers from API:', data.data?.length || 0);
      console.log('🔍 Import containers after filtering:', importContainers.length);
      console.log('🔍 Filtered containers:', importContainers);
      
      setRequests(importContainers);
      
    } catch (err: any) {
      console.error('Error fetching pending containers:', err);
      
      if (err.name === 'AbortError') {
        setError('Yêu cầu bị timeout. Vui lòng thử lại.');
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo backend server đang chạy.');
      } else if (err.message.includes('401')) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.message.includes('403')) {
        setError('Bạn không có quyền truy cập dữ liệu này.');
      } else if (err.message.includes('404')) {
        setError('API endpoint không tồn tại. Vui lòng liên hệ admin.');
      } else if (err.message.includes('500')) {
        setError('Lỗi server. Vui lòng thử lại sau.');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckContainer = async (requestId: string) => {
    try {
      // Cập nhật request status thành CHECKING trong database
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      // Cập nhật request status thành CHECKING
      const updateResponse = await fetch(`/backend/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'CHECKING' })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${updateResponse.status}: ${updateResponse.statusText}`);
      }

      // Loại bỏ container khỏi danh sách vì đã chuyển sang CHECKING
      setRequests(prev => prev.filter(req => req.id !== requestId));

      // Tạo phiếu sửa chữa cho container
      const container = requests.find(req => req.id === requestId);
      if (container) {
        const repairPayload = {
          code: `REP-${Date.now()}`,
          container_no: container.container_no || null,
          problem_description: 'Container đang được kiểm tra',
          estimated_cost: 0,
          items: []
        };

        try {
          const repairResult = await maintenanceApi.createRepair(repairPayload);
          if (repairResult) {
            console.log('Đã tạo phiếu sửa chữa:', repairResult);
            // Cập nhật trạng thái phiếu sửa chữa thành CHECKING
            try {
              await maintenanceApi.updateRepairStatus(repairResult.id, 'CHECKING', 'Container đang được kiểm tra');
              console.log('Đã cập nhật trạng thái phiếu sửa chữa thành CHECKING');
            } catch (statusErr) {
              console.error('Lỗi khi cập nhật trạng thái phiếu sửa chữa:', statusErr);
            }
            // Refresh danh sách phiếu sửa chữa
            mutate(['repairs', 'CHECKING']);
            
            // Thông báo cho trang Repairs refresh danh sách
            if (onRepairCreated) {
              onRepairCreated();
            }
          }
        } catch (repairErr) {
          console.error('Lỗi khi tạo phiếu sửa chữa:', repairErr);
          // Không throw error vì việc tạo phiếu sửa chữa không ảnh hưởng đến việc kiểm tra
        }
      }

      alert('Đã bắt đầu kiểm tra container. Trạng thái đã chuyển sang CHECKING và đã tạo phiếu sửa chữa.');
    } catch (err: any) {
      console.error('Error starting container check:', err);
      alert(`Lỗi khi bắt đầu kiểm tra container: ${err.message}`);
    }
  };

  const handleCheckResult = async (requestId: string, result: 'PASS' | 'FAIL') => {
    try {
      // Tìm container và phiếu sửa chữa
      const container = requests.find(req => req.id === requestId);
      if (!container) {
        alert('Không tìm thấy container');
        return;
      }

      // Tìm phiếu sửa chữa có trạng thái CHECKING
      const repairTickets = await maintenanceApi.listRepairs('CHECKING');
      const repairTicket = repairTickets.find(ticket => ticket.container_no === container.container_no);
      
      if (repairTicket) {
        // Hoàn thành kiểm tra phiếu sửa chữa
        await maintenanceApi.completeRepairCheck(repairTicket.id, result);
        
        // Cập nhật request status nếu cần
        if (result === 'PASS') {
          // Cập nhật request status thành CHECKED
          try {
            const token = localStorage.getItem('token');
            if (token) {
              await fetch(`/backend/requests/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'CHECKED' })
              });
            }
          } catch (error) {
            console.error('Lỗi khi cập nhật request status:', error);
          }
          
          setRequests(prev => prev.filter(req => req.id !== requestId));
          alert('Kết quả kiểm tra: Đạt chuẩn. Container đã được xóa khỏi danh sách chờ.');
        } else {
          setCheckResults(prev => ({
            ...prev,
            [requestId]: 'FAIL_WITH_OPTIONS'
          }));
        }
        
        // Refresh danh sách phiếu sửa chữa
        mutate(['repairs', 'CHECKING']);
        mutate(['repairs', 'CHECKED']);
        mutate(['repairs', 'REJECTED']);
      } else {
        // Nếu không tìm thấy phiếu sửa chữa, xử lý như cũ
        if (result === 'PASS') {
          setRequests(prev => prev.filter(req => req.id !== requestId));
          alert('Kết quả kiểm tra: Đạt chuẩn. Container đã được xóa khỏi danh sách chờ.');
        } else {
          setCheckResults(prev => ({
            ...prev,
            [requestId]: 'FAIL_WITH_OPTIONS'
          }));
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi xử lý kết quả kiểm tra:', error);
      alert(`Lỗi khi xử lý kết quả kiểm tra: ${error?.message || 'Không xác định'}`);
    }
  };

  const handleFailOption = async (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => {
    try {
      if (option === 'UNREPAIRABLE') {
        // Tìm container và phiếu sửa chữa
        const container = requests.find(req => req.id === requestId);
        if (!container) {
          alert('Không tìm thấy container');
          return;
        }

        // Tìm phiếu sửa chữa có trạng thái CHECKING
        const repairTickets = await maintenanceApi.listRepairs('CHECKING');
        const repairTicket = repairTickets.find(ticket => ticket.container_no === container.container_no);
        
        if (repairTicket) {
          // Hoàn thành kiểm tra với kết quả FAIL (REJECTED)
          await maintenanceApi.completeRepairCheck(repairTicket.id, 'FAIL', 'Container không đạt chuẩn');
          
          // Cập nhật request status thành REJECTED
          try {
            const token = localStorage.getItem('token');
            if (token) {
              await fetch(`/backend/requests/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'REJECTED' })
              });
            }
          } catch (error) {
            console.error('Lỗi khi cập nhật request status:', error);
          }
          
          // Refresh danh sách phiếu sửa chữa
          mutate(['repairs', 'CHECKING']);
          mutate(['repairs', 'REJECTED']);
        }

        const reason = 'Container không đạt chuẩn';
        setCheckResults(prev => ({
          ...prev,
          [requestId]: option
        }));
        setRequests(prev => prev.filter(req => req.id !== requestId));
        alert(`Kết quả kiểm tra: ${reason}. Container đã được xóa khỏi danh sách chờ.`);
      } else {
        const container = requests.find(req => req.id === requestId);
        
        const findEquipmentForContainer = async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
            }
            
            const response = await fetch(`/backend/maintenance/equipments?type=CONTAINER&code=${container?.container_no}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const equipments = await response.json();
              if (equipments.data && equipments.data.length > 0) {
                const equipment = equipments.data[0];
                setSelectedContainerForRepair({
                  ...container,
                  equipment_id: equipment.id,
                  equipment_code: equipment.code
                });
              } else {
                setSelectedContainerForRepair({
                  ...container,
                  equipment_id: '1',
                  equipment_code: container?.container_no || 'Unknown'
                });
              }
            } else {
              setSelectedContainerForRepair({
                ...container,
                equipment_id: '1',
                equipment_code: container?.container_no || 'Unknown'
              });
            }
          } catch (err) {
            console.error('Error finding equipment:', err);
            setSelectedContainerForRepair({
              ...container,
              equipment_id: '1',
              equipment_code: container?.container_no || 'Unknown'
            });
          }
          
          setIsCreateRepairModalOpen(true);
        };
        
        findEquipmentForContainer();
      }
    } catch (error: any) {
      console.error('Lỗi khi xử lý tùy chọn thất bại:', error);
      alert(`Lỗi khi xử lý tùy chọn thất bại: ${error?.message || 'Không xác định'}`);
    }
  };

  const handleCreateRepairForContainer = async (form: any) => {
    try {
      if (!form.problem_description || form.problem_description.trim() === '') {
        alert('Vui lòng nhập mô tả lỗi');
        return;
      }
      
      if (form.estimated_cost < 0) {
        alert('Chi phí dự toán không thể âm');
        return;
      }
      
      if (form.estimated_cost === 0) {
        const confirmZero = window.confirm('Chi phí dự toán là 0. Bạn có chắc chắn muốn tiếp tục?');
        if (!confirmZero) {
          return;
        }
      }
      
      const payload = {
        code: `REP-${Date.now()}`,
        container_no: selectedContainerForRepair?.container_no || null,
        problem_description: form.problem_description.trim(),
        estimated_cost: Number(form.estimated_cost) || 0,
        items: []
      };
      
      const result = await maintenanceApi.createRepair(payload);
      
      if (!result) {
        throw new Error('API không trả về dữ liệu');
      }
      
      // Cập nhật request status thành CHECKED
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`/backend/requests/${selectedContainerForRepair.id}/status`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'CHECKED' })
          });
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật request status:', error);
      }
      
      setRequests(prev => prev.filter(req => req.id !== selectedContainerForRepair.id));
      setCheckResults(prev => ({
        ...prev,
        [selectedContainerForRepair.id]: 'REPAIRABLE'
      }));
      
      setIsCreateRepairModalOpen(false);
      setSelectedContainerForRepair(null);
      
      mutate(['repairs', 'CHECKING']);
      
      alert('Đã tạo phiếu sửa chữa thành công cho container! Container đã được xóa khỏi danh sách chờ.');
      
    } catch (err: any) {
      console.error('Error creating repair:', err);
      
      let errorMessage = 'Lỗi khi tạo phiếu sửa chữa';
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 400) {
          errorMessage = `Lỗi dữ liệu: ${data?.message || 'Dữ liệu không hợp lệ'}`;
        } else if (status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (status === 403) {
          errorMessage = 'Bạn không có quyền tạo phiếu sửa chữa.';
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          errorMessage = `Lỗi server (${status}): ${data?.message || 'Không xác định'}`;
        }
      } else if (err.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else {
        errorMessage = `Lỗi: ${err.message}`;
      }
      
      alert(errorMessage);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingContainers();
    }
  }, [isOpen]);

  const handleRetry = () => {
    fetchPendingContainers();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <PendingContainersModalContainer
          loading={loading}
          error={error}
          requests={requests}
          checkResults={checkResults}
          onClose={onClose}
          onRetry={handleRetry}
          onCheckContainer={handleCheckContainer}
          onCheckResult={handleCheckResult}
          onFailOption={handleFailOption}
          title="Danh sách container IMPORT đang chờ (GATE_IN)"
        />
      </div>

      <ContainerRepairModal
        isOpen={isCreateRepairModalOpen}
        onClose={() => {
          setIsCreateRepairModalOpen(false);
          setSelectedContainerForRepair(null);
        }}
        onSubmit={handleCreateRepairForContainer}
        selectedContainer={selectedContainerForRepair}
      />
    </>
  );
}
