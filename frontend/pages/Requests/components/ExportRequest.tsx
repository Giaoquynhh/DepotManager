import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

interface ExportRequestProps {
	localSearch: string;
	setLocalSearch: (search: string) => void;
	localType: string;
	setLocalType: (type: string) => void;
	localStatus: string;
	setLocalStatus: (status: string) => void;
}

export const ExportRequest: React.FC<ExportRequestProps> = ({
	localSearch,
	setLocalSearch,
	localType,
	setLocalType,
	localStatus,
	setLocalStatus
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
	};

    // Helper sinh 15 dòng mock
    const createMockLowerRows = (): LowerRequestRow[] => {
        const shippingLines = ['Hapag-Lloyd', 'OOCL', 'Yang Ming', 'Maersk', 'CMA CGM', 'ONE'];
        const customers = ['Công ty JKL', 'Công ty MNO', 'Công ty PQR', 'Công ty STU'];
        const transports = ['Nhà xe GHI', 'Nhà xe JKL', 'Nhà xe MNO', 'Nhà xe PQR'];
        const statuses = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];
        const types = ['20FT', '40FT'];
        const demDet = ['DEM', 'DET'];
        const rows: LowerRequestRow[] = [];
        for (let i = 0; i < 15; i++) {
            const idx = i % shippingLines.length;
            const id = (i + 1).toString();
            const num = (101 + i).toString();
            const contPrefix = ['HLBU','OOLU','YMLU','MRKU','CMAU','ONEY'][idx];
            const vehiclePrefix = ['51D','51E','51F','51G'][i % 4];
            const hour = 9 + (i % 6);
            const minute = (i * 9) % 60;
            rows.push({
                id,
                shippingLine: shippingLines[idx],
                requestNo: `REQ-2024-${num}`,
                containerNo: `${contPrefix}${(1234567 + i * 211).toString().slice(0,7)}`,
                containerType: types[i % 2],
                serviceType: 'Hạ container',
                status: statuses[i % statuses.length],
                customer: customers[i % customers.length],
                transportCompany: transports[i % transports.length],
                vehicleNumber: `${vehiclePrefix}-${(20000 + i * 97).toString().slice(0,5)}`,
                driverName: ['Phạm Văn D','Hoàng Thị E','Vũ Văn F','Ngô Thị G'][i % 4],
                driverPhone: `090${(2222222 + i * 111).toString().slice(0,7)}`,
                appointmentTime: `2024-01-${(16 + (i % 5)).toString().padStart(2,'0')} ${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`,
                timeIn: `2024-01-${(16 + (i % 5)).toString().padStart(2,'0')} ${hour.toString().padStart(2,'0')}:${((minute+5)%60).toString().padStart(2,'0')}`,
                timeOut: i % 3 === 1 ? null as any : `2024-01-${(16 + (i % 5)).toString().padStart(2,'0')} ${(hour+2).toString().padStart(2,'0')}:${((minute+25)%60).toString().padStart(2,'0')}`,
                totalAmount: 2100000 + (i % 6) * 190000,
                paymentStatus: i % 2 === 0 ? 'Chưa thanh toán' : 'Đã thanh toán',
                documentsCount: (i % 5) + 1,
                demDet: demDet[i % 2],
                notes: ['Container hàng thực phẩm','Container hàng dệt may','Container điện tử',''] [i % 4]
            });
        }
        return rows;
    };

    // Dữ liệu tạm thời (placeholder). Khi có API list, thay bằng fetch từ service.
    const [rows, setRows] = React.useState<LowerRequestRow[]>(createMockLowerRows());

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
							<option value="EXPORT">Yêu cầu hạ container</option>
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
										<td style={tdStyle}>{r.demDet || '-'}</td>
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
