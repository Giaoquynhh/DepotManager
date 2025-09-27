import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { sealsApi, SealUsageHistoryItem } from '../../../services/seals';

interface SealUsageHistoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	seal: any | null;
}

// Sử dụng interface từ service

export const SealUsageHistoryModal: React.FC<SealUsageHistoryModalProps> = ({
	isOpen,
	onClose,
	seal
}) => {
	const { t } = useTranslation();
	const [historyItems, setHistoryItems] = useState<SealUsageHistoryItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load real data from API
	useEffect(() => {
		if (isOpen && seal) {
			setLoading(true);
			setError(null);
			
			const loadHistory = async () => {
				try {
					const data = await sealsApi.getUsageHistory(seal.id);
					setHistoryItems(data);
				} catch (err: any) {
					console.error('Error loading seal usage history:', err);
					setError(err?.response?.data?.message || 'Không thể tải lịch sử sử dụng seal');
					setHistoryItems([]);
				} finally {
					setLoading(false);
				}
			};

			loadHistory();
		}
	}, [isOpen, seal]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('vi-VN');
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString('vi-VN');
	};

	if (!isOpen) return null;

	return (
		<>
			<div 
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(4px)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 1000,
					padding: '20px'
				}}
				onClick={onClose}
			>
				<div 
					style={{
						background: 'white',
						borderRadius: '16px',
						boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
						maxWidth: '1000px',
						width: '100%',
						maxHeight: '90vh',
						overflowY: 'auto'
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '24px 24px 0 24px',
						borderBottom: '1px solid #e2e8f0',
						paddingBottom: '20px',
						marginBottom: '24px'
					}}>
						<div>
							<h2 style={{
								fontSize: '24px',
								fontWeight: '700',
								color: '#1e293b',
								margin: 0,
								marginBottom: '4px'
							}}>Lịch sử sử dụng Seal</h2>
							{seal && (
								<p style={{
									fontSize: '14px',
									color: '#64748b',
									margin: 0
								}}>
									Hãng tàu: {seal.shipping_company} | Số lượng còn lại: {seal.quantity_remaining}
								</p>
							)}
						</div>
						<button 
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '8px',
								borderRadius: '8px',
								color: '#64748b',
								transition: 'all 0.2s ease'
							}}
							onClick={onClose}
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M18 6L6 18M6 6l12 12"/>
							</svg>
						</button>
					</div>

					{/* Content */}
					<div style={{ padding: '0 24px 24px 24px' }}>
						{loading ? (
							<div style={{
								textAlign: 'center',
								padding: '40px 20px',
								color: '#64748b'
							}}>
								<div style={{
									width: '40px',
									height: '40px',
									border: '4px solid #e2e8f0',
									borderTop: '4px solid #3b82f6',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
									margin: '0 auto 16px'
								}}></div>
								Đang tải lịch sử...
							</div>
						) : error ? (
							<div style={{
								textAlign: 'center',
								padding: '40px 20px',
								color: '#ef4444'
							}}>
								<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 16px', color: '#ef4444' }}>
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="15" y1="9" x2="9" y2="15"></line>
									<line x1="9" y1="9" x2="15" y2="15"></line>
								</svg>
								<p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Lỗi tải dữ liệu</p>
								<p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{error}</p>
							</div>
						) : historyItems.length > 0 ? (
							<div style={{ overflowX: 'auto' }}>
								<table style={{
									width: '100%',
									borderCollapse: 'collapse',
									background: 'white',
									minWidth: '800px'
								}}>
									<thead>
										<tr style={{ background: '#f8fafc' }}>
											<th style={{
												padding: '12px 16px',
												textAlign: 'left',
												fontWeight: '600',
												color: '#374151',
												borderBottom: '1px solid #e5e7eb',
												fontSize: '14px'
											}}>Số seal</th>
											<th style={{
												padding: '12px 16px',
												textAlign: 'left',
												fontWeight: '600',
												color: '#374151',
												borderBottom: '1px solid #e5e7eb',
												fontSize: '14px'
											}}>Số Booking</th>
											<th style={{
												padding: '12px 16px',
												textAlign: 'left',
												fontWeight: '600',
												color: '#374151',
												borderBottom: '1px solid #e5e7eb',
												fontSize: '14px'
											}}>Số container</th>
											<th style={{
												padding: '12px 16px',
												textAlign: 'left',
												fontWeight: '600',
												color: '#374151',
												borderBottom: '1px solid #e5e7eb',
												fontSize: '14px'
											}}>Ngày xuất</th>
											<th style={{
												padding: '12px 16px',
												textAlign: 'left',
												fontWeight: '600',
												color: '#374151',
												borderBottom: '1px solid #e5e7eb',
												fontSize: '14px'
											}}>Người tạo</th>
											<th style={{
												padding: '12px 16px',
												textAlign: 'left',
												fontWeight: '600',
												color: '#374151',
												borderBottom: '1px solid #e5e7eb',
												fontSize: '14px'
											}}>Thời gian tạo</th>
										</tr>
									</thead>
									<tbody>
										{historyItems.map((item, index) => (
											<tr 
												key={item.id}
												style={{
													borderBottom: '1px solid #f3f4f6',
													transition: 'background-color 0.2s ease'
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.backgroundColor = '#f9fafb';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.backgroundColor = 'transparent';
												}}
											>
												<td style={{
													padding: '12px 16px',
													color: '#374151',
													fontSize: '14px',
													fontWeight: '500'
												}}>{item.seal_number}</td>
												<td style={{
													padding: '12px 16px',
													color: '#374151',
													fontSize: '14px',
													fontWeight: item.booking_number ? '500' : '400'
												}}>{item.booking_number || 'Chưa có'}</td>
												<td style={{
													padding: '12px 16px',
													color: '#374151',
													fontSize: '14px',
													fontFamily: 'monospace'
												}}>{item.container_number || 'N/A'}</td>
												<td style={{
													padding: '12px 16px',
													color: '#374151',
													fontSize: '14px'
												}}>{formatDate(item.export_date)}</td>
												<td style={{
													padding: '12px 16px',
													color: '#374151',
													fontSize: '14px'
												}}>{item.created_by || 'N/A'}</td>
												<td style={{
													padding: '12px 16px',
													color: '#64748b',
													fontSize: '13px'
												}}>{formatDateTime(item.created_at)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div style={{
								textAlign: 'center',
								padding: '40px 20px',
								color: '#64748b'
							}}>
								<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 16px', color: '#d1d5db' }}>
									<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
								<p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Chưa có lịch sử sử dụng</p>
								<p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Seal này chưa được sử dụng cho container nào</p>
							</div>
						)}
					</div>
				</div>
			</div>

			<style jsx>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</>
	);
};
