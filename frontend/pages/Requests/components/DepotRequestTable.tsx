import React from 'react';
import DepotChatMini from './DepotChatMini';
import { useTranslation } from '../../../hooks/useTranslation';

interface DepotRequestTableProps {
	data?: any[];
	loading?: boolean;
	onDocumentClick?: (doc: any) => void;
	onToggleSupplement?: (requestId: string) => void;
	onChangeAppointment?: (requestId: string) => void;
	onReject?: (requestId: string) => void;
	onChangeStatus?: (id: string, status: string) => void;
	onSendPayment?: (id: string) => void;
	onSoftDelete?: (id: string, scope: string) => void;
	onViewInvoice?: (id: string) => void;
	onSendCustomerConfirmation?: (id: string) => void;
	loadingId?: string;
	// Chat props
	activeChatRequests?: Set<string>;
	onToggleChat?: (requestId: string) => void;
	onCloseChat?: (requestId: string) => void;
	// UI/UX additions
	userRole?: string;
	actLabel?: Record<string, string>;
	onRequestSort?: () => void; // toggle sort by ETA
	sortKey?: 'eta';
	sortOrder?: 'asc' | 'desc';
	onContainerClick?: (item: any) => void;
}

export default function DepotRequestTable({ 
	data, 
	loading, 
	onDocumentClick,
	onToggleSupplement,
	onChangeAppointment,
	onReject,
	onChangeStatus,
	onSendPayment,
	onSoftDelete,
	onViewInvoice,
	onSendCustomerConfirmation,
	loadingId,
	// Chat props
	activeChatRequests = new Set(),
	onToggleChat,
	onCloseChat,
	// UI/UX additions
	userRole,
	actLabel,
	onRequestSort,
	sortKey,
	sortOrder,
	onContainerClick
}: DepotRequestTableProps) {
	const { t } = useTranslation();

	// Fallback khi key i18n thiếu: trả về fallback thay vì hiển thị chính key
	const safeT = (key: string, fallback: string) => {
		const v = t(key) as string;
		return v && v !== key ? v : fallback;
	};

	const formatETA = (eta?: string) => {
		if (!eta) return '-';
		const d = new Date(eta);
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
	};
	const getStatusBadge = (status: string) => {
		const statusConfig: Record<string, { label: string; className: string }> = {
			SCHEDULED: { label: safeT('pages.requests.filterOptions.scheduled', 'Đã lên lịch'), className: 'status-scheduled' },
			PENDING: { label: safeT('pages.requests.filterOptions.pending', 'Đang chờ'), className: 'status-pending' },
			RECEIVED: { label: safeT('pages.requests.filterOptions.received', 'Đã tiếp nhận'), className: 'status-received' },
			APPROVED: { label: safeT('pages.requests.filterOptions.approved', 'Đã duyệt'), className: 'status-approved' },
			IN_PROGRESS: { label: safeT('pages.requests.filterOptions.inProgress', 'Đang xử lý'), className: 'status-in-progress' },
			COMPLETED: { label: safeT('pages.requests.filterOptions.completed', 'Hoàn tất'), className: 'status-completed' },
			EXPORTED: { label: safeT('pages.requests.filterOptions.exported', 'Xuất kho'), className: 'status-exported' },
			REJECTED: { label: safeT('pages.requests.filterOptions.rejected', 'Từ chối'), className: 'status-rejected' },
			IN_YARD: { label: safeT('pages.requests.filterOptions.inYard', 'Trong bãi'), className: 'status-in-yard' },
			LEFT_YARD: { label: safeT('pages.requests.filterOptions.leftYard', 'Rời bãi'), className: 'status-left-yard' },
			PENDING_ACCEPT: { label: safeT('pages.requests.filterOptions.pendingAccept', 'Chờ xác nhận'), className: 'status-pending-accept' },
			CHECKING: { label: safeT('pages.requests.filterOptions.checking', 'Đang kiểm tra'), className: 'status-checking' },
			CHECKED: { label: safeT('pages.requests.filterOptions.checked', 'Đã kiểm tra'), className: 'status-checked' },
			GATE_IN: { label: safeT('pages.requests.filterOptions.gateIn', 'Đã cho phép vào'), className: 'status-gate-in' },
			GATE_OUT: { label: safeT('pages.requests.filterOptions.gateOut', 'Đã cho phép ra'), className: 'status-gate-out' },
			GATE_REJECTED: { label: safeT('pages.requests.filterOptions.gateRejected', 'Đã từ chối'), className: 'status-gate-rejected' }
		};

		const config = statusConfig[status] || { label: status, className: 'status-default' };
		return (
			<span className={`status-badge ${config.className}`}>
				{config.label}
			</span>
		);
	};

	const getTypeLabel = (type: string) => {
		const typeLabels: Record<string, string> = {
			IMPORT: t('pages.requests.filterOptions.import'),
			EXPORT: t('pages.requests.filterOptions.export'),
			CONVERT: t('pages.requests.filterOptions.convert')
		};
		return typeLabels[type as keyof typeof typeLabels] || type;
	};

	if (loading) {
		return (
			<div className="table-loading modern-loading">
				<div className="loading-spinner"></div>
				<p>{t('common.loading')}</p>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="table-empty modern-empty">
				<div className="empty-icon">📋</div>
				<p>{t('pages.requests.noRequests')}</p>
				<small>{t('pages.requests.noRequestsSubtitle')}</small>
			</div>
		);
	}

	return (
		<div className="table-container">
			<table className="table table-modern">
				<thead>
					<tr>
						<th data-column="container">{safeT('pages.requests.tableHeaders.container', 'Container')}</th>
						<th data-column="eta">
							<button
								onClick={onRequestSort}
								className="th-sort-btn"
								title={t('common.sortBy') || 'Sắp xếp'}
								style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
							>
								{safeT('pages.requests.tableHeaders.eta', 'ETA')}
								{sortKey === 'eta' && (
									<span style={{ marginLeft: 6 }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
								)}
							</button>
						</th>
						<th data-column="status">{safeT('pages.requests.tableHeaders.status', 'Trạng thái')}</th>
						<th data-column="documents">{safeT('pages.requests.tableHeaders.documents', 'Chứng từ')}</th>
						<th data-column="chat">{safeT('pages.requests.tableHeaders.chat', 'Chat')}</th>
						<th data-column="actions">{safeT('pages.requests.tableHeaders.actions', 'Hành động')}</th>
					</tr>
				</thead>
				<tbody>
					{data.map((item) => {
						// Demo data - Chỉ có supplement cho một số SCHEDULED orders (không phải tất cả)
						const demoItem = {
							...item,
							has_supplement_documents: item.has_supplement_documents || (item.status === 'SCHEDULED' && item.container_no === 'ISO 1234' ? true : false),
							last_supplement_update: item.last_supplement_update || (item.status === 'SCHEDULED' && item.container_no === 'ISO 1234' ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null)
						};
						
						return (
						<tr key={item.id} className="table-row">
							<td>
								<button
									onClick={() => onContainerClick?.(item)}
									className="container-link"
									title={t('pages.requests.viewDetail') || 'Xem chi tiết'}
								>
									<span className="container-text">{item.container_no}</span>
								</button>
							</td>
							<td>
							{item.eta ? (
								<div className="eta-date">
									{formatETA(item.eta)}
								</div>
							) : (
								<div className="eta-empty">-</div>
							)}
							</td>
							<td>
								{getStatusBadge(item.status)}
							</td>
							<td>
							{item.documents && item.documents.length > 0 ? (
								<div className="doc-chips" role="list">
									{item.documents.slice(0, 2).map((doc: any) => {
											const name = doc.name || '';
											const m = name.match(/\.([a-z0-9]+)$/i);
											const ext = m ? m[1].toLowerCase() : 'file';
											return (
												<button
													key={doc.id}
													className="doc-chip"
													data-filetype={ext}
													onClick={() => onDocumentClick?.(doc)}
													title={name}
													role="listitem"
												>
													<span className="doc-ic" aria-hidden="true"></span>
													<span className="doc-label">{name}</span>
												</button>
											);
										})}
										{item.documents.length > 2 && (
											<span
												className="doc-chip more"
												title={item.documents.slice(2).map((d: any) => d.name).join(', ')}
												aria-label={`+${item.documents.length - 2} tài liệu khác`}
												role="listitem"
											>
												+{item.documents.length - 2}
											</span>
										)}
								</div>
							) : (
								<span className="no-document">-</span>
							)}
						</td>

							<td>
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
									{/* Chat button - hiển thị cho các trạng thái được phép chat */}
									{(demoItem.status === 'SCHEDULED' || 
									  demoItem.status === 'APPROVED' || 
									  demoItem.status === 'IN_PROGRESS' || 
									  demoItem.status === 'COMPLETED' || 
									  demoItem.status === 'EXPORTED' ||
									  demoItem.status === 'PENDING_ACCEPT') && (
										<button
											onClick={() => onToggleChat?.(demoItem.id)}
											className="depot-chat-mini-trigger"
											title={activeChatRequests.has(demoItem.id) ? "Đóng chat" : "Mở chat với khách hàng"}
											style={{
												background: activeChatRequests.has(demoItem.id) ? '#10b981' : '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												padding: '6px 12px',
												fontSize: '12px',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												gap: '4px'
											}}
										>
											{/* Icon-only chat button */}
											<span aria-hidden="true">💬</span>
										</button>
									)}
									
									{/* Chat window - hiển thị khi chat được mở */}
									{activeChatRequests.has(demoItem.id) && (
										<DepotChatMini
											requestId={demoItem.id}
											containerNo={demoItem.container_no}
											requestType={demoItem.type}
											requestStatus={demoItem.status}
											hasSupplementDocuments={demoItem.has_supplement_documents}
											lastSupplementUpdate={demoItem.last_supplement_update}
											onClose={() => onCloseChat?.(demoItem.id)}
										/>
									)}
									
									{/* Indicator cho supplement documents */}
									{demoItem.has_supplement_documents && (
										<div style={{
											fontSize: '10px',
											color: '#f59e0b',
											background: '#fef3c7',
											padding: '2px 6px',
											borderRadius: '10px',
											border: '1px solid #f59e0b'
										}}>
											📋 Có tài liệu bổ sung
										</div>
									)}
								</div>
							</td>
							<td>
								<div className="action-buttons">
								{item.status === 'PENDING' && (
									<button
										className="btn btn-sm btn-primary btn-compact"
										disabled={loadingId === item.id + 'RECEIVED'}
										onClick={() => onChangeStatus?.(item.id, 'RECEIVED')}
										aria-label={actLabel?.RECEIVED || 'Tiếp nhận'}
										title={actLabel?.RECEIVED || 'Tiếp nhận'}
									>
										<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'RECEIVED' ? '⏳' : '✅'}</span>
										<span className="btn-label">{actLabel?.RECEIVED || 'Tiếp nhận'}</span>
									</button>
								)}
								{item.status === 'SCHEDULED' && (
									<>
										<button
											className="btn btn-sm btn-success btn-compact"
											onClick={() => onChangeAppointment?.(item.id)}
											title="Thay đổi lịch hẹn với khách hàng"
											aria-label="Thay đổi lịch hẹn"
										>
											<span className="btn-ic" aria-hidden="true">📅</span>
											<span className="btn-label">Thay đổi lịch hẹn</span>
										</button>
										<button
											className="btn btn-sm btn-danger btn-compact"
											disabled={loadingId === item.id + 'REJECTED'}
											onClick={() => onReject?.(item.id)}
											title="Từ chối yêu cầu"
											aria-label="Từ chối"
										>
											<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'}</span>
											<span className="btn-label">Từ chối</span>
										</button>
									</>
								)}
								{(item.status === 'PENDING' || item.status === 'RECEIVED') && (
									<button
										className="btn btn-sm btn-danger btn-compact"
										disabled={loadingId === item.id + 'REJECTED'}
										onClick={() => onChangeStatus?.(item.id, 'REJECTED')}
										aria-label={actLabel?.REJECTED || 'Từ chối'}
										title={actLabel?.REJECTED || 'Từ chối'}
									>
										<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'}</span>
										<span className="btn-label">{actLabel?.REJECTED || 'Từ chối'}</span>
									</button>
								)}
								{item.status === 'RECEIVED' && (
									<>
										<button
											className="btn btn-sm btn-success btn-compact"
											disabled={loadingId === item.id + 'COMPLETED'}
											onClick={() => onChangeStatus?.(item.id, 'COMPLETED')}
											title="Tiếp nhận và hoàn tất"
											aria-label={actLabel?.COMPLETED || 'Tiếp nhận'}
										>
											<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'COMPLETED' ? '⏳' : '✅'}</span>
											<span className="btn-label">{actLabel?.COMPLETED || 'Tiếp nhận'}</span>
										</button>
										<button
											className="btn btn-sm btn-danger btn-compact"
											disabled={loadingId === item.id + 'REJECTED'}
											onClick={() => onChangeStatus?.(item.id, 'REJECTED')}
											title="Từ chối yêu cầu"
											aria-label={actLabel?.REJECTED || 'Từ chối'}
										>
											<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'}</span>
											<span className="btn-label">{actLabel?.REJECTED || 'Từ chối'}</span>
										</button>
									</>
								)}
								{item.status === 'COMPLETED' && (
									<button
										className="btn btn-sm btn-warning btn-compact"
										disabled={loadingId === item.id + 'EXPORTED'}
										onClick={() => onChangeStatus?.(item.id, 'EXPORTED')}
										aria-label={actLabel?.EXPORTED || 'Xuất kho'}
										title={actLabel?.EXPORTED || 'Xuất kho'}
									>
										<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'EXPORTED' ? '⏳' : '📦'}</span>
										<span className="btn-label">{actLabel?.EXPORTED || 'Xuất kho'}</span>
									</button>
								)}
								{item.status === 'COMPLETED' && (
									<button
										className="btn btn-sm btn-info btn-compact"
										disabled={loadingId === item.id + 'PAY'}
										onClick={() => onSendPayment?.(item.id)}
										aria-label="Thanh toán"
										title="Thanh toán"
									>
										<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'PAY' ? '⏳' : '💰'}</span>
										<span className="btn-label">Thanh toán</span>
									</button>
								)}
								{/* Actions cho trạng thái PENDING_ACCEPT */}
								{item.status === 'PENDING_ACCEPT' && (
									<>
										<button
											className="btn btn-sm btn-info btn-compact"
											disabled={loadingId === item.id + 'VIEW_INVOICE'}
											onClick={() => onViewInvoice?.(item.id)}
											title="Xem hóa đơn sửa chữa"
											aria-label="Xem hóa đơn"
										>
											<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'VIEW_INVOICE' ? '⏳' : '📄'}</span>
											<span className="btn-label">Xem hóa đơn</span>
										</button>
										<button
											className="btn btn-sm btn-success btn-compact"
											disabled={loadingId === item.id + 'CONFIRM'}
											onClick={() => onSendCustomerConfirmation?.(item.id)}
											title="Gửi xác nhận cho khách hàng"
											aria-label="Gửi xác nhận"
										>
											<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'CONFIRM' ? '⏳' : '📧'}</span>
											<span className="btn-label">Gửi xác nhận</span>
										</button>
									</>
								)}
								{/* Soft delete buttons */}
								{['REJECTED', 'COMPLETED', 'EXPORTED'].includes(item.status) && (
									<button
										className="btn btn-sm btn-outline btn-compact"
										disabled={loadingId === item.id + 'DELETE'}
										onClick={() => {
											if (window.confirm('Xóa khỏi danh sách Kho?\nRequest vẫn hiển thị trạng thái Từ chối bên Khách hàng.')) {
												onSoftDelete?.(item.id, 'depot');
											}
										}}
										title="Xóa khỏi danh sách Kho"
										aria-label="Xóa"
									>
										<span className="btn-ic" aria-hidden="true">{loadingId === item.id + 'DELETE' ? '⏳' : '🗑️'}</span>
										<span className="btn-label">Xóa</span>
									</button>
								)}
																</div>
						</td>
					</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
