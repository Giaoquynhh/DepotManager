import Header from '@components/Header';
import { useState } from 'react';
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
import { useTranslation } from '../../hooks/useTranslation';

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
	const { t } = useTranslation();
	
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
			const key = scope === 'depot'
				? 'pages.requests.messages.removedFromDepotList'
				: 'pages.requests.messages.removedFromCustomerList';
			customerActions.setMsg({ text: t(key), ok: true });
		} catch (e: any) {
			customerActions.setMsg({ text: `${t('common.deleteFailed')}: ${e?.response?.data?.message || t('common.error')}`, ok: false });
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
			const key = scope === 'depot'
				? 'pages.requests.messages.restoredInDepotList'
				: 'pages.requests.messages.restoredInCustomerList';
			customerActions.setMsg({ text: t(key), ok: true });
		} catch (e: any) {
			customerActions.setMsg({ text: `${t('common.restoreFailed')}: ${e?.response?.data?.message || t('common.error')}`, ok: false });
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
			text: t('pages.requests.messages.supplementUploadSuccessForwarded'),
			ok: true
		});
		
		// Tự động ẩn thông báo sau 5 giây
		setTimeout(() => {
			customerActions.setMsg(null);
		}, 5000);
	};

	const handleUploadSuccess = () => {
		mutate('/requests?page=1&limit=20');
		customerActions.setMsg({ text: t('pages.requests.messages.uploadDocumentSuccess'), ok: true });
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
			<main className="container customer-requests">
				{/* Page Header */}
				<div className="page-header modern-header">
					<div className="header-content">
						<div className="header-left">
							<h1 className="page-title gradient gradient-ultimate">{t('pages.requests.customerTitle')}</h1>
						</div>
					</div>
				</div>

				{/* Search and Filter */}
				<div className="search-filter-section modern-search" style={{ paddingTop: '8px' }}>
					<div className="search-row">
						<div className="search-section">
							<div className="search-input-group">
								<span className="search-icon">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<circle cx="11" cy="11" r="8"></circle>
										<path d="m21 21-4.35-4.35"></path>
									</svg>
								</span>
								<input
									type="text"
									className="search-input"
									placeholder={t('pages.requests.searchPlaceholder')}
									aria-label={t('pages.requests.searchPlaceholder')}
									value={searchQuery}
									onChange={(e) => handleSearch(e.target.value)}
								/>
							</div>
						</div>

						<div className="filter-group">
							<select
								aria-label={t('pages.requests.typeLabel')}
								className="filter-select modern-select"
								value={filterType}
								onChange={(e) => handleFilterChange(e.target.value)}
							>
								<option value="all">{t('pages.requests.allTypes')}</option>
								<option value="IMPORT">{t('pages.requests.filterOptions.import')}</option>
								<option value="EXPORT">{t('pages.requests.filterOptions.export')}</option>
							</select>
							
							<Button 
								variant="outline" 
								icon="➕"
								onClick={() => setShowCreateModal(true)}
								className="create-btn"
							>
								{t('pages.requests.createRequest')}
							</Button>
						</div>
					</div>
				</div>

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
					title={t('pages.requests.createRequestTitle')}
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
