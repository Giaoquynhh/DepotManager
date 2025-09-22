import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { requestService } from '../../../services/requests';
import { EditLiftRequestModal, EditLiftRequestData } from './EditLiftRequestModal';

interface ImportRequestProps {
	localSearch: string;
	setLocalSearch: (search: string) => void;
	localType: string;
	setLocalType: (type: string) => void;
	localStatus: string;
	setLocalStatus: (status: string) => void;
	refreshTrigger?: number;
}

export const ImportRequest: React.FC<ImportRequestProps> = ({
	localSearch,
	setLocalSearch,
	localType,
	setLocalType,
	localStatus,
	setLocalStatus,
	refreshTrigger
}) => {
	const { t } = useTranslation();

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
    };

    // Dữ liệu thực tế từ API (khởi tạo rỗng)
    const [rows, setRows] = React.useState<LiftRequestRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [deleteRequestId, setDeleteRequestId] = React.useState<string | null>(null);
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [editRequestData, setEditRequestData] = React.useState<any>(null);

    // Function để fetch requests từ API
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await requestService.getRequests('IMPORT');
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
                        totalAmount: request.total_amount || '',
                        paymentStatus: request.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán',
                        documentsCount: request.attachments_count || 0,
                        notes: request.appointment_note || ''
                    };
                });
                setRows(transformedData);
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

    // Effect để refresh data khi refreshTrigger thay đổi
    React.useEffect(() => {
        if (refreshTrigger) {
            fetchRequests();
        }
    }, [refreshTrigger]);

    // Function để mở modal chỉnh sửa
    const handleUpdateClick = async (requestId: string) => {
        setProcessingIds(prev => new Set(prev).add(requestId));
        try {
            console.log('Loading request details:', requestId);
            
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Bạn cần đăng nhập để thực hiện hành động này');
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
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            } else {
                alert('Có lỗi xảy ra khi tải thông tin yêu cầu: ' + (error.response?.data?.message || error.message));
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
    const handleUpdateRequest = async (data: EditLiftRequestData) => {
        try {
            // Show success message
            const successModal = document.createElement('div');
            successModal.innerHTML = `
                <div style="
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
                    align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
                    <div style="
                        background: white; padding: 24px; border-radius: 12px; 
                        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                        max-width: 400px; text-align: center;
                    ">
                        <div style="color: #10b981; font-size: 48px; margin-bottom: 16px;">✓</div>
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Cập nhật thành công!</h3>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Yêu cầu đã được cập nhật thành công.</p>
                    </div>
                </div>
            `;
            document.body.appendChild(successModal);
            setTimeout(() => {
                document.body.removeChild(successModal);
            }, 2000);
            
            // Refresh data after update
            fetchRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Có lỗi xảy ra khi cập nhật yêu cầu');
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
                alert('Bạn cần đăng nhập để thực hiện hành động này');
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
                // Show success message
                const successModal = document.createElement('div');
                successModal.innerHTML = `
                    <div style="
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
                        align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    ">
                        <div style="
                            background: white; padding: 24px; border-radius: 12px; 
                            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                            max-width: 400px; text-align: center;
                        ">
                            <div style="color: #10b981; font-size: 48px; margin-bottom: 16px;">✓</div>
                            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Xóa thành công!</h3>
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">Yêu cầu đã được xóa khỏi hệ thống.</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(successModal);
                setTimeout(() => {
                    document.body.removeChild(successModal);
                }, 2000);
                
                // Refresh data after deletion
                fetchRequests();
            } else {
                alert('Có lỗi xảy ra khi xóa yêu cầu: ' + (response.data.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Error deleting request:', error);
            if (error.response?.status === 401) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            } else {
                alert('Có lỗi xảy ra khi xóa yêu cầu: ' + (error.response?.data?.message || error.message));
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


	return (
		<>
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
							aria-label={t('pages.requests.typeLabel')}
							className="filter-select"
							value={localType}
							onChange={(e) => setLocalType(e.target.value)}
						>
							<option value="all">{t('pages.requests.allTypes')}</option>
							<option value="IMPORT">Yêu cầu nâng container</option>
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
                        <div className="empty-icon">📦⬆️</div>
                        <p>Chưa có yêu cầu nâng container nào</p>
                        <small>Không có yêu cầu nâng container nào để xử lý</small>
                    </div>
                ) : (
                    <div className="table-scroll-container" style={{ 
                        overflowX: 'auto', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: 8,
                        scrollbarWidth: 'auto',
                        msOverflowStyle: 'scrollbar'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1800 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', color: '#0f172a' }}>
                                    <th style={{...thStyle, minWidth: '100px'}}>Hãng tàu</th>
                                    <th style={{...thStyle, minWidth: '150px'}}>Số yêu cầu</th>
                                    <th style={{...thStyle, minWidth: '120px'}}>Số Cont</th>
                                    <th style={{...thStyle, minWidth: '100px'}}>Loại cont</th>
                                    <th style={{...thStyle, minWidth: '140px'}}>Số Booking/Bill</th>
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
                                    <th style={{...thStyle, minWidth: '150px'}}>Ghi chú</th>
                                    <th style={{...thStyle, minWidth: '200px'}}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{...tdStyle, minWidth: '100px'}}>{r.shippingLine}</td>
                                        <td style={{...tdStyle, minWidth: '150px'}}>{r.requestNo}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.containerNo}</td>
                                        <td style={{...tdStyle, minWidth: '100px'}}>{r.containerType}</td>
                                        <td style={{...tdStyle, minWidth: '140px'}}>{r.bookingBill}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>Nâng container</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.status}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.customer}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.transportCompany}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.vehicleNumber}</td>
                                        <td style={{...tdStyle, minWidth: '100px'}}>{r.driverName}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{r.driverPhone}</td>
                                        <td style={{...tdStyle, minWidth: '160px'}}>{r.appointmentTime || '-'}</td>
                                        <td style={{...tdStyle, minWidth: '160px'}}>{r.timeIn || '-'}</td>
                                        <td style={{...tdStyle, minWidth: '160px'}}>{r.timeOut || '-'}</td>
                                        <td style={{...tdStyle, minWidth: '120px'}}>{typeof r.totalAmount === 'number' ? r.totalAmount.toLocaleString('vi-VN') : '-'}</td>
                                        <td style={{...tdStyle, minWidth: '150px'}}>{r.paymentStatus || '-'}</td>
                                        <td style={{...tdStyle, minWidth: '100px'}}>
                                            <button 
                                                type="button" 
                                                className="btn btn-light" 
                                                style={{ padding: '6px 10px', fontSize: 12 }}
                                                onClick={async () => {
                                                    try {
                                                        const res = await requestService.getRequestFiles(r.id);
                                                        const files = res?.data?.data || [];
                                                        if (!files.length) { alert('Chưa có chứng từ'); return; }
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
                                                      } catch (e) { alert('Không tải được chứng từ'); }
                                                }}
                                            >
                                                {r.documentsCount ?? 0} file
                                            </button>
                                        </td>
                                        <td style={{...tdStyle, minWidth: '150px'}}>{r.notes || ''}</td>
                                        <td style={{ ...tdStyle, minWidth: '200px', whiteSpace: 'nowrap' }}>
                                            <button 
                                                type="button" 
                                                className="btn btn-primary" 
                                                style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}
                                                onClick={() => handleUpdateClick(r.id)}
                                                disabled={processingIds.has(r.id) || loading}
                                            >
                                                {processingIds.has(r.id) ? 'Đang xử lý...' : 'Cập nhật thông tin'}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-danger" 
                                                style={{ padding: '6px 10px', fontSize: 12 }}
                                                onClick={() => handleDeleteClick(r.id)}
                                                disabled={processingIds.has(r.id) || loading}
                                            >
                                                {processingIds.has(r.id) ? 'Đang xử lý...' : 'Xóa'}
                                            </button>
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
