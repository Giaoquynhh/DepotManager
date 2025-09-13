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
	onDeleteWithModal?: (id: string) => void;
	onViewInvoice?: (id: string) => void;
	onSendCustomerConfirmation?: (id: string) => void;
	onAddDocument?: (requestId: string, containerNo: string) => void;
	onUploadDocument?: (requestId: string) => void;
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
	onDeleteWithModal,
	onViewInvoice,
	onSendCustomerConfirmation,
	onAddDocument,
	onUploadDocument,
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
	// i18n
	const { t } = useTranslation();
	const safeT = (key: string, fallback: string) => {
		const v = t(key) as string;
		return v && v !== key ? v : fallback;
	};

	// Định dạng ETA giống với trang cha
	const formatETA = (eta?: string) => {
		if (!eta) return '-';
		const d = new Date(eta);
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
	};
	const getStatusBadge = (status: string) => {
		const statusConfig: Record<string, { label: string; className: string }> = {
			PENDING: { label: safeT('pages.requests.filterOptions.pending', 'Pending'), className: 'status-pending' },
			PICK_CONTAINER: { label: safeT('pages.requests.filterOptions.pickContainer', 'Pick container'), className: 'status-pick-container' },
			RECEIVED: { label: safeT('pages.requests.filterOptions.received', 'Received'), className: 'status-received' },
			COMPLETED: { label: safeT('pages.requests.filterOptions.completed', 'Completed'), className: 'status-completed' },
			EXPORTED: { label: safeT('pages.requests.filterOptions.exported', 'Exported'), className: 'status-exported' },
			REJECTED: { label: safeT('pages.requests.filterOptions.rejected', 'Rejected'), className: 'status-rejected' },
			SCHEDULED: { label: safeT('pages.requests.filterOptions.scheduled', 'Đã lên lịch'), className: 'status-scheduled' },
			FORWARDED: { label: safeT('pages.gate.statusOptions.forwarded', 'Đã chuyển tới cổng'), className: 'status-forwarded' },
			IN_YARD: { label: safeT('pages.requests.filterOptions.inYard', 'In yard'), className: 'status-in-yard' },
			IN_CAR: { label: safeT('pages.requests.filterOptions.inCar', 'In car'), className: 'status-in-car' },
			LEFT_YARD: { label: safeT('pages.requests.filterOptions.leftYard', 'Left yard'), className: 'status-left-yard' },
			PENDING_ACCEPT: { label: safeT('pages.requests.filterOptions.pendingAccept', 'Pending confirmation'), className: 'status-pending-accept' },
			CHECKING: { label: safeT('pages.requests.filterOptions.checking', 'Checking'), className: 'status-checking' },
			CHECKED: { label: safeT('pages.requests.filterOptions.checked', 'Checked'), className: 'status-checked' },
			GATE_IN: { label: safeT('pages.gate.statusOptions.gateIn', 'Gate In'), className: 'status-gate-in' },
			GATE_OUT: { label: safeT('pages.gate.statusOptions.gateOut', 'Gate Out'), className: 'status-gate-out' },
			GATE_REJECTED: { label: safeT('pages.gate.statusOptions.gateRejected', 'Gate Rejected'), className: 'status-gate-rejected' },
			POSITIONED: { label: safeT('pages.requests.filterOptions.positioned', 'Positioned in yard'), className: 'status-positioned' },
			FORKLIFTING: { label: safeT('pages.requests.filterOptions.forklifting', 'Forklifting'), className: 'status-forklifting' }
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

	const getTypeBadge = (type?: string) => {
		const label = type ? getTypeLabel(type) : '-';
		const typeKey = (type || '').toLowerCase();
		return (
			<span className={`type-badge ${typeKey ? `type-${typeKey}` : ''}`}>
				{label || '-'}
			</span>
		);
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
		<div className="gate-table-container">
			<table className="gate-table">
					<thead>
						<tr>
							<th data-column="type" style={{ width: '100px', minWidth: '100px' }}>{safeT('pages.requests.tableHeaders.type', 'Loại')}</th>
							<th data-column="container" style={{ width: '120px', minWidth: '120px' }}>{safeT('pages.requests.tableHeaders.container', 'Container')}</th>
							<th data-column="eta" style={{ width: '120px', minWidth: '120px' }}>
							<button
								onClick={onRequestSort}
								className="th-sort-btn"
								title={safeT('common.sortBy', 'Sort by')}
								style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', width: '100%', textAlign: 'left' }}
							>
								{safeT('pages.requests.tableHeaders.eta', 'ETA')}
								{sortKey === 'eta' && (
									<span style={{ marginLeft: 4 }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
								)}
							</button>
						</th>
						<th data-column="status" style={{ whiteSpace: 'nowrap', width: '180px', minWidth: '180px' }}>{safeT('pages.requests.tableHeaders.status', 'Trạng thái')}</th>
						<th data-column="documents" style={{ width: '160px', minWidth: '160px' }}>{safeT('pages.requests.tableHeaders.documents', 'Chứng từ')}</th>
						<th data-column="payment" style={{ width: '140px', minWidth: '140px' }}>{safeT('pages.requests.tableHeaders.payment', 'Thanh toán')}</th>
						<th data-column="chat" style={{ width: '100px', minWidth: '100px' }}>{safeT('pages.requests.tableHeaders.chat', 'Chat')}</th>
						<th data-column="actions" style={{ width: '150px', minWidth: '150px' }}>{safeT('pages.requests.tableHeaders.actions', 'Hành động')}</th>
					</tr>
				</thead>
				<tbody>
					{data.map((item: any) => {
						// Demo data - Chỉ có supplement cho một số SCHEDULED orders (không phải tất cả)
						const demoItem = {
							...item,
							has_supplement_documents: item.has_supplement_documents || (item.status === 'SCHEDULED' && item.container_no === 'ISO 1234' ? true : false),
							last_supplement_update: item.last_supplement_update || (item.status === 'SCHEDULED' && item.container_no === 'ISO 1234' ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null)
						};

						// Phân loại chứng từ: chứng từ thanh toán vs chứng từ khác
						const docs: any[] = Array.isArray(item.documents) ? item.documents : [];
						const isPaymentDoc = (doc: any) => {
							const s = `${doc?.type || ''} ${doc?.category || ''} ${doc?.kind || ''} ${doc?.name || ''}`.toLowerCase();
							return s.includes('pay') || s.includes('invoice') || s.includes('hoa don') || s.includes('hóa đơn') || s.includes('hoá đơn') || s.includes('thanh toa');
						};
						const paymentDocs = docs.filter(isPaymentDoc);
						const otherDocs = docs.filter((d) => !isPaymentDoc(d));

						return (
						<tr key={item.id} className="table-row">
							<td data-column="type">
								{getTypeBadge(item.type)}
							</td>
							<td data-column="container">
								<button
									onClick={() => onContainerClick?.(item)}
									className="container-link"
									title={safeT('pages.requests.viewDetail', 'View details')}
								>
									<span className="container-text">{item.container_no}</span>
								</button>
							</td>
							<td data-column="eta">
								{item.eta ? (
									<div className="eta-date">
										{formatETA(item.eta)}
									</div>
								) : (
									<div className="eta-empty">-</div>
								)}
							</td>
							<td data-column="status">
								{getStatusBadge(item.status)}
							</td>
							<td data-column="documents">
								<div className="documents-cell">
									{otherDocs && otherDocs.length > 0 ? (
										<>
											<div className="document-count-badge">
												<div className="document-count-icon">
													<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14,2 14,8 20,8"></polyline>
														<line x1="16" y1="13" x2="8" y2="13"></line>
														<line x1="16" y1="17" x2="8" y2="17"></line>
														<polyline points="10,9 9,9 8,9"></polyline>
													</svg>
												</div>
												<div className="document-count-content">
													<span className="document-count-number">{otherDocs.length}</span>
													<span className="document-count-label">{safeT('pages.requests.tableHeaders.documents', 'Chứng từ')}</span>
												</div>
											</div>
											<button
												className="view-documents-btn"
												onClick={() => onDocumentClick?.(otherDocs[0])}
												title={safeT('pages.requests.viewDocuments', 'View documents')}
											>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
													<circle cx="12" cy="12" r="3"></circle>
												</svg>
												{safeT('pages.requests.viewDetail', 'Xem chi tiết')}
											</button>
										</>
									) : (
										<div className="no-documents">
											<div className="no-documents-icon">
												<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
													<polyline points="14,2 14,8 20,8"></polyline>
													<line x1="16" y1="13" x2="8" y2="13"></line>
													<line x1="16" y1="17" x2="8" y2="17"></line>
													<polyline points="10,9 9,9 8,9"></polyline>
												</svg>
											</div>
											<span className="no-documents-text">{safeT('pages.requests.noDocuments', 'Chưa có chứng từ')}</span>
										</div>
									)}
								</div>
							</td>
							<td data-column="payment">
								<div className="payment-status-info">
									{/* Hiển thị trạng thái thanh toán chính */}
									<div className="payment-status">
										<span className={`status-indicator ${item.is_paid ? 'paid' : 'unpaid'}`}>
											{item.is_paid ? '💰' : '⏳'} 
											{item.is_paid ? safeT('pages.requests.payment.paid', 'Đã thanh toán') : safeT('pages.requests.payment.notPaid', 'Chưa thanh toán')}
										</span>
									</div>
									{/* Hiển thị payment documents nếu có */}
									{paymentDocs && paymentDocs.length > 0 && (
										<div className="payment-docs">
											{paymentDocs.map((doc: any) => (
												<button
													key={`pay-${doc.id}`}
													className="document-badge clickable"
													onClick={() => onDocumentClick?.(doc)}
													title={`${safeT('common.view', 'View')} ${doc.name}`}
												>
													📎 {doc.name}
												</button>
											))}
										</div>
									)}
									{/* Hiển thị trạng thái hóa đơn nếu có */}
									{item.has_invoice && (
										<div className="invoice-status">
											<span className="status-indicator has-invoice">
												📄 {safeT('pages.requests.invoice.hasInvoice', 'Có hóa đơn')}
											</span>
										</div>
									)}
								</div>
							</td>
							<td data-column="chat">
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
									{/* Chat button - luôn hiển thị; disabled nếu chưa đến trạng thái cho phép */}
									{(() => {
										const isChatAllowedByStatus = !['PENDING', 'PICK_CONTAINER'].includes(demoItem.status);
										const isPaid = !!demoItem.is_paid;
										const canOpenChat = isChatAllowedByStatus && !isPaid;
										const title = canOpenChat
											? (activeChatRequests.has(demoItem.id) ? safeT('pages.requests.chat.close', 'Close chat') : safeT('pages.requests.chat.open', 'Open chat with customer'))
											: isPaid
												? safeT('pages.requests.payment.paid', 'Đã thanh toán')
												: safeT('pages.requests.chat.availableWhenScheduled', 'Chat khả dụng từ trạng thái Scheduled');
										return (
											<button
												onClick={() => canOpenChat && onToggleChat?.(demoItem.id)}
												className="btn btn-sm btn-outline depot-chat-mini-trigger"
												title={title}
												disabled={!canOpenChat}
											>
												💬 {safeT('pages.requests.tableHeaders.chat', 'Chat')}
											</button>
										);
									})()}

									{/* Chat window - hiển thị khi chat được mở */}
									{activeChatRequests.has(demoItem.id) && !demoItem.is_paid && (
										<DepotChatMini
											requestId={demoItem.id}
											containerNo={demoItem.container_no}
											requestType={demoItem.type}
											requestStatus={demoItem.status}
											hasSupplementDocuments={demoItem.has_supplement_documents}
											lastSupplementUpdate={demoItem.last_supplement_update}
											isPaid={!!demoItem.is_paid}
											onClose={() => onCloseChat?.(demoItem.id)}
										/>
									)}
									
									{/* Indicator cho supplement documents - chỉ hiển thị cho EXPORT, không hiển thị cho IMPORT */}
									{demoItem.has_supplement_documents && demoItem.type !== 'IMPORT' && (
										<div style={{
											fontSize: '10px',
											color: '#f59e0b',
											background: '#fef3c7',
											padding: '2px 6px',
											borderRadius: '10px',
											border: '1px solid #f59e0b'
										}}>
											📋 {safeT('pages.requests.supplementAvailable', 'Supplement documents available')}
										</div>
									)}
								</div>
							</td>
							<td data-column="actions">
								<div className="action-buttons">
									{/* PENDING Status Actions */}
									{item.status === 'PENDING' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-primary"
												disabled={loadingId === item.id + 'RECEIVED'}
												onClick={() => onChangeStatus?.(item.id, 'RECEIVED')}
												title={safeT('pages.requests.actions.acceptRequest', 'Accept request')}
											>
											{loadingId === item.id + 'RECEIVED' ? '⏳' : '✅'} {safeT('pages.requests.actions.accept', 'Accept')}
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onChangeStatus?.(item.id, 'REJECTED')}
												title={safeT('pages.requests.actions.rejectRequest', 'Reject request')}
											>
											{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} {safeT('pages.requests.actions.reject', 'Reject')}
											</button>
										</div>
									)}

									{/* RECEIVED Status Actions */}
									{item.status === 'RECEIVED' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-success"
												disabled={loadingId === item.id + 'COMPLETED'}
												onClick={() => onChangeStatus?.(item.id, 'COMPLETED')}
												title={safeT('pages.requests.actions.completeRequest', 'Complete request')}
											>
											{loadingId === item.id + 'COMPLETED' ? '⏳' : '✅'} {safeT('pages.requests.actions.complete', 'Complete')}
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onChangeStatus?.(item.id, 'REJECTED')}
												title={safeT('pages.requests.actions.rejectRequest', 'Reject request')}
											>
											{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} {safeT('pages.requests.actions.reject', 'Reject')}
											</button>
										</div>
									)}

									{/* SCHEDULED Status Actions */}
									{item.status === 'SCHEDULED' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-success"
												onClick={() => onChangeAppointment?.(item.id)}
												title={safeT('pages.requests.actions.rescheduleTitle', 'Reschedule with customer')}
											>
											📅 {safeT('pages.requests.actions.reschedule', 'Reschedule')}
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onReject?.(item.id)}
												title={safeT('pages.requests.actions.rejectRequest', 'Reject request')}
											>
											{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} {safeT('pages.requests.actions.reject', 'Reject')}
											</button>
										</div>
									)}

									{/* PICK_CONTAINER Status Actions */}
									{item.status === 'PICK_CONTAINER' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-success"
												disabled={loadingId === item.id + 'UPLOAD_DOC'}
												onClick={() => onUploadDocument?.(item.id)}
												title={safeT('pages.requests.actions.uploadDocumentsTitle', 'Upload export documents (multiple files supported)')}
											>
											{loadingId === item.id + 'UPLOAD_DOC' ? '⏳' : '📄'} {safeT('pages.requests.actions.uploadDocuments', 'Upload documents')}
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onReject?.(item.id)}
												title={safeT('pages.requests.actions.rejectTitle', 'Reject request')}
											>
											{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} {safeT('pages.requests.actions.reject', 'Reject')}
											</button>
										</div>
									)}

									{/* COMPLETED Status Actions */}
									{item.status === 'COMPLETED' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-warning"
												disabled={loadingId === item.id + 'EXPORTED'}
												onClick={() => onChangeStatus?.(item.id, 'EXPORTED')}
												title={safeT('pages.requests.actions.exportTitle', 'Export from depot')}
											>
											{loadingId === item.id + 'EXPORTED' ? '⏳' : '📦'} {safeT('pages.requests.actions.export', 'Export')}
											</button>
											<button
												className="btn btn-sm btn-info"
												disabled={loadingId === item.id + 'PAY'}
												onClick={() => onSendPayment?.(item.id)}
												title={safeT('pages.requests.actions.sendPaymentTitle', 'Send payment request')}
											>
											{loadingId === item.id + 'PAY' ? '⏳' : '💰'} {safeT('pages.requests.actions.payment', 'Payment')}
											</button>
										</div>
									)}

									{/* PENDING_ACCEPT Status Actions - hiển thị cho tất cả trường hợp PENDING_ACCEPT */}
									{item.status === 'PENDING_ACCEPT' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-info"
												disabled={loadingId === item.id + 'VIEW_INVOICE'}
												onClick={() => onViewInvoice?.(item.id)}
												title={safeT('pages.requests.actions.viewRepairInvoiceTitle', 'View repair invoice')}
											>
											{loadingId === item.id + 'VIEW_INVOICE' ? '⏳' : '📄'} {safeT('pages.requests.actions.viewRepairInvoice', 'View invoice')}
											</button>
											<button
												className="btn btn-sm btn-success"
												disabled={loadingId === item.id + 'CONFIRM'}
												onClick={() => onSendCustomerConfirmation?.(item.id)}
												title={safeT('pages.requests.actions.sendConfirmationTitle', 'Send confirmation to customer')}
											>
											{loadingId === item.id + 'CONFIRM' ? '⏳' : '📧'} {safeT('pages.requests.actions.sendConfirmation', 'Send confirmation')}
											</button>
										</div>
									)}

									{/* Soft Delete Actions */}
									{['REJECTED', 'COMPLETED', 'EXPORTED'].includes(item.status) && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-outline"
												disabled={loadingId === item.id + 'DELETE'}
												onClick={() => onDeleteWithModal?.(item.id)}
												title="Gỡ bỏ khỏi danh sách Depot"
											>
												{loadingId === item.id + 'DELETE' ? '⏳' : '🗑️'} Gỡ bỏ
											</button>
										</div>
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
