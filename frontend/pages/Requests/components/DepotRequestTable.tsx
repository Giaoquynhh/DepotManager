import React from 'react';
import DepotChatMini from './DepotChatMini';

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
	onAddDocument?: (requestId: string, containerNo: string) => void;
	loadingId?: string;
	// Chat props
	activeChatRequests?: Set<string>;
	onToggleChat?: (requestId: string) => void;
	onCloseChat?: (requestId: string) => void;
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
	onAddDocument,
	loadingId,
	// Chat props
	activeChatRequests = new Set(),
	onToggleChat,
	onCloseChat
}: DepotRequestTableProps) {
	
	// Function để lấy vị trí container (tương tự như trên ContainersPage)
	const getContainerLocation = (containerNo: string) => {
		if (!containerNo) return null;
		
		// Logic để lấy vị trí container
		// Có thể cần API call hoặc data từ props
		// Tạm thời sử dụng logic mô phỏng dựa trên container_no
		
		// Nếu có container data với vị trí chi tiết
		if (data && data.length > 0) {
			const containerData = data.find(item => item.container_no === containerNo);
			if (containerData && containerData.yard && containerData.block && containerData.slot) {
				return `${containerData.yard} / ${containerData.block} / ${containerData.slot}`;
			}
		}
		
		// Fallback: Tạo vị trí mô phỏng dựa trên container_no
		// Trong thực tế, cần lấy từ API containers
		if (containerNo === 'ISO 9999') {
			return 'Depot A / B1 / B1-10'; // Vị trí mô phỏng
		}
		
		return null;
	};
	
	// TODO: Implement API call để lấy vị trí container thực tế
	// const getContainerLocationFromAPI = async (containerNo: string) => {
	// 	try {
	// 		const response = await api.get(`/containers/${containerNo}/location`);
	// 		return response.data.location; // Format: "Depot A / B1 / B1-10"
	// 	} catch (error) {
	// 		console.error('Error fetching container location:', error);
	// 		return null;
	// 	}
	// };
	const getStatusBadge = (status: string) => {
		const statusConfig: Record<string, { label: string; className: string }> = {
			PENDING: { label: 'Chờ xử lý', className: 'status-pending' },
			PICK_CONTAINER: { label: 'Đang chọn container', className: 'status-pick-container' },
			RECEIVED: { label: 'Đã nhận', className: 'status-received' },
			COMPLETED: { label: 'Hoàn thành', className: 'status-completed' },
			EXPORTED: { label: 'Đã xuất', className: 'status-exported' },
			REJECTED: { label: 'Từ chối', className: 'status-rejected' },
			IN_YARD: { label: 'Đã ở trong bãi', className: 'status-in-yard' },
			IN_CAR: { label: 'Đã lên xe', className: 'status-in-car' },
			LEFT_YARD: { label: 'Đã rời kho', className: 'status-left-yard' },
			PENDING_ACCEPT: { label: 'Chờ chấp nhận', className: 'status-pending-accept' },
			CHECKING: { label: 'Đang kiểm tra', className: 'status-checking' },
			CHECKED: { label: 'Đã kiểm tra', className: 'status-checked' },
			POSITIONED: { label: 'Đã xếp chỗ trong bãi', className: 'status-positioned' },
			FORKLIFTING: { label: 'Đang nâng/hạ container', className: 'status-forklifting' }
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
			IMPORT: 'Nhập',
			EXPORT: 'Xuất',
			CONVERT: 'Chuyển đổi'
		};
		return typeLabels[type as keyof typeof typeLabels] || type;
	};

	// Function để cập nhật trạng thái thanh toán
	const handleUpdatePaymentStatus = async (requestId: string, isPaid: boolean) => {
		try {
			const response = await fetch(`http://localhost:5002/requests/${requestId}/payment-status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({ is_paid: isPaid }),
			});
			
			if (response.ok) {
				// Refresh page để cập nhật dữ liệu
				window.location.reload();
			} else {
				console.error('Lỗi cập nhật trạng thái thanh toán');
			}
		} catch (error) {
			console.error('Lỗi cập nhật trạng thái thanh toán:', error);
		}
	};

	if (loading) {
		return (
			<div className="table-loading">
				<div className="loading-spinner"></div>
				<p>Đang tải dữ liệu...</p>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="table-empty">
				<div className="empty-icon">📋</div>
				<p>Chưa có yêu cầu nào</p>
				<small>Không có yêu cầu nào để xử lý</small>
			</div>
		);
	}

	return (
		<div className="table-container">
			<table className="table table-modern">
				<thead>
					<tr>
						<th>Loại</th>
						<th>Container</th>
						<th>Vị trí</th>
						<th>ETA</th>
						<th>Trạng thái</th>
						<th>Trạng thái thanh toán</th>
						<th>Chứng từ</th>
						<th>Chat</th>
						<th>Hành động</th>
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
								<span className="request-type">
									{getTypeLabel(item.type)}
								</span>
							</td>
													<td>
							<div className="container-info">
								{item.container_no || '-'}
							</div>
						</td>
						{/* 
							Cột Vị trí: Chỉ hiển thị cho EXPORT requests, để trống cho IMPORT (sẽ bổ sung logic sau)
							Logic hiển thị:
							1. Sử dụng getContainerLocation() để lấy vị trí thực tế từ container data
							2. Nếu có vị trí -> hiển thị vị trí (Yard / Block / Slot)
							3. Nếu không có vị trí -> hiển thị "Chưa xác định"
							
							Vị trí được lấy tương tự như trên ContainersPage
						*/}
						<td>
							<div className="location-info">
								{item.type === 'EXPORT' ? (
									<span className="location-badge">
										📍 {getContainerLocation(item.container_no) || 'Chưa xác định'}
									</span>
								) : (
									<span className="location-na">-</span>
								)}
							</div>
						</td>
						<td>
							<div className="eta-info">
								{item.eta ? (
									<div className="eta-date">
										{new Date(item.eta).toLocaleString('vi-VN')}
									</div>
								) : (
									<div className="eta-empty">-</div>
								)}
							</div>
						</td>
							<td>
								{getStatusBadge(item.status)}
							</td>
							<td>
								<div className="payment-status-info">
									{/* Hiển thị trạng thái hóa đơn */}
									<div className="invoice-status">
										<span className={`status-indicator ${item.has_invoice ? 'has-invoice' : 'no-invoice'}`}>
											{item.has_invoice ? '📄' : '📝'} 
											{item.has_invoice ? 'Có hóa đơn' : 'Chưa có hóa đơn'}
										</span>
									</div>
									{/* Hiển thị trạng thái thanh toán */}
									<div className="payment-status">
										<span className={`status-indicator ${item.is_paid ? 'paid' : 'unpaid'}`}>
											{item.is_paid ? '💰' : '⏳'} 
											{item.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
										</span>
									</div>
									{/* Nút cập nhật trạng thái thanh toán */}
									<div className="payment-actions">
										<button
											className="btn btn-sm btn-outline"
											onClick={() => handleUpdatePaymentStatus(item.id, !item.is_paid)}
											title={item.is_paid ? 'Đánh dấu chưa thanh toán' : 'Đánh dấu đã thanh toán'}
											style={{
												fontSize: '10px',
												padding: '2px 6px',
												marginTop: '4px'
											}}
										>
											{item.is_paid ? '🔄 Đánh dấu chưa TT' : '✅ Đánh dấu đã TT'}
										</button>
									</div>
								</div>
							</td>
							<td>
								{item.documents && item.documents.length > 0 ? (
									<div className="document-badges">
										{item.documents.map((doc: any) => (
											<button
												key={doc.id}
												className="document-badge clickable"
												onClick={() => onDocumentClick?.(doc)}
												title={`Xem ${doc.name}`}
											>
												📎 {doc.name}
											</button>
										))}
									</div>
								) : (
									<div className="document-actions">
										{/* Hiển thị nút "Thêm chứng từ" cho yêu cầu EXPORT với trạng thái PICK_CONTAINER */}
										{item.type === 'EXPORT' && item.status === 'PICK_CONTAINER' && onAddDocument ? (
											<button
												className="btn btn-sm btn-primary"
												onClick={() => onAddDocument(item.id, item.container_no || '')}
												title="Thêm chứng từ cho container"
												style={{
													background: '#3b82f6',
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
												📎 Thêm chứng từ
											</button>
										) : (
											<span className="no-document">-</span>
										)}
									</div>
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
											{activeChatRequests.has(demoItem.id) ? '💬 Đóng Chat' : '💬 Mở Chat'}
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
									{/* PENDING Status Actions */}
									{item.status === 'PENDING' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-primary"
												disabled={loadingId === item.id + 'RECEIVED'}
												onClick={() => onChangeStatus?.(item.id, 'RECEIVED')}
												title="Tiếp nhận yêu cầu"
											>
												{loadingId === item.id + 'RECEIVED' ? '⏳' : '✅'} Tiếp nhận
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onChangeStatus?.(item.id, 'REJECTED')}
												title="Từ chối yêu cầu"
											>
												{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
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
												title="Tiếp nhận và hoàn tất"
											>
												{loadingId === item.id + 'COMPLETED' ? '⏳' : '✅'} Hoàn tất
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onChangeStatus?.(item.id, 'REJECTED')}
												title="Từ chối yêu cầu"
											>
												{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
											</button>
										</div>
									)}

									{/* SCHEDULED Status Actions */}
									{item.status === 'SCHEDULED' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-success"
												onClick={() => onChangeAppointment?.(item.id)}
												title="Thay đổi lịch hẹn với khách hàng"
											>
												📅 Thay đổi lịch hẹn
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onReject?.(item.id)}
												title="Từ chối yêu cầu"
											>
												{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
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
												title="Xuất kho"
											>
												{loadingId === item.id + 'EXPORTED' ? '⏳' : '📦'} Xuất kho
											</button>
											<button
												className="btn btn-sm btn-info"
												disabled={loadingId === item.id + 'PAY'}
												onClick={() => onSendPayment?.(item.id)}
												title="Gửi yêu cầu thanh toán"
											>
												{loadingId === item.id + 'PAY' ? '⏳' : '💰'} Thanh toán
											</button>
										</div>
									)}

									{/* PENDING_ACCEPT Status Actions */}
									{item.status === 'PENDING_ACCEPT' && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-info"
												disabled={loadingId === item.id + 'VIEW_INVOICE'}
												onClick={() => onViewInvoice?.(item.id)}
												title="Xem hóa đơn sửa chữa"
											>
												{loadingId === item.id + 'VIEW_INVOICE' ? '⏳' : '📄'} Xem hóa đơn
											</button>
											<button
												className="btn btn-sm btn-success"
												disabled={loadingId === item.id + 'CONFIRM'}
												onClick={() => onSendCustomerConfirmation?.(item.id)}
												title="Gửi xác nhận cho khách hàng"
											>
												{loadingId === item.id + 'CONFIRM' ? '⏳' : '📧'} Gửi xác nhận
											</button>
										</div>
									)}

									{/* Soft Delete Actions */}
									{['REJECTED', 'COMPLETED', 'EXPORTED'].includes(item.status) && (
										<div className="action-group">
											<button
												className="btn btn-sm btn-outline"
												disabled={loadingId === item.id + 'DELETE'}
												onClick={() => {
													if (window.confirm('Xóa khỏi danh sách Kho?\nRequest vẫn hiển thị trạng thái Từ chối bên Khách hàng.')) {
														onSoftDelete?.(item.id, 'depot');
													}
												}}
												title="Xóa khỏi danh sách Kho"
											>
												{loadingId === item.id + 'DELETE' ? '⏳' : '🗑️'} Xóa
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
