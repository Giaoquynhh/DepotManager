import React from 'react';
import Header from '@components/Header';
import { useTranslation } from '../../hooks/useTranslation';
import { RequestTabNavigation, ImportRequest, ExportRequest, CreateLiftRequestModal, LiftRequestData } from './components';

type ActiveTab = 'lift' | 'lower';

export default function DepotRequests() {
	const { t } = useTranslation();
	const [localSearch, setLocalSearch] = React.useState('');
	const [localType, setLocalType] = React.useState('all');
	const [localStatus, setLocalStatus] = React.useState('all');
	const [activeTab, setActiveTab] = React.useState<ActiveTab>('lift');
	const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

	// Map tab với loại request
	const getRequestType = (tab: ActiveTab) => {
		return tab === 'lift' ? 'IMPORT' : 'EXPORT';
	};

	const getRequestTypeLabel = (tab: ActiveTab) => {
		return tab === 'lift' ? 'Yêu cầu nâng container' : 'Yêu cầu hạ container';
	};

	const getRequestTypeDescription = (tab: ActiveTab) => {
		return tab === 'lift' 
			? 'Quản lý các yêu cầu nhập khẩu container (nâng container từ xe vào bãi)'
			: 'Quản lý các yêu cầu xuất khẩu container (hạ container từ bãi lên xe)';
	};

	const handleCreateRequest = () => {
		if (activeTab === 'lift') {
			setIsCreateModalOpen(true);
		} else {
			// TODO: Implement Export Request modal
			console.log('Export Request modal not implemented yet');
		}
	};

	const handleSubmitLiftRequest = (data: LiftRequestData) => {
		console.log('Lift Request Data:', data);
		// TODO: Implement API call to create lift request
		alert('Yêu cầu nâng container đã được tạo thành công!');
	};

	return (
		<>
			<style>{`
				@media (max-width: 768px) {
					body { overflow-y: auto !important; overflow-x: hidden !important; -webkit-overflow-scrolling: touch; }
					.container.depot-requests { overflow: visible !important; padding-bottom: 2rem; }
				}
			`}</style>
			<Header />
			<main className="container depot-requests">
				<div className="page-header modern-header">
					<div className="header-content">
						<div className="header-left">
							<h1 className="page-title gradient gradient-ultimate">
								{getRequestTypeLabel(activeTab)}
							</h1>
							<p style={{ 
								margin: '8px 0 0 0', 
								color: '#64748b', 
								fontSize: '14px',
								fontWeight: '400'
							}}>
								{getRequestTypeDescription(activeTab)}
							</p>
						</div>
						<div className="header-actions">
							<button 
								className="btn btn-success"
								onClick={handleCreateRequest}
							>
								{activeTab === 'lift' ? 'Tạo yêu cầu nâng container' : 'Tạo yêu cầu hạ container'}
							</button>
						</div>
					</div>
				</div>

				{/* Tab Navigation */}
				<RequestTabNavigation 
					activeTab={activeTab} 
					setActiveTab={setActiveTab} 
				/>

				{/* Render appropriate component based on active tab */}
				{activeTab === 'lift' ? (
					<ImportRequest
						localSearch={localSearch}
						setLocalSearch={setLocalSearch}
						localType={localType}
						setLocalType={setLocalType}
						localStatus={localStatus}
						setLocalStatus={setLocalStatus}
					/>
				) : (
					<ExportRequest
						localSearch={localSearch}
						setLocalSearch={setLocalSearch}
						localType={localType}
						setLocalType={setLocalType}
						localStatus={localStatus}
						setLocalStatus={setLocalStatus}
					/>
				)}

				{/* Create Lift Request Modal */}
				<CreateLiftRequestModal
					isOpen={isCreateModalOpen}
					onClose={() => setIsCreateModalOpen(false)}
					onSubmit={handleSubmitLiftRequest}
				/>
			</main>
		</>
	);
}




