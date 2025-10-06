import React from 'react';
import { useRouter } from 'next/router';
import Header from '@components/Header';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../hooks/useToastHook';
import { useRouteRefresh } from '../../hooks/useRouteRefresh';
import { CreateLowerRequestModal, type LowerRequestData } from '../Requests/components/CreateLowerRequestModal';
import { EditLowerRequestModal } from '../Requests/components/EditLowerRequestModal';
import { requestService } from '../../services/requests';
import { setupService } from '../../services/setupService';
import { api } from '../../services/api';

// Interface cho dữ liệu bảng
interface TableData {
  id: string;
  shippingLine: string; // Hãng tàu
  requestNumber: string; // Số yêu cầu
  containerNumber: string; // Số Cont
  containerType: string; // Loại Cont
  serviceType: string; // Loại dịch vụ
  status: string; // Trạng thái
  customer: string; // Khách hàng
  truckCompany: string; // Nhà xe
  truckNumber: string; // Số xe
  driverName: string; // Tên tài xế
  driverPhone: string; // SDT tài xế
  appointmentTime: string; // Thời gian hẹn
  actualInTime: string; // Giờ vào thực tế
  actualOutTime: string; // Giờ ra thực tế
  totalAmount: number; // Tổng tiền
  paymentStatus: string; // Trạng thái dịch vụ
  documents: string; // Chứng từ
  documentsCount?: number; // Số lượng chứng từ
  demDet: string; // Dem/Det
  notes: string; // Ghi chú
  rejectedReason?: string; // Lý do hủy
  isRepairRejected?: boolean; // Repair bị từ chối
}

