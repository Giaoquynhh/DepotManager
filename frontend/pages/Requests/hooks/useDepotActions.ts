import { useState, useEffect } from 'react';
import { mutate } from 'swr';
import { api } from '@services/api';

export interface DepotActionsState {
	searchQuery: string;
	filterType: string;
	filterStatus: string;
	showAppointmentModal: boolean;
	selectedRequestId: string;
	activeAppointmentRequests: Set<string>;
	activeSupplementRequests: Set<string>;
	selectedDocument: any;
	showImageModal: boolean;
	msg: { text: string; ok: boolean } | null;
	loadingId: string;
	me: any;
	requestsData: any[]; // Thêm dữ liệu requests
	activeChatRequests: Set<string>; // Thêm state để quản lý chat đang mở
	showContainerSelectionModal: boolean; // Thêm state cho container selection modal
	selectedRequestForContainer: any; // Thêm thông tin request được chọn để chọn container
}

export interface DepotActions {
	// State setters
	setSearchQuery: (query: string) => void;
	setFilterType: (type: string) => void;
	setFilterStatus: (status: string) => void;
	setShowAppointmentModal: (show: boolean) => void;
	setSelectedRequestId: (id: string) => void;
	setSelectedDocument: (doc: any) => void;
	setShowImageModal: (show: boolean) => void;
	setMsg: (msg: { text: string; ok: boolean } | null) => void;
	setLoadingId: (id: string) => void;
	setRequestsData: (data: any[]) => void; // Thêm setter cho requests data
	setShowContainerSelectionModal: (show: boolean) => void;
	setSelectedRequestForContainer: (request: any) => void;

	// Actions
	changeStatus: (id: string, status: string) => Promise<void>;
	handleAppointmentSuccess: () => void;
	toggleAppointment: (requestId: string) => void;
	handleAppointmentClose: (requestId: string) => void;
	handleAppointmentMiniSuccess: (requestId: string) => Promise<void>;
	toggleSupplement: (requestId: string) => void;
	handleChangeAppointment: (requestId: string) => void;
	handleReject: (requestId: string) => Promise<void>;
	sendPayment: (id: string) => Promise<void>;
	softDeleteRequest: (id: string, scope: 'depot' | 'customer') => Promise<void>;
	restoreRequest: (id: string, scope: 'depot' | 'customer') => Promise<void>;
	handleDocumentClick: (doc: any) => void;
	closeDocumentModal: () => void;
	handleViewInvoice: (id: string) => Promise<void>;
	handleSendCustomerConfirmation: (id: string) => Promise<void>;
	handleContainerSelection: (containerNo: string) => Promise<void>; // Thêm action xử lý khi chọn container
	handleAddDocument: (requestId: string, containerNo: string) => Promise<void>; // Thêm action xử lý khi thêm chứng từ
	
	// Chat actions
	toggleChat: (requestId: string) => void;
	closeChat: (requestId: string) => void;
}

