import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

interface ImportRequestProps {
	localSearch: string;
	setLocalSearch: (search: string) => void;
	localType: string;
	setLocalType: (type: string) => void;
	localStatus: string;
	setLocalStatus: (status: string) => void;
}

export const ImportRequest: React.FC<ImportRequestProps> = ({
	localSearch,
	setLocalSearch,
	localType,
	setLocalType,
	localStatus,
	setLocalStatus
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

    // Helper sinh 15 dòng mock
    const createMockLiftRows = (): LiftRequestRow[] => {
        const shippingLines = ['MSC', 'CMA CGM', 'COSCO', 'Maersk', 'Hapag-Lloyd', 'ONE', 'Yang Ming'];
        const customers = ['Công ty ABC', 'Công ty DEF', 'Công ty GHI', 'Công ty JKL', 'Công ty MNO'];
        const transports = ['Nhà xe XYZ', 'Nhà xe ABC', 'Nhà xe DEF', 'Nhà xe GHI', 'Nhà xe JKL'];
        const statuses = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];
        const types = ['20FT', '40FT'];
        const rows: LiftRequestRow[] = [];
        for (let i = 0; i < 15; i++) {
            const idx = i % shippingLines.length;
            const id = (i + 1).toString();
            const num = (i + 1).toString().padStart(3, '0');
            const contPrefix = ['MSCU', 'CMAU', 'COSU', 'MRKU', 'HLBU', 'ONEY', 'YMLU'][idx];
            const vehiclePrefix = ['51A', '51B', '51C', '51D', '51E'][i % 5];
            const hour = 8 + (i % 6); // 08..13
            const minute = (i * 7) % 60; // 00..59
            rows.push({
                id,
                shippingLine: `${shippingLines[idx]}`,
                requestNo: `REQ-2024-${num}`,
                containerNo: `${contPrefix}${(1000000 + i * 137).toString().slice(0, 7)}`,
                containerType: types[i % 2],
                bookingBill: `BK-2024-${num}`,
                serviceType: 'Nâng container',
                status: statuses[i % statuses.length],
                customer: customers[i % customers.length],
                transportCompany: transports[i % transports.length],
                vehicleNumber: `${vehiclePrefix}-${(10000 + i * 123).toString().slice(0, 5)}`,
                driverName: ['Nguyễn Văn A','Trần Thị B','Lê Văn C','Phạm Văn D','Hoàng Thị E'][i % 5],
                driverPhone: `090${(1234567 + i * 321).toString().slice(0,7)}`,
                appointmentTime: `2024-01-${(14 + (i % 5)).toString().padStart(2,'0')} ${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`,
                timeIn: `2024-01-${(14 + (i % 5)).toString().padStart(2,'0')} ${hour.toString().padStart(2,'0')}:${((minute+5)%60).toString().padStart(2,'0')}`,
                timeOut: i % 3 === 2 ? `2024-01-${(14 + (i % 5)).toString().padStart(2,'0')} ${(hour+2).toString().padStart(2,'0')}:${((minute+20)%60).toString().padStart(2,'0')}` : (i % 3 === 1 ? null as any : `2024-01-${(14 + (i % 5)).toString().padStart(2,'0')} ${(hour+2).toString().padStart(2,'0')}:${((minute+30)%60).toString().padStart(2,'0')}`),
                totalAmount: 2000000 + (i % 6) * 250000,
                paymentStatus: i % 2 === 0 ? 'Chưa thanh toán' : 'Đã thanh toán',
                documentsCount: (i % 6) + 1,
                notes: ['Container cần kiểm tra kỹ','Container hàng điện tử','Container hàng may mặc','Container thực phẩm',''] [i % 5]
            });
        }
        return rows;
    };

    // Dữ liệu tạm thời (placeholder). Khi có API list, thay bằng fetch từ service.
    const [rows, setRows] = React.useState<LiftRequestRow[]>(createMockLiftRows());

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
                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
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