export default function NewSubmenu() {
	const router = useRouter();
	const { t } = useTranslation();
	const { showSuccess, ToastContainer } = useToast();
	const [localSearch, setLocalSearch] = React.useState('');
	const [localType, setLocalType] = React.useState('all');
	const [localStatus, setLocalStatus] = React.useState('all');
	const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const routeRefreshKey = useRouteRefresh();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  // Documents modal states
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<{id: string, containerNo: string} | null>(null);
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError] = React.useState<string | null>(null);

  // Dữ liệu bảng từ database
  const [tableData, setTableData] = React.useState<TableData[]>([]);
  const [allTableData, setAllTableData] = React.useState<TableData[]>([]); // Lưu tất cả dữ liệu gốc
  
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState<number>(0);
  const [paymentRequestInfo, setPaymentRequestInfo] = React.useState<{id:string; requestNo:string; containerNo:string} | null>(null);
  const [paymentDetails, setPaymentDetails] = React.useState<{baseCost: number; repairCost: number; invoiceItems: any[]} | null>(null);
  
  // Update and Delete states
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editRequestData, setEditRequestData] = React.useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteRequestId, setDeleteRequestId] = React.useState<string | null>(null);
  
  // Cancel states
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelRequestId, setCancelRequestId] = React.useState<string | null>(null);
  const [cancelReason, setCancelReason] = React.useState<string>('');

  // View Reason states
  const [showReasonModal, setShowReasonModal] = React.useState(false);
  const [displayReason, setDisplayReason] = React.useState<string>('');

  // Force refresh when route changes to ensure fresh data
  React.useEffect(() => {
    if (router.isReady) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [router.pathname, router.isReady]);

  // Additional refresh when route changes (using custom hook)
  React.useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [routeRefreshKey]);

  // Fetch data when component mounts
  React.useEffect(() => {
    fetchImportRequests();
  }, [refreshTrigger]);

  // Effect để filter dữ liệu theo trạng thái và tìm kiếm
  React.useEffect(() => {
    console.log('🔍 LowerContainer Filter effect triggered:', { localStatus, localSearch, allTableDataCount: allTableData.length });
    
    // Chỉ filter khi có dữ liệu
    if (allTableData.length === 0) {
      console.log('🔍 No data to filter yet');
      return;
    }
    
    let filteredData = [...allTableData];

    // Filter theo trạng thái
    if (localStatus && localStatus !== 'all') {
      console.log('🔍 Filtering by status:', localStatus);
      filteredData = filteredData.filter(row => {
        const matches = row.status === localStatus;
        console.log(`🔍 Row ${row.containerNumber} status: ${row.status}, matches: ${matches}`);
        return matches;
      });
    }

    // Filter theo tìm kiếm
    if (localSearch && localSearch.trim()) {
      const searchTerm = localSearch.trim().toLowerCase();
      console.log('🔍 Filtering by search term:', searchTerm);
      filteredData = filteredData.filter(row => 
        row.containerNumber.toLowerCase().includes(searchTerm) ||
        row.requestNumber.toLowerCase().includes(searchTerm) ||
        row.customer.toLowerCase().includes(searchTerm) ||
        row.driverName.toLowerCase().includes(searchTerm) ||
        row.truckNumber.toLowerCase().includes(searchTerm)
      );
    }

    console.log('🔍 Filtered data count:', filteredData.length);
    setTableData(filteredData);
  }, [allTableData, localStatus, localSearch]);


  const handleCreateNew = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSubmit = async (data: LowerRequestData) => {
    // TODO: Implement submit logic
    console.log('Modal submitted with data:', data);
    showSuccess('Tạo yêu cầu hạ container thành công!');
    setIsModalOpen(false);
    
    // Refresh table to show new record
    await fetchImportRequests();
  };

  // Documents modal functions
  const openDocuments = async (row: TableData) => {
    try {
      setSelectedRequest({ id: row.id, containerNo: row.containerNumber });
      setIsDocsOpen(true);
      setDocsLoading(true);
      setDocsError(null);
      const res = await requestService.getFiles(row.id);
      if (res.data?.success) {
        setAttachments(res.data.data || res.data.attachments || []);
      } else {
        setAttachments([]);
        setDocsError(res.data?.message || 'Không thể tải danh sách chứng từ');
      }
    } catch (err: any) {
      setDocsError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải chứng từ');
      setAttachments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const closeDocuments = () => {
    setIsDocsOpen(false);
    setSelectedRequest(null);
    setAttachments([]);
    setDocsError(null);
  };

  // Function để mở modal chỉnh sửa
  const handleUpdateInfo = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      console.log('Loading request details:', requestId);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        showSuccess('🔐 Cần đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này');
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
        return;
      }
      
      // Lấy thông tin chi tiết của request
      const response = await requestService.getRequest(requestId);
      if (response.data.success) {
        const requestData = response.data.data;
        setEditRequestData(requestData);
        setShowEditModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching request details:', error);
      if (error.response?.status === 401) {
        showSuccess('🔐 Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        showSuccess('❌ Không thể tải thông tin', 'Có lỗi xảy ra khi tải thông tin yêu cầu');
      }
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Function để in phiếu EIR
  const handlePrintEIR = async (requestId: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(requestId));
      
      console.log('🔄 Đang tạo phiếu EIR cho request:', requestId);
      
      // Gọi API để tạo phiếu EIR
      const response = await api.post(`/gate/requests/${requestId}/generate-eir`, {}, {
        responseType: 'blob'
      });
      
      console.log('✅ API response received:', response.status);
      
      // Kiểm tra nếu response là JSON (lỗi) thay vì blob
      if (response.data instanceof Blob) {
        // Tạo blob và download file
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EIR_${requestId}_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSuccess(
          '📄 Phiếu EIR đã được tạo',
          'File EIR đã được tải xuống thành công.',
          5000
        );
      } else {
        // Nếu không phải blob, có thể là JSON error
        console.error('❌ Response không phải blob:', response.data);
        showSuccess(
          '❌ Lỗi khi tạo phiếu EIR',
          'Server trả về dữ liệu không đúng định dạng'
        );
      }
    } catch (error: any) {
      console.error('❌ Error generating EIR:', error);
      
      // Xử lý các loại lỗi khác nhau
      let errorMessage = 'Có lỗi xảy ra khi tạo phiếu EIR';
      
      if (error.response?.status === 400) {
        const serverMessage = error.response?.data?.message;
        if (serverMessage) {
          errorMessage = serverMessage;
        } else {
          errorMessage = 'Không thể tạo phiếu EIR. Vui lòng kiểm tra:\n' +
            '• Container phải đã thanh toán (Đã thanh toán)\n' +
            '• Container phải ở trạng thái GATE_OUT hoặc IN_YARD\n' +
            '• Hãng tàu phải có template EIR\n' +
            '• Template file phải tồn tại';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền tạo phiếu EIR.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy yêu cầu này.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      }
      
      showSuccess(
        '❌ Lỗi khi tạo phiếu EIR',
        errorMessage
      );
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Function để xử lý cập nhật yêu cầu
  const handleUpdateRequest = async (data: any) => {
    try {
      console.log('Modal callback with data:', data);
      
      // Modal đã tự cập nhật thông tin request, chỉ cần xử lý upload files nếu có
      if (data.documents && data.documents.length > 0) {
        console.log('Uploading files:', data.documents);
        try {
          await requestService.uploadFiles(editRequestData.id, data.documents);
          console.log('Files uploaded successfully');
          
          // Hiển thị thông báo thành công
          showSuccess(
            'Yêu cầu đã được cập nhật thành công!',
            `Thông tin yêu cầu và chứng từ đã được cập nhật\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`
          );
        } catch (uploadError: any) {
          console.error('Error uploading files:', uploadError);
          showSuccess(
            '⚠️ Cập nhật thành công nhưng có lỗi khi upload files', 
            'Thông tin đã được cập nhật nhưng files có thể chưa được upload: ' + (uploadError.response?.data?.message || uploadError.message)
          );
        }
      } else {
        // Hiển thị thông báo thành công
        showSuccess(
          'Yêu cầu đã được cập nhật thành công!',
          `Thông tin yêu cầu đã được cập nhật\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`
        );
      }
      
      // Refresh data after update để cập nhật số lượng chứng từ
      await fetchImportRequests();
      
    } catch (error: any) {
      console.error('Error in update callback:', error);
      showSuccess('❌ Có lỗi xảy ra', 'Không thể xử lý cập nhật: ' + (error.response?.data?.message || error.message));
    }
  };

  // Function để mở modal xóa
  const handleDeleteClick = (requestId: string) => {
    setDeleteRequestId(requestId);
    setShowDeleteModal(true);
  };

  // Function để xử lý xóa yêu cầu
  const handleDeleteRequest = async () => {
    if (!deleteRequestId) return;
    
    setProcessingIds(prev => new Set(prev).add(deleteRequestId));
    try {
      console.log('Deleting request:', deleteRequestId);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        showSuccess('🔐 Cần đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này');
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(deleteRequestId);
          return newSet;
        });
        setShowDeleteModal(false);
        return;
      }
      
      const response = await requestService.deleteRequest(deleteRequestId);
      if (response.data.success) {
        // Hiển thị thông báo thành công với toast notification
        showSuccess(
          '🗑️ Yêu cầu đã được xóa thành công!',
          `Yêu cầu đã được xóa khỏi hệ thống\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`
        );
        
        // Refresh data after deletion
        fetchImportRequests();
      } else {
        showSuccess('❌ Không thể xóa yêu cầu', response.data.message || 'Có lỗi xảy ra khi xóa yêu cầu');
      }
    } catch (error: any) {
      console.error('Error deleting request:', error);
      if (error.response?.status === 401) {
        showSuccess('🔐 Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        showSuccess('❌ Có lỗi xảy ra', 'Không thể xóa yêu cầu: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deleteRequestId);
        return newSet;
      });
      setShowDeleteModal(false);
      setDeleteRequestId(null);
    }
  };

  // Function để mở modal hủy
  const handleCancelClick = (requestId: string) => {
    setCancelRequestId(requestId);
    
    // Tìm request để kiểm tra xem có phải từ repair rejection không
    const request = tableData.find(r => r.id === requestId);
    console.log('Cancel click - request:', request);
    console.log('Cancel click - isRepairRejected:', request?.isRepairRejected);
    
    if (request?.isRepairRejected) {
      // Nếu là từ repair rejection, set lý do mặc định
      console.log('Setting default reason for repair rejection');
      setCancelReason('Container xấu không thể sửa chữa');
    } else {
      // Nếu không, reset lý do
      console.log('Resetting reason for normal cancel');
      setCancelReason('');
    }
    
    setShowCancelModal(true);
  };

  // Function để xử lý hủy yêu cầu
  const handleCancelRequest = async () => {
    if (!cancelRequestId) return;
    
    console.log('Cancel request - ID:', cancelRequestId);
    console.log('Cancel request - Reason:', cancelReason);
    
    setProcessingIds(prev => new Set(prev).add(cancelRequestId));
    try {
      console.log('Cancelling request:', cancelRequestId);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        showSuccess('🔐 Cần đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này');
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(cancelRequestId);
          return newSet;
        });
        setShowCancelModal(false);
        return;
      }
      
      // Gọi API để hủy request (cập nhật status thành REJECTED)
      const response = await requestService.cancelRequest(cancelRequestId, cancelReason);
      console.log('Cancel API response:', response);
      
      if (response.data.success) {
        // Hiển thị thông báo thành công với toast notification
        showSuccess(
          '❌ Yêu cầu đã được hủy thành công!',
          `Yêu cầu đã được đánh dấu là REJECTED\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`
        );
        
        // Refresh data after cancellation
        fetchImportRequests();
      } else {
        showSuccess('❌ Không thể hủy yêu cầu', response.data.message || 'Có lỗi xảy ra khi hủy yêu cầu');
      }
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        showSuccess('🔐 Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        showSuccess('❌ Có lỗi xảy ra', 'Không thể hủy yêu cầu: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(cancelRequestId);
        return newSet;
      });
      setShowCancelModal(false);
      setCancelRequestId(null);
      setCancelReason(''); // Reset lý do hủy
    }
  };

  // Function để xem lý do hủy
  const handleViewReasonClick = (reason: string) => {
    setDisplayReason(reason || 'Không có lý do được cung cấp');
    setShowReasonModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };


  // Map hiển thị trạng thái thân thiện - Updated to match LiftContainer style
  const renderStatusText = (status: string) => {
    if (!status) return '';
    const normalized = String(status).toUpperCase();
    switch (normalized) {
      case 'NEW_REQUEST':
        return '🆕 Thêm mới';
      case 'PENDING':
        return '⏳ Chờ xử lý';
      case 'SCHEDULED':
        return '📅 Đã lên lịch';
      case 'FORWARDED':
        return '📤 Đã chuyển tiếp';
      case 'CHECKED':
        return '✅ Chấp nhận';
      case 'GATE_IN':
        return '🟢 Đã vào cổng';
      case 'FORKLIFTING':
        return '🟡 Đang hạ container';
      case 'IN_YARD':
        return '✅ Đã hạ thành công';
      case 'GATE_OUT':
        return '🟣 Xe đã rời khỏi bãi';
      case 'REJECTED':
        return '⛔ Đã hủy';
      case 'COMPLETED':
        return '✅ Hoàn tất';
      default:
        return status;
    }
  };

  // Function để fetch import requests từ API
  const fetchImportRequests = async () => {
    setLoading(true);
    try {
      // Tính tổng phí loại "Hạ" để hiển thị đồng nhất với popup
      let lowerTotalLocal = 0;
      try {
        const res = await setupService.getPriceLists({ page: 1, limit: 1000 });
        const items = res.data?.data || [];
        lowerTotalLocal = items
          .filter((pl: any) => String(pl.type || '').toLowerCase() === 'hạ')
          .reduce((sum: number, pl: any) => sum + Number(pl.price || 0), 0);
      } catch {
        lowerTotalLocal = 0;
      }

      const response = await requestService.getRequests('IMPORT');
      
      if (response.data.success) {
        // Transform data từ API thành format của table
        // Lọc ra những container có trạng thái EMPTY_IN_YARD vì chúng đã được nâng lên và không thuộc về quy trình hạ container
        const filteredData = response.data.data.filter((request: any) => {
          return request.status !== 'EMPTY_IN_YARD';
        });
        
        const transformedData: TableData[] = await Promise.all(filteredData.map(async (request: any) => {
          // Lấy repair cost cho container này
          let repairCost = 0;
          try {
            const repairRes = await requestService.getRepairCost(request.container_no);
            if (repairRes.data?.success && repairRes.data?.data?.hasRepairTicket) {
              repairCost = repairRes.data.data.repairCost;
            }
          } catch (error) {
            console.log(`Không lấy được repair cost cho container ${request.container_no}:`, error);
          }

          // Tính tổng tiền bao gồm cả repair cost
          let totalAmount = 0;
          if (request.is_paid && request.invoices && request.invoices.length > 0) {
            // Chỉ lấy từ invoice khi đã thanh toán
            const invoice = request.invoices[0];
            totalAmount = Number(invoice.total_amount || 0);
          } else {
            // Sử dụng PriceList + repair cost cho các trường hợp khác (chưa thanh toán)
            totalAmount = (Number.isFinite(lowerTotalLocal) ? lowerTotalLocal : 0) + repairCost;
          }


          return {
            id: request.id,
            shippingLine: request.shipping_line?.name || '',
            requestNumber: request.request_no || '',
            containerNumber: request.container_no || '',
            containerType: request.container_type?.code || '',
            serviceType: 'Hạ cont', // Mặc định cho import request
            status: request.status || '',
            customer: request.lower_customer?.name || '',
            truckCompany: request.vehicle_company?.name || '',
            truckNumber: request.license_plate || '',
            driverName: request.driver_name || '',
            driverPhone: request.driver_phone || '',
            appointmentTime: request.appointment_time ? new Date(request.appointment_time).toLocaleString('vi-VN') : '',
            actualInTime: request.time_in ? new Date(request.time_in).toLocaleString('vi-VN') : '',
            actualOutTime: request.time_out ? new Date(request.time_out).toLocaleString('vi-VN') : '',
            totalAmount: totalAmount,
            paymentStatus: request.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán',
            documents: request.attachments?.map((att: any) => att.file_name).join(', ') || '',
            documentsCount: request.attachments?.length || 0,
            demDet: request.dem_det || '',
            notes: request.appointment_note || '',
            rejectedReason: request.rejected_reason || '',
            isRepairRejected: request.isRepairRejected || false
          };
        }));
        setAllTableData(transformedData); // Lưu tất cả dữ liệu gốc
        setTableData(transformedData); // Hiển thị ban đầu
      }
    } catch (error) {
      console.error('Error fetching import requests:', error);
      showSuccess('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          body { overflow-y: auto !important; overflow-x: hidden !important; -webkit-overflow-scrolling: touch; }
          .container.depot-requests { overflow: visible !important; padding-bottom: 2rem; }
        }

        .gate-search-section .search-row {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
        }
        .gate-search-section .search-section { flex: 0 0 320px; max-width: 320px; }
        .gate-search-section .filter-group { display: flex; gap: 4px; }
        .gate-search-section .filter-group select { height: 40px; min-width: 140px; }
        .gate-search-section .action-group { margin-left: 0; }
        .gate-search-section .action-group .btn { height: 40px; }
        @media (max-width: 1024px) {
          .gate-search-section .search-row { flex-wrap: wrap; }
          .gate-search-section .action-group { margin-left: 0; width: 100%; display: flex; justify-content: flex-end; }
        }

        .gate-table-container .table-scroll-container {
          scrollbar-width: auto !important;
          -ms-overflow-style: scrollbar !important;
        }
        .gate-table-container .table-scroll-container::-webkit-scrollbar {
          display: block !important;
          width: 8px !important;
          height: 8px !important;
        }
        .gate-table-container .table-scroll-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .gate-table-container .table-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .gate-table-container .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .table-empty.modern-empty {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-style: italic;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          white-space: nowrap;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn-light {
          background: #f8f9fa !important;
          color: #1e3a8a !important;
          border: 1px solid #d1d5db !important;
          font-weight: 500 !important;
        }

        .btn-light:hover {
          background: #e5e7eb !important;
          border-color: #9ca3af !important;
          color: #1e40af !important;
        }

        .btn-outline {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-outline:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }


        .payment-status {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .payment-status.paid {
          background: #d1fae5;
          color: #065f46;
        }

        .payment-status.unpaid {
          background: #fee2e2;
          color: #991b1b;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      <Header />
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">
                Tạo yêu cầu hạ container
              </h1>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="gate-search-section">
          <div className="search-row">
            <div className="search-section">
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo mã container"
                aria-label="Tìm kiếm theo mã container"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select
                aria-label="Trạng thái"
                className="filter-select"
                value={localStatus}
                onChange={(e) => setLocalStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="NEW_REQUEST">🆕 Thêm mới</option>
                <option value="PENDING">⏳ Chờ xử lý</option>
                <option value="SCHEDULED">📅 Đã lên lịch</option>
                <option value="FORWARDED">📤 Đã chuyển tiếp</option>
                <option value="CHECKED">✅ Chấp nhận</option>
                <option value="GATE_IN">🟢 Đã vào cổng</option>
                <option value="FORKLIFTING">🟡 Đang hạ container</option>
                <option value="IN_YARD">✅ Đã hạ thành công</option>
                <option value="GATE_OUT">🟣 Xe đã rời khỏi bãi</option>
                <option value="REJECTED">⛔ Đã hủy</option>
                <option value="COMPLETED">✅ Hoàn tất</option>
              </select>
            </div>
            <div className="action-group">
              <button 
                className="btn btn-success"
                onClick={handleCreateNew}
              >
                Tạo yêu cầu hạ container
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="gate-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : tableData.length === 0 ? (
            <div className="table-empty modern-empty">
              <div className="empty-icon">📦⬇️</div>
              <p>Chưa có yêu cầu hạ container nào</p>
              <small>Không có yêu cầu hạ container nào để xử lý</small>
            </div>
          ) : (
            <div className="table-scroll-container">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1800 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#0f172a' }}>
                    <th style={{...thStyle, minWidth: '100px'}}>Hãng tàu</th>
                    <th style={{...thStyle, minWidth: '150px'}}>Số yêu cầu</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Số Cont</th>
                    <th style={{...thStyle, minWidth: '100px'}}>Loại cont</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Loại dịch vụ</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Trạng thái</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Khách hàng</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Nhà xe</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Số xe</th>
                    <th style={{...thStyle, minWidth: '100px'}}>Tài xế</th>
                    <th style={{...thStyle, minWidth: '120px'}}>SDT Tài xế</th>
                    <th style={{...thStyle, minWidth: '160px'}}>Thời gian hẹn</th>
                    <th style={{...thStyle, minWidth: '160px'}}>Giờ vào thực tế</th>
                    <th style={{...thStyle, minWidth: '160px'}}>Giờ ra thực tế</th>
                    <th style={{...thStyle, minWidth: '120px'}}>Tổng tiền</th>
                    <th style={{...thStyle, minWidth: '150px'}}>Trạng thái thanh toán</th>
                    <th style={{...thStyle, minWidth: '100px'}}>Chứng từ</th>
                    <th style={{...thStyle, minWidth: '100px'}}>Dem/Det</th>
                    <th style={{...thStyle, minWidth: '150px'}}>Ghi chú</th>
                    <th style={{...thStyle, minWidth: '200px'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{row.shippingLine}</td>
                      <td style={tdStyle}>{row.requestNumber}</td>
                      <td style={tdStyle}>{row.containerNumber}</td>
                      <td style={tdStyle}>{row.containerType}</td>
                      <td style={tdStyle}>Hạ container</td>
                      <td style={tdStyle}>{renderStatusText(row.status)}</td>
                      <td style={tdStyle}>{row.customer}</td>
                      <td style={tdStyle}>{row.truckCompany}</td>
                      <td style={tdStyle}>{row.truckNumber}</td>
                      <td style={tdStyle}>{row.driverName}</td>
                      <td style={tdStyle}>{row.driverPhone}</td>
                      <td style={tdStyle}>{row.appointmentTime || '-'}</td>
                      <td style={tdStyle}>{row.actualInTime || '-'}</td>
                      <td style={tdStyle}>{row.actualOutTime || '-'}</td>
                      <td style={tdStyle}>
                        {typeof row.totalAmount === 'number' ? (
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>
                            {row.totalAmount.toLocaleString('vi-VN')} ₫
                          </span>
                        ) : '-'}
                      </td>
                      <td style={tdStyle}>
                        <span className={`payment-status ${row.paymentStatus === 'Đã thanh toán' ? 'paid' : 'unpaid'}`}>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button 
                          type="button" 
                          className="btn btn-light" 
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => openDocuments(row)}
                          title="Xem chứng từ"
                        >
                          {(row.documentsCount ?? 0)} file
                        </button>
                      </td>
                      <td style={tdStyle}>{row.demDet || '-'}</td>
                      <td style={tdStyle}>{row.notes || '-'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {/* Debug log cho tất cả request */}
                        {(() => {
                          console.log('Debug request:', {
                            requestNumber: row.requestNumber,
                            status: row.status,
                            isRepairRejected: row.isRepairRejected,
                            rejectedReason: row.rejectedReason
                          });
                          return null;
                        })()}
                        
                        {/* Button cập nhật chỉ hiển thị khi trạng thái là PENDING */}
                        {row.status === 'PENDING' && (
                          <button 
                            type="button" 
                            className="btn btn-primary" 
                            style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                            onClick={() => handleUpdateInfo(row.id)}
                            disabled={processingIds.has(row.id) || loading}
                            title="Cập nhật thông tin"
                          >
                            {processingIds.has(row.id) ? 'Đang xử lý...' : 'Cập nhật thông tin'}
                          </button>
                        )}
                        {/* Button hủy hiển thị khi trạng thái là PENDING hoặc khi repair bị từ chối (nhưng không phải REJECTED) */}
                        {(row.status === 'PENDING' || (row.isRepairRejected && row.status !== 'REJECTED')) && (
                          <button 
                            type="button" 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                            onClick={() => handleCancelClick(row.id)}
                            disabled={processingIds.has(row.id) || loading}
                            title="Hủy yêu cầu"
                          >
                            {processingIds.has(row.id) ? 'Đang xử lý...' : 'Hủy'}
                          </button>
                        )}
                        {/* Button xem lý do chỉ hiển thị khi trạng thái là REJECTED */}
                        {row.status === 'REJECTED' && (
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                            onClick={() => handleViewReasonClick(row.rejectedReason || '')}
                            title="Xem lý do hủy"
                          >
                            Xem lý do
                          </button>
                        )}
                        {/* Button In phiếu EIR CHỈ hiển thị khi đã thanh toán VÀ ở trạng thái GATE_OUT hoặc IN_YARD */}
                        {(row.paymentStatus === 'Đã thanh toán' && (row.status === 'GATE_OUT' || row.status === 'IN_YARD')) && (
                          <button 
                            type="button" 
                            className="btn btn-info" 
                            style={{ 
                              padding: '6px 10px', 
                              fontSize: 12, 
                              marginRight: 8,
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px'
                            }}
                            onClick={() => handlePrintEIR(row.id)}
                            disabled={processingIds.has(row.id) || loading}
                            title="In phiếu EIR"
                          >
                            {processingIds.has(row.id) ? 'Đang tạo...' : '📄 In phiếu EIR'}
                          </button>
                        )}
                        {(row.status === 'IN_YARD') && row.paymentStatus !== 'Đã thanh toán' && (
                          <button
                            type="button"
                            className="btn btn-success"
                            style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                            onClick={async () => {
                              try {
                                // Lấy PriceList cho dịch vụ hạ container
                                const priceListRes = await setupService.getPriceLists({ page: 1, limit: 1000 });
                                const priceListItems = priceListRes.data?.data || [];
                                const baseCost = priceListItems
                                  .filter((pl: any) => String(pl.type || '').toLowerCase() === 'hạ')
                                  .reduce((sum: number, pl: any) => sum + Number(pl.price || 0), 0);
                                
                                // Lấy repair cost cho container này
                                let repairCost = 0;
                                try {
                                  const repairRes = await requestService.getRepairCost(row.containerNumber);
                                  if (repairRes.data?.success && repairRes.data?.data?.hasRepairTicket) {
                                    repairCost = repairRes.data.data.repairCost;
                                  }
                                } catch (error) {
                                  console.log(`Không lấy được repair cost cho container ${row.containerNumber}:`, error);
                                }
                                
                                // Tạo items từ PriceList
                                const invoiceItems = priceListItems
                                  .filter((pl: any) => String(pl.type || '').toLowerCase() === 'hạ')
                                  .map((pl: any) => ({
                                    service_code: pl.serviceCode,
                                    description: pl.serviceName,
                                    unit_price: Number(pl.price || 0)
                                  }));
                                
                                // Thêm repair cost vào items nếu có
                                if (repairCost > 0) {
                                  invoiceItems.push({
                                    service_code: 'REPAIR',
                                    description: 'Chi phí sửa chữa container',
                                    unit_price: repairCost
                                  });
                                }
                                
                                const totalAmount = baseCost + repairCost;
                                
                                setPaymentAmount(totalAmount);
                                setPaymentRequestInfo({ id: row.id, requestNo: row.requestNumber, containerNo: row.containerNumber });
                                setPaymentDetails({
                                  baseCost: baseCost,
                                  repairCost: repairCost,
                                  invoiceItems: invoiceItems
                                });
                                setShowPaymentModal(true);
                              } catch (e) {
                                showSuccess('Không lấy được thông tin thanh toán', 'Vui lòng kiểm tra lại');
                              }
                            }}
                          >
                            Tạo yêu cầu thanh toán
                          </button>
                        )}
                        {/* Chỉ hiển thị nút Xóa khi trạng thái là PENDING (Thêm mới) */}
                        {row.status === 'NEW_REQUEST' && (
                          <button 
                            type="button" 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => handleDeleteClick(row.id)}
                            disabled={processingIds.has(row.id) || loading}
                            title="Xóa yêu cầu"
                          >
                            {processingIds.has(row.id) ? 'Đang xử lý...' : 'Xóa'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        <CreateLowerRequestModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />

        {/* Edit Modal */}
        <EditLowerRequestModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditRequestData(null);
          }}
          onSubmit={handleUpdateRequest}
          requestData={editRequestData}
        />

        {/* Documents Modal */}
        {isDocsOpen && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
            }}
            onClick={closeDocuments}
          >
            <div
              style={{ background: '#fff', borderRadius: 12, width: '720px', maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Chứng từ - {selectedRequest?.containerNo || ''}</h3>
                <button onClick={closeDocuments} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                {docsLoading ? (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
                ) : docsError ? (
                  <div style={{ color: '#ef4444' }}>{docsError}</div>
                ) : attachments.length === 0 ? (
                  <div style={{ color: '#64748b' }}>Không có chứng từ</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {attachments.map((f, idx) => (
                      <div key={f.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {f.file_type === 'image' ? (
                          <img src={f.storage_url} alt={f.file_name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        ) : (
                          <div style={{ width: 64, height: 64, border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>PDF</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{Math.round((f.file_size || 0) / 1024)} KB</div>
                          <a href={f.storage_url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Mở</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={closeDocuments}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              animation: 'modalSlideIn 0.2s ease-out'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px',
                color: '#ef4444'
              }}>
                ⚠️
              </div>
              
              <h3 style={{
                margin: '0 0 12px 0',
                color: '#1f2937',
                fontSize: '20px',
                fontWeight: '600',
                lineHeight: '1.2'
              }}>
                Xác nhận xóa yêu cầu
              </h3>
              
              <p style={{
                margin: '0 0 24px 0',
                color: '#6b7280',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Bạn có chắc chắn muốn xóa yêu cầu này?<br/>
                <strong style={{ color: '#ef4444' }}>Hành động này không thể hoàn tác.</strong>
              </p>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteRequestId(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '80px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                >
                  Hủy
                </button>
                
                <button
                  onClick={handleDeleteRequest}
                  disabled={processingIds.has(deleteRequestId || '')}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: processingIds.has(deleteRequestId || '') ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: processingIds.has(deleteRequestId || '') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '80px'
                  }}
                  onMouseOver={(e) => {
                    if (!processingIds.has(deleteRequestId || '')) {
                      e.currentTarget.style.background = '#dc2626';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!processingIds.has(deleteRequestId || '')) {
                      e.currentTarget.style.background = '#ef4444';
                    }
                  }}
                >
                  {processingIds.has(deleteRequestId || '') ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              animation: 'modalSlideIn 0.2s ease-out'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#fef3c7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px',
                color: '#f59e0b'
              }}>
                ⚠️
              </div>
              
              <h3 style={{
                margin: '0 0 12px 0',
                color: '#1f2937',
                fontSize: '20px',
                fontWeight: '600',
                lineHeight: '1.2'
              }}>
                Xác nhận hủy yêu cầu
              </h3>
              
              <p style={{
                margin: '0 0 16px 0',
                color: '#6b7280',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Bạn có chắc chắn muốn hủy yêu cầu này?<br/>
                <strong style={{ color: '#f59e0b' }}>Yêu cầu sẽ được đánh dấu là REJECTED.</strong>
              </p>
              
              {/* Input lý do hủy */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Lý do hủy <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy yêu cầu..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {!cancelReason || !cancelReason.trim() ? (
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: '#ef4444'
                  }}>
                    Vui lòng nhập lý do hủy
                  </p>
                ) : null}
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelRequestId(null);
                    setCancelReason('');
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '80px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                >
                  Không
                </button>
                
                <button
                  onClick={handleCancelRequest}
                  disabled={processingIds.has(cancelRequestId || '') || !cancelReason || !cancelReason.trim()}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: (processingIds.has(cancelRequestId || '') || !cancelReason || !cancelReason.trim()) ? '#9ca3af' : '#f59e0b',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (processingIds.has(cancelRequestId || '') || !cancelReason || !cancelReason.trim()) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '80px'
                  }}
                  onMouseOver={(e) => {
                    if (!processingIds.has(cancelRequestId || '') && cancelReason && cancelReason.trim()) {
                      e.currentTarget.style.background = '#d97706';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!processingIds.has(cancelRequestId || '') && cancelReason && cancelReason.trim()) {
                      e.currentTarget.style.background = '#f59e0b';
                    }
                  }}
                >
                  {processingIds.has(cancelRequestId || '') ? 'Đang hủy...' : 'Hủy yêu cầu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Reason Modal */}
        {showReasonModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center',
              animation: 'modalSlideIn 0.2s ease-out'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#fef2f2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px',
                color: '#ef4444'
              }}>
                📋
              </div>
              
              <h3 style={{
                margin: '0 0 16px 0',
                color: '#1f2937',
                fontSize: '20px',
                fontWeight: '600',
                lineHeight: '1.2'
              }}>
                Lý do hủy yêu cầu
              </h3>
              
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <p style={{
                  margin: '0',
                  color: '#374151',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {displayReason}
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    setShowReasonModal(false);
                    setDisplayReason('');
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '80px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {showPaymentModal && paymentRequestInfo && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              width: '92%',
              maxWidth: 520,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)'
            }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#111827', fontWeight: 700 }}>Xác nhận thanh toán</h3>
              <p style={{ margin: '8px 0 16px', color: '#6b7280' }}>
                Yêu cầu {paymentRequestInfo.requestNo} - Cont {paymentRequestInfo.containerNo}
              </p>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, marginBottom: 12 }}>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>Tổng phí thanh toán</span>
                  <strong style={{ color: '#dc2626' }}>{paymentAmount.toLocaleString('vi-VN')} ₫</strong>
                </div>
                
                {/* Chi tiết từng mục dịch vụ */}
                <div style={{ 
                  padding: '12px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Chi tiết dịch vụ
                  </div>
                  
                  {/* Base services */}
                  {paymentDetails && paymentDetails.baseCost > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                        Dịch vụ hạ container
                      </div>
                      {paymentDetails.invoiceItems
                        .filter((item: any) => item.service_code !== 'REPAIR')
                        .map((item: any, index: number) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '12px',
                            padding: '2px 0',
                            color: '#374151'
                          }}>
                            <span>{item.service_code} - {item.description}</span>
                            <span>{Number(item.unit_price || 0).toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ))}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '13px',
                        fontWeight: '600',
                        padding: '4px 0',
                        borderTop: '1px solid #f3f4f6',
                        marginTop: '4px',
                        color: '#374151'
                      }}>
                        <span>Tổng dịch vụ hạ</span>
                        <span>{paymentDetails.baseCost.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Repair services */}
                  {paymentDetails && paymentDetails.repairCost > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                        Chi phí sửa chữa
                      </div>
                      {paymentDetails.invoiceItems
                        .filter((item: any) => item.service_code === 'REPAIR')
                        .map((item: any, index: number) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '12px',
                            padding: '2px 0',
                            color: '#374151'
                          }}>
                            <span>{item.description}</span>
                            <span>{Number(item.unit_price || 0).toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ))}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '13px',
                        fontWeight: '600',
                        padding: '4px 0',
                        borderTop: '1px solid #f3f4f6',
                        marginTop: '4px',
                        color: '#dc2626'
                      }}>
                        <span>Tổng chi phí sửa chữa</span>
                        <span>{paymentDetails.repairCost.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Hiển thị thông báo nếu không có repair cost */}
                  {paymentDetails && paymentDetails.repairCost === 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                        Chi phí sửa chữa
                      </div>
                      <div style={{ 
                        fontSize: '12px',
                        padding: '2px 0',
                        color: '#9ca3af',
                        fontStyle: 'italic'
                      }}>
                        Không có chi phí sửa chữa
                      </div>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '14px',
                    fontWeight: '700',
                    padding: '8px 0',
                    borderTop: '2px solid #e5e7eb',
                    marginTop: '8px',
                    color: '#1e293b'
                  }}>
                    <span>TỔNG CỘNG</span>
                    <span>{paymentAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => { setShowPaymentModal(false); setPaymentRequestInfo(null); setPaymentDetails(null); }}
                  style={{ padding: '10px 16px' }}
                >Hủy</button>
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      if (paymentRequestInfo?.id && paymentDetails) {
                        // Tạo PDF tổng phí thanh toán
                        const jsPDF = (await import('jspdf')).default;
                        const doc = new jsPDF();
                        
                        // Thiết lập font
                        doc.setFont('helvetica', 'normal');
                        
                        // Khung viền trang
                        doc.setLineWidth(0.5);
                        doc.rect(10, 10, 190, 277);
                        
                        // Header với background
                        doc.setFillColor(240, 240, 240);
                        doc.rect(15, 15, 180, 25, 'F');
                        doc.setFontSize(18);
                        doc.setFont('helvetica', 'bold');
                        doc.text('TONG PHI THANH TOAN', 105, 32, { align: 'center' });
                        
                        // Thông tin cơ bản với khung
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(11);
                        let yPos = 55;
                        
                        // Khung thông tin
                        doc.setLineWidth(0.3);
                        doc.rect(15, yPos - 5, 180, 45);
                        
                        doc.setFont('helvetica', 'bold');
                        doc.text('Thong tin yeu cau:', 20, yPos);
                        
                        doc.setFont('helvetica', 'normal');
                        yPos += 10;
                        doc.text(`• So yeu cau: ${paymentRequestInfo.requestNo}`, 25, yPos);
                        yPos += 8;
                        doc.text(`• Container: ${paymentRequestInfo.containerNo}`, 25, yPos);
                        yPos += 8;
                        doc.text('• Loai dich vu: Ha container', 25, yPos);
                        yPos += 8;
                        doc.text(`• Ngay tao: ${new Date().toLocaleDateString('vi-VN')}`, 25, yPos);
                        
                        // Bảng dịch vụ
                        yPos = 125;
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(12);
                        doc.text('CHI TIET DICH VU', 20, yPos);
                        
                        yPos += 10;
                        
                        // Header bảng với background
                        doc.setFillColor(220, 220, 220);
                        doc.rect(15, yPos - 3, 180, 12, 'F');
                        doc.setLineWidth(0.3);
                        doc.rect(15, yPos - 3, 180, 12);
                        
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(10);
                        doc.text('STT', 20, yPos + 5);
                        doc.text('Dich vu', 45, yPos + 5);
                        doc.text('Don gia', 160, yPos + 5);
                        
                        // Đường kẻ dọc header
                        doc.line(35, yPos - 3, 35, yPos + 9);
                        doc.line(150, yPos - 3, 150, yPos + 9);
                        
                        yPos += 12;
                        
                        // Nội dung bảng
                        doc.setFont('helvetica', 'normal');
                        paymentDetails.invoiceItems.forEach((item: any, index: number) => {
                          // Khung dòng
                          doc.rect(15, yPos - 3, 180, 12);
                          
                          // Chuyển đổi tên dịch vụ sang tiếng Việt không dấu
                          const removeVietnameseTones = (str: string) => {
                            return str
                              .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
                              .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
                              .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
                              .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
                              .replace(/[ìíịỉĩ]/g, 'i')
                              .replace(/[ÌÍỊỈĨ]/g, 'I')
                              .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
                              .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
                              .replace(/[ùúụủũưừứựửữ]/g, 'u')
                              .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
                              .replace(/[ỳýỵỷỹ]/g, 'y')
                              .replace(/[ỲÝỴỶỸ]/g, 'Y')
                              .replace(/đ/g, 'd')
                              .replace(/[ôộốồỗổ]/g, 'o')
                              .replace(/[ÔỐỘỒỔỖ]/g, 'O')
                              .replace(/[ơờợởỡ]/g, 'o')
                              .replace(/[ƠỜỢỞỠ]/g, 'O')
                              .replace(/Đ/g, 'D');
                          };
                          
                          let serviceName = removeVietnameseTones(item.description);
                          
                          doc.text(`${index + 1}`, 20, yPos + 5);
                          doc.text(serviceName, 45, yPos + 5);
                          doc.text(`${Number(item.unit_price || 0).toLocaleString('vi-VN')} VND`, 160, yPos + 5);
                          
                          // Đường kẻ dọc
                          doc.line(35, yPos - 3, 35, yPos + 9);
                          doc.line(150, yPos - 3, 150, yPos + 9);
                          
                          yPos += 12;
                        });
                        
                        // Tổng cộng với background
                        yPos += 10;
                        doc.setFillColor(245, 245, 245);
                        doc.rect(15, yPos - 5, 180, 20, 'F');
                        doc.setLineWidth(0.5);
                        doc.rect(15, yPos - 5, 180, 20);
                        
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(14);
                        doc.text('TONG PHI THANH TOAN:', 20, yPos + 5);
                        doc.text(`${paymentAmount.toLocaleString('vi-VN')} VND`, 175, yPos + 5, { align: 'right' });
                        
                        // Footer
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(8);
                        doc.text('Tai lieu duoc tao tu dong tu he thong quan ly depot', 105, 270, { align: 'center' });
                        
                        // Tự động tải xuống PDF
                        doc.save(`Tong_phi_thanh_toan_${paymentRequestInfo.requestNo}_${paymentRequestInfo.containerNo}.pdf`);
                      }
                    } catch (e) { 
                      console.error(e); 
                      showSuccess('Không thể tạo file', 'Vui lòng thử lại sau'); 
                    }
                  }}
                  style={{ padding: '10px 16px' }}
                >Xuất file</button>
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    // Cập nhật UI: đánh dấu đã thanh toán, đóng popup, giữ nguyên màn hình
                    try {
                      if (paymentRequestInfo?.id) {
                        await requestService.markPaid(paymentRequestInfo.id);
                      }
                      setShowPaymentModal(false);
                      if (paymentRequestInfo) {
                        setTableData(prev => prev.map(r => r.id === paymentRequestInfo.id ? { ...r, paymentStatus: 'Đã thanh toán' } : r));
                      }
                      setPaymentRequestInfo(null);
                      setPaymentDetails(null);
                      showSuccess('Thanh toán thành công', 'Yêu cầu đã xuất hiện trong trang hóa đơn');
                    } catch (e:any) {
                      showSuccess('Không thể xác nhận thanh toán', e?.response?.data?.message || 'Lỗi không xác định');
                    }
                  }}
                  style={{ padding: '10px 16px' }}
                >Xác nhận thanh toán</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer />
      </main>
    </>
  );
}// Styles cho table cells
const thStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  textAlign: 'left',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  padding: '12px 16px',
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#0f172a',
  verticalAlign: 'top',
  background: 'white',
  borderTop: '1px solid #f1f5f9',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