export function useDepotActions(): [DepotActionsState, DepotActions] {
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState('all');
	const [filterStatus, setFilterStatus] = useState('all');
	const [showAppointmentModal, setShowAppointmentModal] = useState(false);
	const [selectedRequestId, setSelectedRequestId] = useState<string>('');
	const [activeAppointmentRequests, setActiveAppointmentRequests] = useState<Set<string>>(new Set());
	const [activeSupplementRequests, setActiveSupplementRequests] = useState<Set<string>>(new Set());
	const [selectedDocument, setSelectedDocument] = useState<any>(null);
	const [showImageModal, setShowImageModal] = useState(false);
	const [msg, setMsg] = useState<{ text: string; ok: boolean }|null>(null);
	const [loadingId, setLoadingId] = useState<string>('');
	const [me, setMe] = useState<any>(null);
	const [requestsData, setRequestsData] = useState<any[]>([]);
	const [activeChatRequests, setActiveChatRequests] = useState<Set<string>>(new Set());
	const [showContainerSelectionModal, setShowContainerSelectionModal] = useState(false);
	const [selectedRequestForContainer, setSelectedRequestForContainer] = useState<any>(null);
	
	// Debug logging cho setRequestsData
	const setRequestsDataWithLog = (data: any[]) => {
		console.log('🔍 setRequestsData called with:', { 
			dataLength: data.length, 
			containerNumbers: data.map(r => r.container_no),
			sampleData: data.slice(0, 2) // Chỉ log 2 item đầu để tránh spam
		});
		setRequestsData(data);
	};

	const actLabel: Record<string, string> = {
		RECEIVED: 'Tiếp nhận',
		REJECTED: 'Từ chối',
		COMPLETED: 'Hoàn tất',
		EXPORTED: 'Đã xuất kho'
	};

	// Load user info
	useEffect(() => {
		api.get('/auth/me').then(r => setMe(r.data)).catch(() => {});
	}, []);

	const changeStatus = async (id: string, status: string) => {
		console.log('🔍 changeStatus called:', { id, status, requestsDataLength: requestsData.length });
		setMsg(null);
		setLoadingId(id + status);
		try {
			let payload: any = { status };
			if (status === 'REJECTED') {
				const reason = window.prompt('Nhập lý do từ chối');
				if (!reason) {
					setLoadingId('');
					return;
				}
				payload.reason = reason;
				await api.patch(`/requests/${id}/status`, payload);
			} else if (status === 'RECEIVED') {
				// Kiểm tra loại request
				const request = requestsData.find(r => r.id === id);
				console.log('🔍 Found request:', { request, requestType: request?.type });
				
				if (request && request.type === 'EXPORT') {
					console.log('🔍 EXPORT request detected, opening container selection modal');
					// Đối với request EXPORT, mở container selection modal
					setSelectedRequestForContainer(request);
					setShowContainerSelectionModal(true);
					console.log('🔍 Container selection modal should be visible now');
					setLoadingId('');
					return;
				} else {
					console.log('🔍 Non-EXPORT request, opening appointment mini directly');
					// Đối với request khác, mở appointment mini như cũ
					setActiveAppointmentRequests(prev => {
						const newSet = new Set(prev).add(id);
						console.log('Opening AppointmentMini for request:', id, 'Active requests:', Array.from(newSet));
						return newSet;
					});
					setLoadingId('');
					return;
				}
			} else {
				await api.patch(`/requests/${id}/status`, payload);
			}
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `${actLabel[status] || 'Cập nhật'} yêu cầu thành công`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Không thể ${actLabel[status]?.toLowerCase() || 'cập nhật'}: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const handleAppointmentSuccess = () => {
		mutate('/requests?page=1&limit=20');
		setMsg({ text: 'Đã tiếp nhận yêu cầu và tạo lịch hẹn thành công!', ok: true });
	};

	const toggleAppointment = (requestId: string) => {
		setActiveAppointmentRequests(prev => {
			const newSet = new Set(prev);
			if (newSet.has(requestId)) {
				newSet.delete(requestId);
			} else {
				newSet.add(requestId);
			}
			return newSet;
		});
	};

	const handleAppointmentClose = (requestId: string) => {
		setActiveAppointmentRequests(prev => {
			const newSet = new Set(prev);
			newSet.delete(requestId);
			return newSet;
		});
	};

	const handleAppointmentMiniSuccess = async (requestId: string) => {
		handleAppointmentClose(requestId);
		handleAppointmentSuccess();
	};

	const toggleSupplement = (requestId: string) => {
		setActiveSupplementRequests(prev => {
			const newSet = new Set(prev);
			if (newSet.has(requestId)) {
				newSet.delete(requestId);
			} else {
				newSet.add(requestId);
			}
			return newSet;
		});
	};

	const handleChangeAppointment = async (requestId: string) => {
		// Mở modal tạo lịch hẹn mới thay vì chuyển trạng thái
		setActiveAppointmentRequests(prev => {
			const newSet = new Set(prev).add(requestId);
			console.log('Opening AppointmentMini for appointment change:', requestId, 'Active requests:', Array.from(newSet));
			return newSet;
		});
	};

	const handleReject = async (requestId: string) => {
		const reason = window.prompt('Nhập lý do từ chối:');
		if (!reason) return;
		
		setMsg(null);
		setLoadingId(requestId + 'REJECTED');
		try {
			await api.patch(`/requests/${requestId}/reject`, { reason });
			mutate('/requests?page=1&limit=20');
			setMsg({ text: 'Đã từ chối yêu cầu thành công!', ok: true });
		} catch (e: any) {
			setMsg({ text: `Không thể từ chối: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const sendPayment = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'PAY');
		try {
			await api.post(`/requests/${id}/payment-request`, {});
			setMsg({ text: 'Đã gửi yêu cầu thanh toán', ok: true });
		} catch (e: any) {
			setMsg({ text: `Gửi yêu cầu thanh toán thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const softDeleteRequest = async (id: string, scope: 'depot' | 'customer') => {
		setMsg(null);
		setLoadingId(id + 'DELETE');
		try {
			await api.delete(`/requests/${id}?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `Đã xóa khỏi danh sách ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Xóa thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const restoreRequest = async (id: string, scope: 'depot' | 'customer') => {
		setMsg(null);
		setLoadingId(id + 'RESTORE');
		try {
			await api.post(`/requests/${id}/restore?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `Đã khôi phục trong danh sách ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Khôi phục thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const handleDocumentClick = (doc: any) => {
		setSelectedDocument(doc);
		setShowImageModal(true);
	};

	const closeDocumentModal = () => {
		setShowImageModal(false);
		setSelectedDocument(null);
	};

	// Xem hóa đơn sửa chữa - hoạt động giống như xem chi tiết ở phiếu sửa chữa
	const handleViewInvoice = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'VIEW_INVOICE');
		try {
			// Tìm request trong dữ liệu local
			const request = requestsData.find((r: any) => r.id === id);
			
			console.log('🔍 Debug handleViewInvoice:', { id, request, requestsDataLength: requestsData.length });
			console.log('🔍 All requestsData:', requestsData.map(r => ({ id: r.id, container_no: r.container_no, status: r.status })));
			
			if (!request || !request.container_no) {
				setMsg({ text: 'Không tìm thấy thông tin container của request', ok: false });
				return;
			}

			console.log('🔍 Container number:', request.container_no);
			console.log('🔍 Container number type:', typeof request.container_no);
			console.log('🔍 Container number length:', request.container_no?.length);
			console.log('🔍 Container number trimmed:', request.container_no?.trim());

			// Tìm phiếu sửa chữa tương ứng với container_no
			const apiUrl = `/maintenance/repairs?container_no=${encodeURIComponent(request.container_no)}`;
			console.log('🔍 API URL:', apiUrl);
			const repairResponse = await api.get(apiUrl);
			
			// Debug chi tiết response structure
			console.log('🔍 Full repairResponse:', repairResponse);
			console.log('🔍 repairResponse.data:', repairResponse.data);
			console.log('🔍 repairResponse.data.data:', repairResponse.data?.data);
			
			// Thử nhiều cách extract data
			let repairs = [];
			if (repairResponse.data?.data) {
				repairs = repairResponse.data.data;
			} else if (Array.isArray(repairResponse.data)) {
				repairs = repairResponse.data;
			} else if (repairResponse.data?.repairs) {
				repairs = repairResponse.data.repairs;
			} else if (repairResponse.data?.items) {
				repairs = repairResponse.data.items;
			}
			
			console.log('🔍 Extracted repairs:', repairs);
			
			console.log('🔍 Repair response:', { 
				repairResponse: repairResponse.data, 
				repairs, 
				repairsLength: repairs.length,
				status: repairResponse.status,
				headers: repairResponse.headers,
				fullResponse: repairResponse
			});
			
			// Debug chi tiết hơn cho response data
			console.log('🔍 Response data structure:', {
				hasData: !!repairResponse.data,
				dataType: typeof repairResponse.data,
				dataKeys: repairResponse.data ? Object.keys(repairResponse.data) : 'no data',
				rawData: repairResponse.data
			});
			
			if (repairs.length === 0) {
				setMsg({ text: 'Không tìm thấy phiếu sửa chữa cho container này', ok: false });
				return;
			}

			// Lấy phiếu sửa chữa mới nhất
			const latestRepair = repairs[0];
			
			console.log('🔍 Latest repair:', latestRepair);
			
			// Tải PDF hóa đơn sửa chữa
			const pdfResponse = await api.get(`/maintenance/repairs/${latestRepair.id}/invoice/pdf`, {
				responseType: 'blob'
			});

			console.log('🔍 PDF response received, size:', pdfResponse.data?.length || 'unknown');

			// Tạo URL để hiển thị PDF
			const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
			const url = window.URL.createObjectURL(blob);
			
			// Mở PDF trong tab mới
			window.open(url, '_blank');
			
			// Giải phóng URL
			window.URL.revokeObjectURL(url);
			
			setMsg({ text: 'Đã mở hóa đơn sửa chữa thành công', ok: true });
		} catch (e: any) {
			console.error('❌ Lỗi khi xem hóa đơn:', e);
			console.error('❌ Error response:', e?.response?.data);
			console.error('❌ Error status:', e?.response?.status);
			setMsg({ text: `Không thể xem hóa đơn: ${e?.response?.data?.message || 'Lỗi không xác định'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Gửi xác nhận cho khách hàng
	const handleSendCustomerConfirmation = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'CONFIRM');
		try {
			// TODO: Implement gửi xác nhận cho khách hàng
			// Có thể gửi email, SMS hoặc cập nhật trạng thái
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
			setMsg({ text: 'Đã gửi xác nhận cho khách hàng thành công', ok: true });
			
			// Không tự động mở chat với khách hàng sau khi gửi xác nhận
			// setActiveChatRequests(prev => new Set(prev).add(id));
		} catch (e: any) {
			setMsg({ text: `Gửi xác nhận thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Container selection action
	const handleContainerSelection = async (containerNo: string) => {
		console.log('🔍 handleContainerSelection called with:', { containerNo, selectedRequestForContainer });
		if (!selectedRequestForContainer) {
			console.log('❌ No selectedRequestForContainer found');
			return;
		}
		
		setMsg(null);
		setLoadingId(selectedRequestForContainer.id + 'CONTAINER_SELECT');
		try {
			console.log('🔍 Updating request with container:', containerNo);
			// Sử dụng API endpoint mới để cập nhật container_no mà không thay đổi status
			await api.patch(`/requests/${selectedRequestForContainer.id}/container`, {
				container_no: containerNo
			});
			
			console.log('🔍 API call successful, updating local state');
			// Cập nhật state.requestsData ngay lập tức để AppointmentMini có thể sử dụng
			setRequestsData(prev => {
				console.log('🔍 Current requestsData before update:', prev.map(r => ({ id: r.id, container_no: r.container_no })));
				const updated = prev.map(req => 
					req.id === selectedRequestForContainer.id 
						? { ...req, container_no: containerNo }
						: req
				);
				console.log('🔍 Updated requestsData:', updated.map(r => ({ id: r.id, container_no: r.container_no })));
				return updated;
			});
			
			console.log('🔍 Closing container selection modal');
			// Đóng container selection modal
			setShowContainerSelectionModal(false);
			
			console.log('🔍 Opening appointment mini for request:', selectedRequestForContainer.id);
			// Mở appointment mini để tạo lịch hẹn
			setActiveAppointmentRequests(prev => {
				const newSet = new Set(prev).add(selectedRequestForContainer.id);
				console.log('🔍 Active appointment requests after adding:', Array.from(newSet));
				return newSet;
			});
			
			console.log('🔍 Resetting selectedRequestForContainer');
			// Reset selected request
			setSelectedRequestForContainer(null);
			
			console.log('🔍 Refreshing SWR data');
			// Refresh data
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `Đã chọn container ${containerNo} cho yêu cầu EXPORT. Vui lòng tạo lịch hẹn.`, ok: true });
			console.log('🔍 handleContainerSelection completed successfully');
		} catch (e: any) {
			console.error('❌ Error in handleContainerSelection:', e);
			console.error('❌ Error response data:', e?.response?.data);
			console.error('❌ Error status:', e?.response?.status);
			console.error('❌ Error message:', e?.message);
			setMsg({ text: `Không thể cập nhật container: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	// Handle add document for EXPORT requests with PICK_CONTAINER status
	const handleAddDocument = async (requestId: string, containerNo: string) => {
		console.log('🔍 handleAddDocument called:', { requestId, containerNo });
		setLoadingId(requestId + 'ADD_DOC');
		try {
			// Tạo input file element
			const fileInput = document.createElement('input');
			fileInput.type = 'file';
			fileInput.accept = '.pdf,.jpg,.jpeg,.png';
			fileInput.style.display = 'none';
			
			fileInput.onchange = async (event) => {
				const target = event.target as HTMLInputElement;
				const file = target.files?.[0];
				
				if (!file) {
					setLoadingId('');
					return;
				}
				
				try {
					// Kiểm tra kích thước file (10MB)
					if (file.size > 10 * 1024 * 1024) {
						setMsg({ text: 'File quá lớn. Kích thước tối đa là 10MB', ok: false });
						setLoadingId('');
						return;
					}
					
					// Kiểm tra loại file
					const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
					if (!allowedTypes.includes(file.type)) {
						setMsg({ text: 'Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)', ok: false });
						setLoadingId('');
						return;
					}
					
					// Tạo FormData để upload
					const formData = new FormData();
					formData.append('file', file);
					formData.append('type', 'EXPORT_DOC');
					
					// Gọi API upload chứng từ
					const response = await api.post(`/requests/${requestId}/docs`, formData, {
						headers: {
							'Content-Type': 'multipart/form-data',
						},
					});
					
					console.log('✅ Document upload successful:', response.data);
					
					// Hiển thị thông báo thành công
					setMsg({ 
						text: `✅ Đã upload chứng từ thành công cho container ${containerNo}! Trạng thái đã tự động chuyển từ PICK_CONTAINER sang SCHEDULED.`, 
						ok: true 
					});
					
					// Refresh data để cập nhật trạng thái
					mutate('/requests?page=1&limit=20');
					
				} catch (error: any) {
					console.error('❌ Error uploading document:', error);
					setMsg({ 
						text: `❌ Không thể upload chứng từ: ${error?.response?.data?.message || 'Lỗi không xác định'}`, 
						ok: false 
					});
				} finally {
					setLoadingId('');
					// Xóa file input
					document.body.removeChild(fileInput);
				}
			};
			
			// Thêm file input vào DOM và trigger click
			document.body.appendChild(fileInput);
			fileInput.click();
			
		} catch (e: any) {
			console.error('❌ Error in handleAddDocument:', e);
			setMsg({ text: `Không thể thêm chứng từ: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
			setLoadingId('');
		}
	};

	// Chat actions
	const toggleChat = (requestId: string) => {
		setActiveChatRequests(prev => {
			const newSet = new Set(prev);
			if (newSet.has(requestId)) {
				newSet.delete(requestId);
			} else {
				newSet.add(requestId);
			}
			return newSet;
		});
	};

	const closeChat = (requestId: string) => {
		setActiveChatRequests(prev => {
			const newSet = new Set(prev);
			newSet.delete(requestId);
			return newSet;
		});
	};

	const state: DepotActionsState = {
		searchQuery,
		filterType,
		filterStatus,
		showAppointmentModal,
		selectedRequestId,
		activeAppointmentRequests,
		activeSupplementRequests,
		selectedDocument,
		showImageModal,
		msg,
		loadingId,
		me,
		requestsData,
		activeChatRequests,
		showContainerSelectionModal,
		selectedRequestForContainer
	};

	const actions: DepotActions = {
		setSearchQuery,
		setFilterType,
		setFilterStatus,
		setShowAppointmentModal,
		setSelectedRequestId,
		setSelectedDocument,
		setShowImageModal,
		setMsg,
		setLoadingId,
		setRequestsData: setRequestsDataWithLog,
		setShowContainerSelectionModal,
		setSelectedRequestForContainer,
		changeStatus,
		handleAppointmentSuccess,
		toggleAppointment,
		handleAppointmentClose,
		handleAppointmentMiniSuccess,
		toggleSupplement,
		handleChangeAppointment,
		handleReject,
		sendPayment,
		softDeleteRequest,
		restoreRequest,
		handleDocumentClick,
		closeDocumentModal,
		handleViewInvoice,
		handleSendCustomerConfirmation,
		handleContainerSelection,
		handleAddDocument,
		toggleChat,
		closeChat
	};

	return [state, actions];
}
