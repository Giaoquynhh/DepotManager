import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { requestService } from '../../../services/requests';
import { UpdateRequestModal } from './UpdateRequestModal';
import { CancelRequestModal } from './CancelRequestModal';

interface ExportRequestProps {
	localSearch: string;
	setLocalSearch: (search: string) => void;
	localType: string;
	setLocalType: (type: string) => void;
	localStatus: string;
	setLocalStatus: (status: string) => void;
	refreshTrigger?: number;
}

export const ExportRequest: React.FC<ExportRequestProps> = ({
	localSearch,
	setLocalSearch,
	localType,
	setLocalType,
	localStatus,
	setLocalStatus,
	refreshTrigger
}) => {
	const { t } = useTranslation();

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
    const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);
    const [selectedRequestForUpdate, setSelectedRequestForUpdate] = React.useState<LowerRequestRow | null>(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
    const [selectedRequestForCancel, setSelectedRequestForCancel] = React.useState<LowerRequestRow | null>(null);

    // View cancel reason modal state
    const [isViewReasonOpen, setIsViewReasonOpen] = React.useState(false);
    const [viewReasonText, setViewReasonText] = React.useState<string>('');
    const [viewReasonRequestNo, setViewReasonRequestNo] = React.useState<string>('');

    // Function để fetch requests từ API
    const fetchRequests = async () => {
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
                setRows(transformedData);

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

  // Handle update request
  const handleUpdateRequest = (row: LowerRequestRow) => {
    setSelectedRequestForUpdate(row);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedRequestForUpdate(null);
  };

  const handleUpdateSuccess = () => {
    // Refresh the table after successful update
    fetchRequests();
  };

  // Handle cancel request
  const handleCancelRequest = (row: LowerRequestRow) => {
    setSelectedRequestForCancel(row);
    setIsCancelModalOpen(true);
  };

  const confirmCancelRequest = async (reason: string) => {
    if (!selectedRequestForCancel) return;
    try {
      await requestService.cancelRequest(selectedRequestForCancel.id, reason);
      setIsCancelModalOpen(false);
      setSelectedRequestForCancel(null);
      fetchRequests();
    } catch (error: any) {
      console.error('Cancel request error:', error);
      alert('Có lỗi xảy ra khi hủy yêu cầu: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle delete request (hard delete from table)
  const handleDeleteRequest = async (row: LowerRequestRow) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa yêu cầu ${row.requestNo}?`)) return;
    try {
      await requestService.deleteRequest(row.id);
      fetchRequests();
    } catch (error: any) {
      console.error('Delete request error:', error);
      alert('Xóa yêu cầu thất bại: ' + (error.response?.data?.message || error.message));
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
							aria-label={t('pages.requests.typeLabel')}
							className="filter-select"
							value={localType}
							onChange={(e) => setLocalType(e.target.value)}
						>
							<option value="all">{t('pages.requests.allTypes')}</option>
							<option value="IMPORT">Yêu cầu hạ container</option>
						</select>
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
									<th style={thStyle}>Action</th>
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
                    <td style={tdStyle}>{r.status === 'REJECTED' ? 'Đã từ chối' : r.status}</td>
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
                                        {r.status !== 'REJECTED' && (
                                            <button 
                                                type="button" 
                                                className="btn btn-primary" 
                                                style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                                                onClick={() => handleUpdateRequest(r)}
                                            >
                                                Cập nhật thông tin
                                            </button>
                                        )}
                                        {r.status === 'REJECTED' ? (
                                          <>
                                            <button 
                                                type="button" 
                                                className="btn btn-light" 
                                                style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                                                onClick={() => openViewReason(r)}
                                            >
                                                Xem lý do
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-danger" 
                                                style={{ padding: '6px 10px', fontSize: 12 }}
                                                onClick={() => handleDeleteRequest(r)}
                                            >
                                                Xóa
                                            </button>
                                          </>
                                        ) : (
                                            <button 
                                                type="button" 
                                                className="btn btn-danger" 
                                                style={{ padding: '6px 10px', fontSize: 12 }}
                                                onClick={() => handleCancelRequest(r)}
                                            >
                                                Hủy
                                            </button>
                                        )}
    {/* View Cancel Reason Modal */}
    {isViewReasonOpen && (
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}
        onClick={closeViewReason}
      >
        <div
          style={{ background: '#fff', borderRadius: 12, width: '520px', maxWidth: '95vw', maxHeight: '70vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Lý do hủy - {viewReasonRequestNo}</h3>
            <button onClick={closeViewReason} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#111827' }}>{viewReasonText}</div>
          </div>
          <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={closeViewReason}>Đóng</button>
          </div>
        </div>
      </div>
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

    {/* Update Request Modal */}
    <UpdateRequestModal
      isOpen={isUpdateModalOpen}
      onClose={closeUpdateModal}
      onUpdate={handleUpdateSuccess}
      requestData={selectedRequestForUpdate ? {
        id: selectedRequestForUpdate.id,
        containerNo: selectedRequestForUpdate.containerNo,
        requestNo: selectedRequestForUpdate.requestNo,
        shippingLine: selectedRequestForUpdate.shippingLine,
        containerType: selectedRequestForUpdate.containerType,
        customer: selectedRequestForUpdate.customer,
        transportCompany: selectedRequestForUpdate.transportCompany,
        vehicleNumber: selectedRequestForUpdate.vehicleNumber,
        driverName: selectedRequestForUpdate.driverName,
        driverPhone: selectedRequestForUpdate.driverPhone,
        appointmentTime: selectedRequestForUpdate.appointmentTime || '',
        notes: selectedRequestForUpdate.notes || ''
      } : null}
    />

    <CancelRequestModal
      isOpen={isCancelModalOpen}
      onClose={() => { setIsCancelModalOpen(false); setSelectedRequestForCancel(null); }}
      onConfirm={confirmCancelRequest}
      requestNo={selectedRequestForCancel?.requestNo}
    />
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
	borderBottom: '1px solid #e2e8f0'
};

const tdStyle: React.CSSProperties = {
	padding: '12px 16px',
	fontSize: 14,
	color: '#0f172a',
	verticalAlign: 'top',
	background: 'white',
	borderTop: '1px solid #f1f5f9'
};
