import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { useToast } from '../../../hooks/useToastHook';
import { requestService } from '../../../services/requests';
import { CancelRequestModal } from './CancelRequestModal';
import { EditLowerRequestModal } from './EditLowerRequestModal';
import { maintenanceApi } from '../../../services/maintenance';

interface ImportRequestProps {
	localSearch: string;
	setLocalSearch: (search: string) => void;
	localType: string;
	setLocalType: (type: string) => void;
	localStatus: string;
	setLocalStatus: (status: string) => void;
	refreshTrigger?: number;
  isReject?: boolean;
	onCreateRequest?: () => void;
}

export const ImportRequest: React.FC<ImportRequestProps> = ({
	localSearch,
	setLocalSearch,
	localType,
	setLocalType,
	localStatus,
	setLocalStatus,
	refreshTrigger,
  isReject = false,
	onCreateRequest
}) => {
	const { t } = useTranslation();
	const { showSuccess, showError, ToastContainer } = useToast();

	// Kiểu dữ liệu cho 1 dòng yêu cầu hạ container
	type LowerRequestRow = {
		id: string;
		shippingLine: string;
		requestNo: string;
		containerNo: string;
		containerType: string;
		serviceType: string; // mặc định "Hạ container"
		status: string;
		customer: string;
		transportCompany: string; // Nhà xe
		vehicleNumber: string; // Số xe
		driverName: string; // Tên tài xế
		driverPhone: string; // SDT tài xế
		appointmentTime?: string; // Thời gian hẹn
		timeIn?: string; // Giờ vào thực tế
		timeOut?: string; // Giờ ra thực tế
		totalAmount?: number; // Tổng tiền
		paymentStatus?: string; // Trạng thái thanh toán
		documentsCount?: number; // Số chứng từ
		demDet?: string; // DEM/DET
		notes?: string; // Ghi chú
		rejectedReason?: string; // Lý do từ chối
      repairTicketId?: string; // Liên kết phiếu kiểm tra nếu có
      isRepairRejected?: boolean; // Cờ từ trạng thái repairTicket
	};

    // Dữ liệu thực tế từ API (khởi tạo rỗng)
    const [rows, setRows] = React.useState<LowerRequestRow[]>([]);
    // Documents modal state
    const [isDocsOpen, setIsDocsOpen] = React.useState(false);
    const [docsLoading, setDocsLoading] = React.useState(false);
    const [docsError, setDocsError] = React.useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = React.useState<{ id: string; containerNo: string } | null>(null);
    const [attachments, setAttachments] = React.useState<Array<{ id: string; file_name: string; file_type: string; file_size: number; storage_url: string }>>([]);

    // Update modal state
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [editRequestData, setEditRequestData] = React.useState<any>(null);
    const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());
    const [loading, setLoading] = React.useState(false);

    // Cancel modal state
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
    const [selectedRequestForCancel, setSelectedRequestForCancel] = React.useState<LowerRequestRow | null>(null);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [deleteRequestId, setDeleteRequestId] = React.useState<string | null>(null);

    // View cancel reason modal state
    const [isViewReasonOpen, setIsViewReasonOpen] = React.useState(false);
    const [viewReasonText, setViewReasonText] = React.useState<string>('');
    const [viewReasonRequestNo, setViewReasonRequestNo] = React.useState<string>('');

    // Function để fetch requests từ API
    const fetchRequests = async () => {
        setLoading(true);
        try {
            console.log('=== DEBUG FETCH REQUESTS ===');
            console.log('Token in localStorage:', localStorage.getItem('token'));
            console.log('API_BASE:', process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1000');
            const response = await requestService.getRequests('IMPORT');
            console.log('API Response:', response.data);
            if (response.data.success) {
                // Transform data từ API thành format của table
                const transformedData: LowerRequestRow[] = response.data.data.map((request: any) => {
                    console.log('Processing request:', request.id, 'attachments:', request.attachments, 'attachments_count:', request.attachments_count);
                    return {
                        id: request.id,
                        shippingLine: request.shipping_line?.name || '',
                        requestNo: request.request_no || '',
                        containerNo: request.container_no || '',
                        containerType: request.container_type?.code || '',
                        serviceType: 'Hạ container',
                        status: request.status,
                        customer: request.customer?.name || '',
                        transportCompany: request.vehicle_company?.name || '',
                        vehicleNumber: request.license_plate || '',
                        driverName: request.driver_name || '',
                        driverPhone: request.driver_phone || '',
                        appointmentTime: request.appointment_time ? new Date(request.appointment_time).toLocaleString('vi-VN') : '',
                        timeIn: request.time_in ? new Date(request.time_in).toLocaleString('vi-VN') : '',
                        timeOut: request.time_out ? new Date(request.time_out).toLocaleString('vi-VN') : '',
                        totalAmount: request.total_amount || '',
                        paymentStatus: request.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán',
                        // Dùng attachments length nếu API trả về mảng, fallback sang attachments_count
                        documentsCount: (() => {
                            const count = Array.isArray(request.attachments) ? request.attachments.length : (request.attachments_count || 0);
                            console.log('Calculated documentsCount for', request.id, ':', count, 'from attachments:', request.attachments, 'attachments_count:', request.attachments_count);
                            return count;
                        })(),
                        demDet: request.dem_det || '',
                        // Không đưa lý do hủy vào cột ghi chú; chỉ hiển thị ghi chú cuộc hẹn
                        notes: request.appointment_note || '',
                        // Lưu tách riêng lý do hủy để hiển thị qua modal "Xem lý do"
                        rejectedReason: request.rejected_reason || ''
                    };
                });
                // Map thêm trạng thái từ repair tickets để xác định isReject theo phiếu
                try {
                  const repairsRes = await maintenanceApi.listRepairs({ page: 1, limit: 200 });
                  const list = repairsRes?.data || [];
                  const containerToRepair = new Map<string, { id: string; status: string }>();
                  list.forEach((rt: any) => {
                    if (rt.container_no) containerToRepair.set(rt.container_no, { id: rt.id, status: rt.status });
                  });
                  setRows(
                    transformedData.map((row) => {
                      const info = containerToRepair.get(row.containerNo);
                      return info
                        ? { ...row, repairTicketId: info.id, isRepairRejected: info.status === 'REJECT' }
                        : row;
                    })
                  );
                } catch {
                  setRows(transformedData);
                }

                // Chỉ gọi API đếm chính xác cho những request không có attachments array từ backend
                const needsAccurateCount = transformedData.filter(r => r.documentsCount === 0 || r.documentsCount === undefined);
                console.log('Requests needing accurate count:', needsAccurateCount);
                if (needsAccurateCount.length > 0) {
                    try {
                        const results = await Promise.all(
                            needsAccurateCount.map(async (r) => {
                                try {
                                    const res = await requestService.getFiles(r.id);
                                    console.log('getFiles response for', r.id, ':', res.data);
                                    const count = Array.isArray(res.data?.data) ? res.data.data.length : 0;
                                    console.log('Count from getFiles for', r.id, ':', count);
                                    return { id: r.id, count };
                                } catch {
                                    return { id: r.id, count: 0 };
                                }
                            })
                        );
                        console.log('Fallback results:', results);
                        setRows(prev => prev.map(row => {
                            const found = results.find(x => x.id === row.id);
                            const updatedRow = found ? { ...row, documentsCount: found.count } as LowerRequestRow : row;
                            console.log('Updating row', row.id, 'from', row.documentsCount, 'to', updatedRow.documentsCount);
                            return updatedRow;
                        }));
                    } catch {}
                }
            }
        } catch (error: any) {
            console.error('=== ERROR FETCHING EXPORT REQUESTS ===');
            console.error('Error details:', error);
            console.error('Error response:', error?.response?.data);
            console.error('Error status:', error?.response?.status);
            console.error('Error config:', error?.config);
        } finally {
            setLoading(false);
        }
    };

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
                showError('❌ Không thể tải thông tin', 'Có lỗi xảy ra khi tải thông tin yêu cầu', 3000);
            }
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

    // Function để mở modal xóa
    const handleDeleteClick = (requestId: string) => {
        setDeleteRequestId(requestId);
        setShowDeleteModal(true);
    };

    // Function để xử lý xóa yêu cầu
    const handleDeleteRequest = async () => {
        if (!deleteRequestId) return;
        
        try {
            await requestService.deleteRequest(deleteRequestId);
            showSuccess(
                'Xóa yêu cầu thành công!',
                'Yêu cầu đã được xóa khỏi hệ thống',
                3000
            );
            
            // Refresh data after delete
            fetchRequests();
            
            // Close modal
            setShowDeleteModal(false);
            setDeleteRequestId(null);
        } catch (error: any) {
            console.error('Error deleting request:', error);
            showError(
                '❌ Không thể xóa yêu cầu',
                error.response?.data?.message || 'Có lỗi xảy ra khi xóa yêu cầu',
                3000
            );
        }
    };

  const openDocuments = async (row: LowerRequestRow) => {
    try {
      setSelectedRequest({ id: row.id, containerNo: row.containerNo });
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

  // Removed: update handlers

  // Handle cancel/reject request
  const handleCancelRequest = (row: LowerRequestRow) => {
    setSelectedRequestForCancel(row);
    setIsCancelModalOpen(true);
  };

  const confirmCancelRequest = async (reason: string) => {
    if (!selectedRequestForCancel) return;
    try {
      if ((isReject || selectedRequestForCancel.isRepairRejected) && selectedRequestForCancel.status !== 'PENDING') {
        // Yêu cầu: xác nhận từ chối sẽ chuyển trạng thái import request -> REJECTED
        await requestService.cancelRequest(selectedRequestForCancel.id, reason);
      } else {
        // Hủy ImportRequest khi PENDING
        await requestService.cancelRequest(selectedRequestForCancel.id, reason);
      }
      setIsCancelModalOpen(false);
      setSelectedRequestForCancel(null);
      fetchRequests();
    } catch (error: any) {
      console.error('Cancel/Reject request error:', error);
      alert((isReject ? 'Có lỗi xảy ra khi từ chối yêu cầu: ' : 'Có lỗi xảy ra khi hủy yêu cầu: ') + (error.response?.data?.message || error.message));
    }
  };


  // View cancel reason
  const openViewReason = (row: LowerRequestRow) => {
    setViewReasonRequestNo(row.requestNo);
    setViewReasonText(row.rejectedReason || 'Không có lý do');
    setIsViewReasonOpen(true);
  };

  const closeViewReason = () => {
    setIsViewReasonOpen(false);
    setViewReasonText('');
    setViewReasonRequestNo('');
  };

  // Hiển thị trạng thái với emoji (đồng bộ với bảng Nâng container)
  const statusLabel = (status: string) => {
    switch (status) {
      case 'NEW_REQUEST':
        return '🆕 Thêm mới';
      case 'PENDING':
        // Với Yêu cầu Hạ container, trạng thái khởi tạo hiển thị là "Thêm mới"
        return '🆕 Thêm mới';
      case 'SCHEDULED':
        return '📅 Đã lên lịch';
      case 'FORWARDED':
        return '📤 Đã chuyển tiếp';
      case 'GATE_IN':
        return '🟢 Đã cho phép vào';
      case 'GATE_OUT':
        return '🟣 Đã cho phép ra';
      case 'GATE_REJECTED':
        return '⛔ Đã từ chối';
      case 'COMPLETED':
        return '✅ Hoàn tất';
      case 'REJECTED':
        return '⛔ Đã từ chối';
      default:
        return status;
    }
  };

    // Effect để fetch data khi component mount
    React.useEffect(() => {
        fetchRequests();
    }, []);

    // Effect để refresh data khi refreshTrigger thay đổi
    React.useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            console.log('Refresh triggered, clearing cache and fetching fresh data');
            // Clear any cached data
            setRows([]);
            fetchRequests();
        }
    }, [refreshTrigger]);


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
							<option value="all">{t('pages.requests.allStatuses')}</option>
							<option value="PENDING">Chờ xử lý</option>
							<option value="SCHEDULED">Đã lên lịch</option>
							<option value="IN_PROGRESS">Đang thực hiện</option>
							<option value="COMPLETED">Hoàn thành</option>
							<option value="CANCELLED">Đã hủy</option>
						</select>
					</div>
					{onCreateRequest && (
						<div className="action-group">
							<button 
								className="btn btn-success"
								onClick={onCreateRequest}
							>
								Tạo yêu cầu hạ container
							</button>
						</div>
					)}
				</div>
			</div>

			<div className="gate-table-container">
				{rows.length === 0 ? (
					<div className="table-empty modern-empty">
						<div className="empty-icon">📦⬇️</div>
						<p>Chưa có yêu cầu hạ container nào</p>
						<small>Không có yêu cầu hạ container nào để xử lý</small>
					</div>
				) : (
					<div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
						<table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1200 }}>
							<thead>
								<tr style={{ background: '#f8fafc', color: '#0f172a' }}>
									<th style={thStyle}>Hãng tàu</th>
									<th style={thStyle}>Số yêu cầu</th>
									<th style={thStyle}>Số Cont</th>
									<th style={thStyle}>Loại cont</th>
									<th style={thStyle}>Loại dịch vụ</th>
									<th style={thStyle}>Trạng thái</th>
									<th style={thStyle}>Khách hàng</th>
									<th style={thStyle}>Nhà xe</th>
									<th style={thStyle}>Số xe</th>
									<th style={thStyle}>Tên tài xế</th>
									<th style={thStyle}>SDT tài xế</th>
									<th style={thStyle}>Thời gian hẹn</th>
									<th style={thStyle}>Giờ vào thực tế</th>
									<th style={thStyle}>Giờ ra thực tế</th>
									<th style={thStyle}>Tổng tiền</th>
									<th style={thStyle}>Trạng thái thanh toán</th>
									<th style={thStyle}>Chứng từ</th>
									<th style={thStyle}>DEM/DET</th>
									<th style={thStyle}>Ghi chú</th>
                                    <th style={thStyle}>Hành động</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r) => (
									<tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
										<td style={tdStyle}>{r.shippingLine}</td>
										<td style={tdStyle}>{r.requestNo}</td>
										<td style={tdStyle}>{r.containerNo}</td>
										<td style={tdStyle}>{r.containerType}</td>
										<td style={tdStyle}>Hạ container</td>
                    <td style={tdStyle}>{statusLabel(r.status)}</td>
										<td style={tdStyle}>{r.customer}</td>
										<td style={tdStyle}>{r.transportCompany}</td>
										<td style={tdStyle}>{r.vehicleNumber}</td>
										<td style={tdStyle}>{r.driverName}</td>
										<td style={tdStyle}>{r.driverPhone}</td>
										<td style={tdStyle}>{r.appointmentTime || '-'}</td>
										<td style={tdStyle}>{r.timeIn || '-'}</td>
										<td style={tdStyle}>{r.timeOut || '-'}</td>
										<td style={tdStyle}>{typeof r.totalAmount === 'number' ? r.totalAmount.toLocaleString('vi-VN') : '-'}</td>
										<td style={tdStyle}>{r.paymentStatus || '-'}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        className="btn btn-light"
                        style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={() => openDocuments(r)}
                        title="Xem chứng từ"
                      >
                        {(r.documentsCount ?? 0)} file
                      </button>
                    </td>
										<td style={tdStyle}>{r.demDet || '-'}</td>
										<td style={tdStyle}>{r.notes || ''}</td>
                                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                                          {/* Nút cập nhật thông tin */}
                                          <button 
                                            type="button" 
                                            className="btn btn-primary" 
                                            style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                                            onClick={() => handleUpdateClick(r.id)}
                                            disabled={processingIds.has(r.id) || loading || r.status !== 'PENDING'}
                                            title={r.status !== 'PENDING' ? 'Chỉ cho phép cập nhật khi trạng thái là Chờ xử lý' : undefined}
                                          >
                                            {processingIds.has(r.id) ? 'Đang xử lý...' : 'Cập nhật thông tin'}
                                          </button>
                                          
                                          {/* Nút xóa */}
                                          <button 
                                            type="button" 
                                            className="btn btn-danger" 
                                            style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                                            onClick={() => handleDeleteClick(r.id)}
                                            disabled={loading}
                                            title="Xóa yêu cầu"
                                          >
                                            Xóa
                                          </button>
                                          {r.status !== 'PENDING' && (isReject || r.isRepairRejected) && (
                                            <button 
                                              type="button" 
                                              className="btn btn-danger" 
                                              style={{ padding: '6px 10px', fontSize: 12 }}
                                              onClick={() => handleCancelRequest(r)}
                                            >
                                              Từ chối yêu cầu
                                            </button>
                                          )}
                                        </td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
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
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
            Xác nhận xóa yêu cầu
          </h3>
          <p style={{ margin: '0 0 24px 0', color: '#6b7280' }}>
            Bạn có chắc chắn muốn xóa yêu cầu này? Hành động này không thể hoàn tác.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteRequestId(null);
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                background: 'white',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeleteRequest}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    )}

    <CancelRequestModal
      isOpen={isCancelModalOpen}
      onClose={() => { setIsCancelModalOpen(false); setSelectedRequestForCancel(null); }}
      onConfirm={confirmCancelRequest}
      requestNo={selectedRequestForCancel?.requestNo}
      mode={(isReject || selectedRequestForCancel?.isRepairRejected) && selectedRequestForCancel?.status !== 'PENDING' ? 'reject' : 'cancel'}
      defaultReason={(isReject || selectedRequestForCancel?.isRepairRejected) && selectedRequestForCancel?.status !== 'PENDING' ? 'Container xấu không thể sửa chữa' : ''}
    />

    {/* Toast Container */}
    <ToastContainer />
			</div>
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
	textOverflow: 'ellipsis',
};
