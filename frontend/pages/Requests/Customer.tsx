import Header from '@components/Header';
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '@services/api';
import Modal from '@components/Modal';
import Button from '@components/Button';
import RequestForm from '@components/RequestForm';
import RequestTable from '@components/RequestTable';
import SearchBar from '@components/SearchBar';
import AppointmentModal from '@components/AppointmentModal';
import UploadModal from '@components/UploadModal';
import SupplementMini from '@components/SupplementMini';
import { useCustomerActions } from './hooks/useCustomerActions';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function CustomerRequests() {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showAppointmentModal, setShowAppointmentModal] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [showSupplementPopup, setShowSupplementPopup] = useState(false);
	const [selectedRequestId, setSelectedRequestId] = useState<string>('');
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState('all');
	const { data, error, isLoading } = useSWR('/requests?page=1&limit=20', fetcher);
	
	// Use customer actions hook
	const [customerState, customerActions] = useCustomerActions();
	const { msg, loadingId, me } = customerState;

	const handleCreateSuccess = () => {
		setShowCreateModal(false);
		mutate('/requests?page=1&limit=20');
	};

	const handleCreateCancel = () => {
		setShowCreateModal(false);
	};

	// Load user info - now handled by useCustomerActions hook

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		// TODO: Implement search functionality
	};

	const handleFilterChange = (filter: string) => {
		setFilterType(filter);
		// TODO: Implement filter functionality
	};

	const softDeleteRequest = async (id: string, scope: 'depot' | 'customer') => {
		customerActions.setMsg(null);
		customerActions.setLoadingId(id + 'DELETE');
		try {
			await api.delete(`/requests/${id}?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			customerActions.setMsg({ text: `Đã xóa khỏi danh sách ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`, ok: true });
		} catch (e: any) {
			customerActions.setMsg({ text: `Xóa thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			customerActions.setLoadingId('');
		}
	};

	const restoreRequest = async (id: string, scope: 'depot' | 'customer') => {
		customerActions.setMsg(null);
		customerActions.setLoadingId(id + 'RESTORE');
		try {
			await api.post(`/requests/${id}/restore?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			customerActions.setMsg({ text: `Đã khôi phục trong danh sách ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`, ok: true });
		} catch (e: any) {
			customerActions.setMsg({ text: `Khôi phục thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			customerActions.setLoadingId('');
		}
	};

	// Filter data based on search and filter
	const filteredData = data?.data?.filter((item: any) => {
		const matchesSearch = searchQuery === '' || 
			item.container_no.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFilter = filterType === 'all' || item.type === filterType;
		return matchesSearch && matchesFilter;
	});



	const handleOpenUploadModal = (requestId: string) => {
		setSelectedRequestId(requestId);
		setShowUploadModal(true);
	};

	const handleOpenSupplementPopup = (requestId: string) => {
		setSelectedRequestId(requestId);
		setShowSupplementPopup(true);
	};

	const handleSupplementSuccess = () => {
		// Refresh danh sách request để cập nhật trạng thái
		// Vì request đã chuyển sang FORWARDED, cần refresh để hiển thị đúng
		mutate('/requests?page=1&limit=20');
		
		// Hiển thị thông báo thành công với thông tin về việc tự động chuyển tiếp
		customerActions.setMsg({ 
			text: '✅ Upload tài liệu bổ sung thành công! 📤 Yêu cầu đã được tự động chuyển tiếp sang FORWARDED.', 
			ok: true 
		});
		
		// Tự động ẩn thông báo sau 5 giây
		setTimeout(() => {
			customerActions.setMsg(null);
		}, 5000);
	};

	const handleUploadSuccess = () => {
		mutate('/requests?page=1&limit=20');
		customerActions.setMsg({ text: 'Upload file thành công!', ok: true });
	};

	const requestsWithActions = filteredData?.map((item: any) => ({
		...item,
		actions: {
			softDeleteRequest,
			restoreRequest,
			loadingId,
			handleOpenSupplementPopup,
			handleViewInvoice: customerActions.handleViewInvoice,
			handleAccept: customerActions.handleAccept,
			handleRejectByCustomer: customerActions.handleRejectByCustomer
		}
	}));

	return (
		<>
			<Header />
			<main className="container">
				{/* Page Header */}
				<div className="page-header">
					<h1 className="page-title">Danh sách yêu cầu</h1>
					<div className="page-actions">
						<Button 
							variant="outline" 
							icon="➕"
							onClick={() => setShowCreateModal(true)}
						>
							Tạo yêu cầu
						</Button>
					</div>
				</div>

				{/* Search and Filter */}
				<SearchBar 
					onSearch={handleSearch}
					onFilterChange={handleFilterChange}
					placeholder="Tìm kiếm theo mã container..."
				/>

				{/* Request Table */}
				<RequestTable 
					data={requestsWithActions} 
					loading={isLoading}
					userRole={me?.role || me?.roles?.[0]}
				/>

				{/* Status Message */}
				{msg && (
					<div className={`status-message ${msg.ok ? 'success' : 'error'}`}>
						{msg.text}
					</div>
				)}

				{/* Create Request Modal */}
				<Modal
					title="Tạo yêu cầu mới"
					visible={showCreateModal}
					onCancel={handleCreateCancel}
					width={500}
				>
					<RequestForm 
						onSuccess={handleCreateSuccess}
						onCancel={handleCreateCancel}
					/>
				</Modal>

				{/* Upload Modal */}
				<UploadModal
					requestId={selectedRequestId}
					visible={showUploadModal}
					onClose={() => setShowUploadModal(false)}
					onSuccess={handleUploadSuccess}
				/>

				{/* Supplement Popup */}
				<SupplementMini
					requestId={selectedRequestId}
					visible={showSupplementPopup}
					onClose={() => setShowSupplementPopup(false)}
					onSuccess={handleSupplementSuccess}
				/>
			</main>
		</>
	);
}
