import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';
import { requestService } from '../../../services/requests';
import { setupService } from '../../../services/setupService';
import { api } from '../../../services/api';
import { EditLiftRequestModal } from './EditLiftRequestModal';

interface ExportRequestProps {
	localSearch: string;
	setLocalSearch: (search: string) => void;
	localType: string;
	setLocalType: (type: string) => void;
	localStatus: string;
	setLocalStatus: (status: string) => void;
	refreshTrigger?: number;
	onCreateRequest?: () => void;
	isReject?: boolean; // Thêm prop để hỗ trợ chế độ "Hủy" thay vì "Xóa"
}

export const ExportRequest: React.FC<ExportRequestProps> = ({
	localSearch,
	setLocalSearch,
	localType,
	setLocalType,
	localStatus,
	setLocalStatus,
	refreshTrigger,
	onCreateRequest,
	isReject = false
}) => {
	const { t } = useTranslation();
	const { showSuccess, showError, ToastContainer } = useToast();

    // Kiểu dữ liệu cho 1 dòng yêu cầu nâng container
    type LiftRequestRow = {
        id: string;
        shippingLine: string;
        requestNo: string;
        containerNo: string;
        containerType: string;
        bookingBill: string;
        serviceType: string; // mặc định "Nâng container"
        status: string;
        customer: string;
        transportCompany: string; // Nhà xe
        vehicleNumber: string; // Số xe
        driverName: string; // Tài xế
        driverPhone: string; // SDT Tài xế
        appointmentTime?: string; // Thời gian hẹn
        timeIn?: string; // Giờ vào thực tế
        timeOut?: string; // Giờ ra thực tế
        totalAmount?: number; // Tổng tiền
        paymentStatus?: string; // Trạng thái thanh toán
        documentsCount?: number; // Số chứng từ
        notes?: string; // Ghi chú
        reuseStatus?: boolean; // Trạng thái reuse
    };

    // Dữ liệu thực tế từ API (khởi tạo rỗng)
    const [rows, setRows] = React.useState<LiftRequestRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [deleteRequestId, setDeleteRequestId] = React.useState<string | null>(null);
    // State cho chế độ hủy yêu cầu
    const [showCancelModal, setShowCancelModal] = React.useState(false);
    const [cancelRequestId, setCancelRequestId] = React.useState<string | null>(null);
    const [cancelReason, setCancelReason] = React.useState<string>('');
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [editRequestData, setEditRequestData] = React.useState<any>(null);
    const [showMoveToGateModal, setShowMoveToGateModal] = React.useState(false);
    const [moveToGateRequestId, setMoveToGateRequestId] = React.useState<string | null>(null);
    const [moveToGateRequestInfo, setMoveToGateRequestInfo] = React.useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = React.useState(false);
    const [paymentAmount, setPaymentAmount] = React.useState<number>(0);
    const [paymentRequestInfo, setPaymentRequestInfo] = React.useState<{id:string; requestNo:string; containerNo:string} | null>(null);
    const [currentSealCost, setCurrentSealCost] = React.useState<number>(0);
    
    // State để lưu seal cost cho mỗi request
    const [sealCosts, setSealCosts] = React.useState<Record<string, number>>({});
    const handleMoveToGateConfirm = () => { setShowMoveToGateModal(false); };

    // Function để tính tổng tiền bao gồm seal cost
    const getTotalAmountWithSeal = (row: LiftRequestRow) => {
        const baseAmount = row.totalAmount || 0;
        const sealCost = sealCosts[row.id] || 0;
        return baseAmount + sealCost;
    };

    // Function để lấy seal cost cho một request
    const fetchSealCost = async (requestId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/backend/requests/${requestId}/seal-cost`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.sealCost) {
                    setSealCosts(prev => ({
                        ...prev,
                        [requestId]: Number(data.data.sealCost)
                    }));
                }
            }
        } catch (error) {
            console.error('Lỗi khi lấy seal cost:', error);
        }
    };

    // Function để hiển thị trạng thái
    const statusLabel = (status: string) => {
        switch (status) {
            case 'NEW_REQUEST':
                return '🆕 Thêm mới';
            case 'GATE_IN':
                return '🟢 Đã cho phép vào';
            case 'FORKLIFTING':
                return '🟡 Đang nâng hạ';
            case 'DONE_LIFTING':
                return '✅ Nâng thành công';
            case 'IN_CAR':
                return '✅ Nâng thành công';
            case 'GATE_OUT':
                return '🟣 Đã cho phép ra';
            case 'GATE_REJECTED':
                return '⛔ Đã từ chối';
            default:
                return status;
        }
    };

    // Function để fetch requests từ API
    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Tính tổng phí loại "Nâng" để hiển thị đồng nhất với popup
            let liftTotalLocal = 0;
            try {
                const res = await setupService.getPriceLists({ page: 1, limit: 1000 });
                const items = res.data?.data || [];
                liftTotalLocal = items
                    .filter((pl: any) => String(pl.type || '').toLowerCase() === 'nâng')
                    .reduce((sum: number, pl: any) => sum + Number(pl.price || 0), 0);
            } catch {
                liftTotalLocal = 0;
            }

            const response = await requestService.getRequests('EXPORT');
            if (response.data.success) {
                // Transform data từ API thành format của table
                // Debug log để kiểm tra API response
                const transformedData = response.data.data.map((request: any) => {
                    return {
                        id: request.id,
                        shippingLine: request.shipping_line?.name || '',
                        requestNo: request.request_no || '',
                        containerNo: request.container_no || '',
                        containerType: request.container_type?.code || '',
                        bookingBill: request.booking_bill || '',
                        serviceType: 'Nâng container',
                        status: request.status,
                        customer: request.customer?.name || '',
                        transportCompany: request.vehicle_company?.name || '',
                        vehicleNumber: request.license_plate || '',
                        driverName: request.driver_name || '',
                        driverPhone: request.driver_phone || '',
                        appointmentTime: request.appointment_time ? new Date(request.appointment_time).toLocaleString('vi-VN') : '',
                        timeIn: request.time_in ? new Date(request.time_in).toLocaleString('vi-VN') : '',
                        timeOut: request.time_out ? new Date(request.time_out).toLocaleString('vi-VN') : '',
                        totalAmount: Number.isFinite(liftTotalLocal) ? liftTotalLocal : 0,
                        paymentStatus: request.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán',
                        documentsCount: request.attachments?.length || 0,
                        notes: request.appointment_note || '',
                        reuseStatus: request.reuse_status || false
                    };
                });
                
                // Sắp xếp dữ liệu: record mới lên trên, record cũ xuống dưới
                const sortedData = transformedData.sort((a: LiftRequestRow, b: LiftRequestRow) => {
                    // Ưu tiên sắp xếp theo requestNo giảm dần (mới nhất lên trên)
                    if (a.requestNo && b.requestNo) {
                        return b.requestNo.localeCompare(a.requestNo);
                    }
                    
                    // Fallback: sắp xếp theo id giảm dần
                    return b.id.localeCompare(a.id);
                });
                
                setRows(sortedData);
            }
        } catch (error) {
            console.error('Error fetching import requests:', error);
        } finally {
            setLoading(false);
        }
    };

    // Effect để fetch data khi component mount
    React.useEffect(() => {
        fetchRequests();
    }, []);

    // Effect để fetch seal cost cho tất cả requests
    React.useEffect(() => {
        if (rows.length > 0) {
            rows.forEach(row => {
                if (!sealCosts[row.id]) {
                    fetchSealCost(row.id);
                }
            });
        }
    }, [rows]);

    // Effect để refresh data khi refreshTrigger thay đổi
    React.useEffect(() => {
        if (refreshTrigger) {
            fetchRequests();
        }
    }, [refreshTrigger]);

    // State để lưu dữ liệu đã filter
    const [filteredRows, setFilteredRows] = React.useState<LiftRequestRow[]>([]);

    // Effect để filter dữ liệu theo status và search
    React.useEffect(() => {
        let filtered = [...rows];

        // Filter theo status
        if (localStatus && localStatus !== 'all') {
            if (localStatus === 'DONE_LIFTING_OR_IN_CAR') {
                // Gộp cả DONE_LIFTING và IN_CAR thành một trạng thái "Nâng thành công"
                filtered = filtered.filter(row => row.status === 'DONE_LIFTING' || row.status === 'IN_CAR');
            } else {
                filtered = filtered.filter(row => row.status === localStatus);
            }
        }

        // Filter theo search
        if (localSearch && localSearch.trim()) {
            const searchTerm = localSearch.trim().toLowerCase();
            filtered = filtered.filter(row => 
                row.containerNo.toLowerCase().includes(searchTerm) ||
                row.requestNo.toLowerCase().includes(searchTerm) ||
                row.customer.toLowerCase().includes(searchTerm) ||
                row.driverName.toLowerCase().includes(searchTerm) ||
                row.vehicleNumber.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredRows(filtered);
    }, [rows, localStatus, localSearch]);

    // Function để mở modal chỉnh sửa
    const handleUpdateClick = async (requestId: string) => {
        setProcessingIds(prev => new Set(prev).add(requestId));
        try {
            console.log('Loading request details:', requestId);
            
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                showError('🔐 Cần đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này', 3000);
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
                showError('🔐 Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục', 4000);
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                showError('❌ Có lỗi xảy ra', 'Không thể tải thông tin yêu cầu: ' + (error.response?.data?.message || error.message), 4000);
            }
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    // Bỏ logic chuyển đến cổng vì yêu cầu mới tạo sẽ tự hiển thị ở cổng

    // Function để xử lý cập nhật yêu cầu
    const handleUpdateRequest = async (data: any) => {
        try {
            // Hiển thị thông báo thành công với toast notification
            showSuccess(
                'Yêu cầu đã được cập nhật thành công!',
                `Thông tin yêu cầu đã được cập nhật\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`,
                4000
            );
            
            // Refresh data after update
            fetchRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            showError('❌ Có lỗi xảy ra', 'Không thể cập nhật thông tin yêu cầu', 3000);
        }
    };

    // Function để in phiếu EIR
    const handlePrintEIR = async (requestId: string) => {
        try {
            setProcessingIds(prev => new Set(prev).add(requestId));
            
            // Gọi API để tạo phiếu EIR
            const response = await api.post(`/gate/requests/${requestId}/generate-eir`, {}, {
                responseType: 'blob'
            });
            
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
        } catch (error: any) {
            console.error('Error generating EIR:', error);
            showError(
                '❌ Lỗi khi tạo phiếu EIR',
                error.response?.data?.message || error.message
            );
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    // Function để mở modal xóa
    const handleDeleteClick = (requestId: string) => {
        setDeleteRequestId(requestId);
        setShowDeleteModal(true);
    };

    // Function để toggle reuse status
    const handleToggleReuse = async (requestId: string, newReuseStatus: boolean) => {
        try {
            // Update local state immediately for better UX
            setRows(prevRows => 
                prevRows.map(row => 
                    row.id === requestId 
                        ? { ...row, reuseStatus: newReuseStatus }
                        : row
                )
            );

            // Call API to update reuse status
            const response = await requestService.updateReuseStatus(requestId, newReuseStatus);
            
            showSuccess(
                'Cập nhật trạng thái reuse thành công!',
                `Trạng thái đã được ${newReuseStatus ? 'bật' : 'tắt'} reuse`,
                2000
            );
        } catch (error: any) {
            console.error('Error toggling reuse status:', error);
            showError(
                '❌ Không thể cập nhật trạng thái reuse',
                error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật',
                3000
            );
            
            // Revert local state on error
            setRows(prevRows => 
                prevRows.map(row => 
                    row.id === requestId 
                        ? { ...row, reuseStatus: !newReuseStatus }
                        : row
                )
            );
        }
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
                showError('🔐 Cần đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này', 3000);
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
                    `Yêu cầu đã được xóa khỏi hệ thống\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`,
                    4000
                );
                
                // Refresh data after deletion
                fetchRequests();
            } else {
                showError('❌ Không thể xóa yêu cầu', response.data.message || 'Có lỗi xảy ra khi xóa yêu cầu', 4000);
            }
        } catch (error: any) {
            console.error('Error deleting request:', error);
            if (error.response?.status === 401) {
                showError('🔐 Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục', 4000);
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                showError('❌ Có lỗi xảy ra', 'Không thể xóa yêu cầu: ' + (error.response?.data?.message || error.message), 4000);
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

    // Function để mở modal hủy (chỉ khi isReject = true)
    const handleCancelClick = (requestId: string) => {
        setCancelRequestId(requestId);
        setCancelReason(''); // Reset lý do hủy
        setShowCancelModal(true);
    };

    // Function để xử lý hủy yêu cầu
    const handleCancelRequest = async () => {
        if (!cancelRequestId) return;
        
        setProcessingIds(prev => new Set(prev).add(cancelRequestId));
        try {
            console.log('Cancelling request:', cancelRequestId);
            console.log('Cancel reason:', cancelReason);
            
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                showError('🔐 Cần đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này', 3000);
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
                    `Yêu cầu đã được đánh dấu là REJECTED\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`,
                    4000
                );
                
                // Refresh data after cancellation
                fetchRequests();
            } else {
                showError('❌ Không thể hủy yêu cầu', response.data.message || 'Có lỗi xảy ra khi hủy yêu cầu', 4000);
            }
        } catch (error: any) {
            console.error('Error cancelling request:', error);
            if (error.response?.status === 401) {
                showError('🔐 Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục', 4000);
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                showError('❌ Có lỗi xảy ra', 'Không thể hủy yêu cầu: ' + (error.response?.data?.message || error.message), 4000);
            }
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(cancelRequestId);
                return newSet;
            });
            setShowCancelModal(false);
            setCancelRequestId(null);
            setCancelReason('');
        }
    };


	return (
		<>
			<style>{`
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
			`}</style>
			<style>{`
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
			`}</style>
			<div className="gate-search-section">
				<div className="search-row">
					<div className="search-section">
						<input
							type="text"
							className="search-input"
							placeholder={t('pages.requests.searchPlaceholder')}
							aria-label={t('pages.requests.searchPlaceholder')}
							value={localSearch}
							onChange={(e) => setLocalSearch(e.target.value)}
						/>
					</div>
					<div className="filter-group">
						<select
							aria-label={t('pages.requests.statusLabel')}
							className="filter-select"
							value={localStatus}
							onChange={(e) => setLocalStatus(e.target.value)}
						>
							<option value="all">Tất cả trạng thái</option>
							<option value="NEW_REQUEST">🆕 Thêm mới</option>
							<option value="GATE_IN">🟢 Đã cho phép vào</option>
							<option value="FORKLIFTING">🟡 Đang nâng hạ</option>
							<option value="DONE_LIFTING_OR_IN_CAR">✅ Nâng thành công</option>
							<option value="GATE_OUT">🟣 Đã cho phép ra</option>
							<option value="GATE_REJECTED">⛔ Đã từ chối</option>
						</select>
					</div>
					{onCreateRequest && (
						<div className="action-group">
							<button 
								className="btn btn-success"
								onClick={onCreateRequest}
							>
								Tạo yêu cầu nâng container
							</button>
						</div>
					)}
				</div>
			</div>

            <div className="gate-table-container">
                {filteredRows.length === 0 ? (
                    <div className="table-empty modern-empty">
                        <div className="empty-icon">📦⬆️</div>
                        <p>{rows.length === 0 ? 'Chưa có yêu cầu nâng container nào' : 'Không tìm thấy yêu cầu phù hợp'}</p>
                        <small>Không có yêu cầu nâng container nào để xử lý</small>
                    </div>
                ) : (
                    <div className="table-scroll-container">
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1800 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', color: '#0f172a' }}>
                                    <th style={{...thStyle, minWidth: '100px'}} data-column="shipping-line">🚢 Hãng tàu</th>
                                    <th style={{...thStyle, minWidth: '150px'}} data-column="request-no">📋 Số yêu cầu</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="container">📦 Số Cont</th>
                                    <th style={{...thStyle, minWidth: '100px'}} data-column="container-type">🏷️ Loại cont</th>
                                    <th style={{...thStyle, minWidth: '140px'}} data-column="booking-bill">📑 Số Booking/Bill</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="service-type">🔧 Loại dịch vụ</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="status">🔄 Trạng thái</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="reuse-status">♻️ Trạng thái reuse</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="customer">👥 Khách hàng</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="truck-company">🏢 Nhà xe</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="vehicle">🚚 Số xe</th>
                                    <th style={{...thStyle, minWidth: '100px'}} data-column="driver">👤 Tài xế</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="driver-phone">📞 SDT Tài xế</th>
                                    <th style={{...thStyle, minWidth: '160px'}} data-column="appointment">📅 Thời gian hẹn</th>
                                    <th style={{...thStyle, minWidth: '160px'}} data-column="time-in">⏰ Giờ vào thực tế</th>
                                    <th style={{...thStyle, minWidth: '160px'}} data-column="time-out">⏰ Giờ ra thực tế</th>
                                    <th style={{...thStyle, minWidth: '120px'}} data-column="total-amount">💰 Tổng tiền</th>
                                    <th style={{...thStyle, minWidth: '150px'}} data-column="payment-status">💳 Trạng thái thanh toán</th>
                                    <th style={{...thStyle, minWidth: '100px'}} data-column="documents">📄 Chứng từ</th>
                                    <th style={{...thStyle, minWidth: '150px'}} data-column="notes">📝 Ghi chú</th>
                                    <th style={{...thStyle, minWidth: '200px'}} data-column="actions">⚙️ Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((r) => (
                                    <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{...tdStyle, minWidth: '100px'}}>{r.shippingLine}</td>
                                        <td style={{...tdStyle, minWidth: '150px'}}>{r.requestNo}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>
                                            {r.containerNo ? (
                                                <span style={{ color: '#1f2937', fontWeight: '500' }}>{r.containerNo}</span>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ 
                                                        color: '#dc2626', 
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        background: '#fef2f2',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #fecaca'
                                                    }}>
                                                        ⚠️ Chưa có số container
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{...tdStyle, minWidth: '100px'}}>{r.containerType}</td>
                                        <td style={{...tdStyle, minWidth: '140px'}}>{r.bookingBill}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>Nâng container</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{statusLabel(r.status)}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>
                                            {/* Toggle Reuse Status */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <label style={{ 
                                                    position: 'relative',
                                                    display: 'inline-block',
                                                    width: '50px',
                                                    height: '24px',
                                                    opacity: (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED') ? 0.5 : 1,
                                                    cursor: (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED') ? 'not-allowed' : 'pointer'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={r.reuseStatus || false}
                                                        disabled={r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED'}
                                                        onChange={(e) => {
                                                            if (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED') {
                                                                const statusText = r.status === 'DONE_LIFTING' ? 'Nâng thành công' : 
                                                                                   r.status === 'IN_CAR' ? 'IN_CAR' : 
                                                                                   r.status === 'GATE_OUT' ? 'GATE_OUT' : 'Bị từ chối';
                                                                showError(
                                                                    'Không thể thay đổi trạng thái reuse',
                                                                    `Request đang ở trạng thái ${statusText}, không thể thay đổi reuse status`,
                                                                    3000
                                                                );
                                                                return;
                                                            }
                                                            handleToggleReuse(r.id, e.target.checked);
                                                        }}
                                                        style={{ 
                                                            opacity: 0,
                                                            width: 0,
                                                            height: 0
                                                        }}
                                                    />
                                                    <span style={{
                                                        position: 'absolute',
                                                        cursor: (r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'REJECTED') ? 'not-allowed' : 'pointer',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        backgroundColor: r.reuseStatus ? '#10b981' : '#ef4444',
                                                        transition: '0.3s',
                                                        borderRadius: '24px',
                                                        border: '1px solid #d1d5db'
                                                    }}>
                                                        <span style={{
                                                            position: 'absolute',
                                                            content: '""',
                                                            height: '18px',
                                                            width: '18px',
                                                            left: r.reuseStatus ? '26px' : '2px',
                                                            bottom: '2px',
                                                            backgroundColor: 'white',
                                                            transition: '0.3s',
                                                            borderRadius: '50%',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }}></span>
                                                    </span>
                                                </label>
                                                <span style={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: '500',
                                                    color: r.reuseStatus ? '#10b981' : '#ef4444'
                                                }}>
                                                    {r.reuseStatus ? 'Có reuse' : 'Không reuse'}
                                                    {(r.status === 'DONE_LIFTING' || r.status === 'IN_CAR' || r.status === 'GATE_OUT') && (
                                                        <div style={{ 
                                                            fontSize: '10px', 
                                                            color: '#f59e0b', 
                                                            fontWeight: '400',
                                                            marginTop: '2px'
                                                        }}>
                                                            (Không thể thay đổi)
                                                        </div>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.customer}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.transportCompany}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.vehicleNumber}</td>
                                        <td style={{...tdStyle, minWidth: '100px'}}>{r.driverName}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.driverPhone}</td>
                                        <td style={{...tdStyle, minWidth: '160px'}}>{r.appointmentTime || '-'}</td>
                                        <td style={{...tdStyle, minWidth: '160px'}}>{r.timeIn || '-'}</td>
                                        <td style={{...tdStyle, minWidth: '160px'}}>{r.timeOut || '-'}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>
                                            {typeof r.totalAmount === 'number' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                                        {getTotalAmountWithSeal(r).toLocaleString('vi-VN')}
                                                    </span>
                                                    {sealCosts[r.id] > 0 && (
                                                        <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '500' }}>
                                                            +{sealCosts[r.id].toLocaleString('vi-VN')} seal
                                                        </span>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td style={{...tdStyle, minWidth: '150px'}}>
                                            <span className={`payment-status ${r.paymentStatus === 'Đã thanh toán' ? 'paid' : 'unpaid'}`}>
                                                {r.paymentStatus || '-'}
                                            </span>
                                        </td>
                                        <td style={{...tdStyle, minWidth: '100px'}}>
                                            <button 
                                                type="button" 
                                                className="btn btn-light" 
                                                style={{ padding: '6px 10px', fontSize: 12 }}
                                                onClick={async () => {
                                                    try {
                                                        const res = await requestService.getRequestFiles(r.id);
                                                        const files = res?.data?.data || [];
                                                        if (!files.length) { 
                                                            showError('📄 Chưa có chứng từ', 'Yêu cầu này chưa có file chứng từ nào được upload', 3000);
                                                            return; 
                                                        }
                                                        const html = `
                                                          <div style="position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;">
                                                            <div style="background:#fff;border-radius:12px;max-width:800px;width:90%;max-height:80vh;overflow:auto;padding:16px;">
                                                              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                                                <h3 style="margin:0;font-size:16px;color:#0f172a">Chứng từ (${files.length})</h3>
                                                                <button id="close-docs" style="border:none;background:#ef4444;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer">Đóng</button>
                                                              </div>
                                                              ${files.map((f:any) => `
                                                                <div style="display:flex;gap:12px;align-items:center;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:8px;">
                                                                  ${String(f.file_type||'').startsWith('image/') ? `<a href="${f.storage_url}" target="_blank"><img src="${f.storage_url}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb" /></a>` : `<div style=\"width:56px;height:56px;display:flex;align-items:center;justify-content:center;border:1px solid #e5e7eb;border-radius:6px;color:#64748b\">PDF</div>`}
                                                                  <div style="flex:1;min-width:0">
                                                                    <a href="${f.storage_url}" target="_blank" style="color:#1d4ed8;text-decoration:none;word-break:break-all">${f.file_name}</a>
                                                                    <div style="font-size:12px;color:#6b7280">${Math.round((f.file_size||0)/1024)} KB</div>
                                                                  </div>
                                                                </div>
                                                              `).join('')}
                                                            </div>
                                                          </div>`;
                                                        const wrapper = document.createElement('div');
                                                        wrapper.innerHTML = html;
                                                        document.body.appendChild(wrapper);
                                                        wrapper.querySelector('#close-docs')?.addEventListener('click', () => document.body.removeChild(wrapper));
                                                      } catch (e) { 
                                                        showError('❌ Không tải được chứng từ', 'Có lỗi xảy ra khi tải danh sách chứng từ', 3000);
                                                      }
                                                }}
                                            >
                                                {r.documentsCount ?? 0} file
                                            </button>
                                        </td>
                                        <td style={{...tdStyle, minWidth: '150px'}}>{r.notes || ''}</td>
                <td style={{ ...tdStyle, minWidth: '320px', whiteSpace: 'nowrap' }}>
                                            {/* Cảnh báo thiếu số container */}
                                            {!r.containerNo && r.status === 'NEW_REQUEST' && (
                                                <div style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px',
                                                    background: '#fef3c7',
                                                    border: '1px solid #f59e0b',
                                                    borderRadius: '6px',
                                                    padding: '4px 8px',
                                                    marginRight: '8px',
                                                    fontSize: '11px',
                                                    color: '#92400e',
                                                    fontWeight: '500'
                                                }}>
                                                    <span>⚠️</span>
                                                    <span>Cần cập nhật số container</span>
                                                </div>
                                            )}
                                            
                                            {/* Chỉ hiển thị nút "Cập nhật thông tin" khi status là NEW_REQUEST */}
                                            {r.status === 'NEW_REQUEST' && (
                                                <button 
                                                    type="button" 
                                                    className="btn btn-primary" 
                                                    style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                                                    onClick={() => handleUpdateClick(r.id)}
                                                    disabled={processingIds.has(r.id) || loading}
                                                    title={!r.containerNo ? 'Cần cập nhật số container trước khi xử lý' : undefined}
                                                >
                                                    {processingIds.has(r.id) ? 'Đang xử lý...' : 'Cập nhật thông tin'}
                                                </button>
                                            )}
                    {(r.status === 'DONE_LIFTING') && r.paymentStatus !== 'Đã thanh toán' && (
                        <button
                            type="button"
                            className="btn btn-success"
                            style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                            onClick={async () => {
                                try {
                                    setProcessingIds(prev => new Set(prev).add(r.id));
                                    
                                    // Tải danh sách price list và tính tổng loại "Nâng"
                                    const res = await setupService.getPriceLists({ page: 1, limit: 1000 });
                                    const items = res.data?.data || [];
                                    const nangItems = items.filter((pl: any) => (pl.type || '').toLowerCase() === 'nâng');
                                    let total = nangItems.reduce((sum: number, pl: any) => sum + Number(pl.price || 0), 0);
                                    
                                    // Thêm seal cost nếu có
                                    let sealCost = 0;
                                    try {
                                        const token = localStorage.getItem('token');
                                        const sealRes = await fetch(`/backend/requests/${r.id}/seal-cost`, {
                                            method: 'GET',
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            }
                                        });
                                        
                                        if (sealRes.ok) {
                                            const sealData = await sealRes.json();
                                            if (sealData.success && sealData.data?.sealCost) {
                                                sealCost = Number(sealData.data.sealCost);
                                                total += sealCost;
                                            }
                                        }
                                    } catch (sealError) {
                                        console.error('Lỗi khi lấy seal cost:', sealError);
                                    }
                                    
                                    // Lưu seal cost vào state để hiển thị trong popup
                                    setCurrentSealCost(sealCost);
                                    setPaymentAmount(Number.isFinite(total) ? total : 0);
                                    setPaymentRequestInfo({ id: r.id, requestNo: r.requestNo, containerNo: r.containerNo });
                                    setShowPaymentModal(true);
                                } catch (e) {
                                    showError('Không lấy được bảng giá', 'Vui lòng kiểm tra lại PriceLists');
                                } finally {
                                    setProcessingIds(prev => { const s=new Set(prev); s.delete(r.id); return s; });
                                }
                            }}
                            disabled={processingIds.has(r.id) || loading}
                        >
                            Tạo yêu cầu thanh toán
                        </button>
                    )}
                                            {/* Nút In phiếu EIR - CHỈ hiển thị khi đã thanh toán VÀ status là IN_CAR hoặc GATE_OUT hoặc IN_YARD */}
                                            {r.paymentStatus === 'Đã thanh toán' && (r.status === 'IN_CAR' || r.status === 'GATE_OUT' || r.status === 'IN_YARD') && (
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
                                                    onClick={() => handlePrintEIR(r.id)}
                                                    disabled={processingIds.has(r.id) || loading}
                                                    title="In phiếu EIR"
                                                >
                                                    {processingIds.has(r.id) ? 'Đang tạo...' : '📄 In phiếu EIR'}
                                                </button>
                                            )}

                                            {/* Nút xóa/hủy - chỉ hiển thị khi status là NEW_REQUEST */}
                                            {r.status === 'NEW_REQUEST' && (
                                                <button 
                                                    type="button" 
                                                    className="btn btn-danger" 
                                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                                    onClick={() => isReject ? handleCancelClick(r.id) : handleDeleteClick(r.id)}
                                                    disabled={processingIds.has(r.id) || loading}
                                                >
                                                    {processingIds.has(r.id) ? 'Đang xử lý...' : (isReject ? 'Hủy' : 'Xóa')}
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

            {/* Cancel Confirmation Modal - chỉ hiển thị khi isReject = true */}
            {isReject && showCancelModal && (
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
                        <div style={{
                            margin: '16px 0',
                            textAlign: 'left'
                        }}>
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
                                    boxSizing: 'border-box'
                                }}
                            />
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
                                Đóng
                            </button>
                            
                            <button
                                onClick={handleCancelRequest}
                                disabled={processingIds.has(cancelRequestId || '') || !cancelReason.trim()}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    background: (processingIds.has(cancelRequestId || '') || !cancelReason.trim()) ? '#9ca3af' : '#f59e0b',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: (processingIds.has(cancelRequestId || '') || !cancelReason.trim()) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    minWidth: '80px'
                                }}
                                onMouseOver={(e) => {
                                    if (!processingIds.has(cancelRequestId || '') && cancelReason.trim()) {
                                        e.currentTarget.style.background = '#d97706';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!processingIds.has(cancelRequestId || '') && cancelReason.trim()) {
                                        e.currentTarget.style.background = '#f59e0b';
                                    }
                                }}
                            >
                                {processingIds.has(cancelRequestId || '') ? 'Đang hủy...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <EditLiftRequestModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditRequestData(null);
                }}
                onSubmit={handleUpdateRequest}
                requestData={editRequestData}
            />

            {/* Modal xác nhận chuyển đến cổng */}
            {showMoveToGateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'modalSlideIn 0.3s ease-out'
                    }}>
                        {/* Icon */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '50%',
                            margin: '0 auto 24px',
                            fontSize: '32px'
                        }}>
                            🚪
                        </div>
                        
                        {/* Title */}
                        <h3 style={{
                            margin: '0 0 16px 0',
                            color: '#1f2937',
                            fontSize: '20px',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            Xác nhận chuyển đến cổng
                        </h3>
                        
                        {/* Content */}
                        <div style={{
                            marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            <p style={{
                                margin: '0 0 12px 0',
                                color: '#6b7280',
                                fontSize: '16px',
                                lineHeight: '1.5'
                            }}>
                                Bạn có chắc chắn muốn chuyển yêu cầu này đến cổng không?
                            </p>
                            
                            {moveToGateRequestInfo && (
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    margin: '16px 0',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ color: '#64748b', fontWeight: '500' }}>Mã yêu cầu:</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{moveToGateRequestInfo.requestNo}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ color: '#64748b', fontWeight: '500' }}>Container:</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{moveToGateRequestInfo.containerNo}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span style={{ color: '#64748b', fontWeight: '500' }}>Khách hàng:</span>
                                        <span style={{ color: '#1f2937', fontWeight: '600' }}>{moveToGateRequestInfo.customer}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => setShowMoveToGateModal(false)}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minWidth: '100px'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#4b5563';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#6b7280';
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleMoveToGateConfirm}
                                disabled={processingIds.has(moveToGateRequestId || '')}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: processingIds.has(moveToGateRequestId || '') ? '#9ca3af' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: processingIds.has(moveToGateRequestId || '') ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    minWidth: '100px'
                                }}
                                onMouseOver={(e) => {
                                    if (!processingIds.has(moveToGateRequestId || '')) {
                                        e.currentTarget.style.backgroundColor = '#059669';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!processingIds.has(moveToGateRequestId || '')) {
                                        e.currentTarget.style.backgroundColor = '#10b981';
                                    }
                                }}
                            >
                                {processingIds.has(moveToGateRequestId || '') ? 'Đang xử lý...' : 'Xác nhận'}
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
                            
                            {/* Chi tiết phí nâng container */}
                            <div style={{ 
                                marginBottom: '8px',
                                padding: '10px 12px',
                                background: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Phí dịch vụ nâng container</span>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>1.420.000 ₫</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
                                    Tính theo tổng các mục trong Setup/PriceLists có loại "Nâng"
                                </div>
                            </div>

                            {/* Chi tiết phí seal */}
                            {currentSealCost > 0 && (
                                <div style={{ 
                                    padding: '10px 12px',
                                    background: '#fef3c7',
                                    borderRadius: '8px',
                                    border: '1px solid #f59e0b'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>Chi phí seal container</span>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>{currentSealCost.toLocaleString('vi-VN')} ₫</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#a16207', fontStyle: 'italic' }}>
                                        Đơn giá seal từ SealManagement theo hãng tàu
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => { setShowPaymentModal(false); setPaymentRequestInfo(null); setCurrentSealCost(0); }}
                                style={{ padding: '10px 16px' }}
                            >Hủy</button>
                            <button
                                className="btn"
                                onClick={async () => {
                                    try {
                                        if (paymentRequestInfo?.id) {
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
                                            doc.text('• Loai dich vu: Nang container', 25, yPos);
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
                                            
                                            // Dòng 1: Phí dịch vụ nâng
                                            doc.rect(15, yPos - 3, 180, 12);
                                            doc.text('1', 20, yPos + 5);
                                            doc.text('Phi dich vu nang container', 45, yPos + 5);
                                            doc.text('1.420.000 VND', 160, yPos + 5);
                                            doc.line(35, yPos - 3, 35, yPos + 9);
                                            doc.line(150, yPos - 3, 150, yPos + 9);
                                            yPos += 12;
                                            
                                            // Dòng 2: Seal cost (nếu có)
                                            if (currentSealCost > 0) {
                                                doc.rect(15, yPos - 3, 180, 12);
                                                doc.text('2', 20, yPos + 5);
                                                doc.text('Chi phi seal container', 45, yPos + 5);
                                                doc.text(`${currentSealCost.toLocaleString('vi-VN')} VND`, 160, yPos + 5);
                                                doc.line(35, yPos - 3, 35, yPos + 9);
                                                doc.line(150, yPos - 3, 150, yPos + 9);
                                                yPos += 12;
                                            }
                                            
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
                                        showError('Không thể tạo file', 'Vui lòng thử lại sau'); 
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
                                            setRows(prev => prev.map(r => 
                                                r.id === paymentRequestInfo.id 
                                                    ? { 
                                                        ...r, 
                                                        paymentStatus: 'Đã thanh toán',
                                                        // Cập nhật status để nút "In phiếu EIR" hiển thị ngay
                                                        status: r.status === 'DONE_LIFTING' ? 'IN_CAR' : r.status
                                                      } 
                                                    : r
                                            ));
                                        }
                                        setPaymentRequestInfo(null);
                                        setCurrentSealCost(0);
                                        showSuccess('Thanh toán thành công', 'Yêu cầu đã xuất hiện trong trang hóa đơn');
                                        
                                        // Refresh dữ liệu từ API để đảm bảo đồng bộ
                                        setTimeout(() => {
                                            fetchRequests();
                                        }, 1000);
                                    } catch (e:any) {
                                        showError('Không thể xác nhận thanh toán', e?.response?.data?.message || 'Lỗi không xác định');
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

            <style jsx>{`
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
        </>
    );
};

// Styles cho table cells
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
    whiteSpace: 'nowrap',
    minWidth: '120px'
};

const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: '#0f172a',
    verticalAlign: 'top',
    background: 'white',
    borderTop: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
    minWidth: '120px'
};
