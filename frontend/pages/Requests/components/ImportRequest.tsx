import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { requestService } from '../../../services/requests';

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

    // Function để fetch requests từ API
    const fetchRequests = async () => {
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
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1200 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', color: '#0f172a' }}>
                                    <th style={thStyle}>Hãng tàu</th>
                                    <th style={thStyle}>Số yêu cầu</th>
                                    <th style={thStyle}>Số Cont</th>
                                    <th style={thStyle}>Loại cont</th>
                                    <th style={thStyle}>Số Booking/Bill</th>
                                    <th style={thStyle}>Loại dịch vụ</th>
                                    <th style={thStyle}>Trạng thái</th>
                                    <th style={thStyle}>Khách hàng</th>
                                    <th style={thStyle}>Nhà xe</th>
                                    <th style={thStyle}>Số xe</th>
                                    <th style={thStyle}>Tài xế</th>
                                    <th style={thStyle}>SDT Tài xế</th>
                                    <th style={thStyle}>Thời gian hẹn</th>
                                    <th style={thStyle}>Giờ vào thực tế</th>
                                    <th style={thStyle}>Giờ ra thực tế</th>
                                    <th style={thStyle}>Tổng tiền</th>
                                    <th style={thStyle}>Trạng thái thanh toán</th>
                                    <th style={thStyle}>Chứng từ</th>
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
                                        <td style={tdStyle}>{r.bookingBill}</td>
                                        <td style={tdStyle}>Nâng container</td>
                                        <td style={tdStyle}>{r.status}</td>
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
                                            <button type="button" className="btn btn-light" style={{ padding: '6px 10px', fontSize: 12 }}>
                                                {r.documentsCount ?? 0} file
                                            </button>
                                        </td>
                                        <td style={tdStyle}>{r.notes || ''}</td>
                                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                                            <button type="button" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}>
                                                Cập nhật thông tin
                                            </button>
                                            <button type="button" className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 12 }}>
                                                Hủy
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
