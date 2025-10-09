import React from 'react';
import Header from '@components/Header';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToastHook';
import { ExportRequest } from './Requests/components/ExportRequest';
import { CreateLiftRequestModal, LiftRequestData } from './Requests/components/CreateLiftRequestModal';

export default function LiftContainer() {
	const { t } = useTranslation();
	const { showSuccess, ToastContainer } = useToast();
	const [localSearch, setLocalSearch] = React.useState('');
	const [localType, setLocalType] = React.useState('all');
	const [localStatus, setLocalStatus] = React.useState('all');
	const [isCreateLiftModalOpen, setIsCreateLiftModalOpen] = React.useState(false);
	const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleCreateRequest = () => {
    setIsCreateLiftModalOpen(true);
  };

	const handleSubmitLiftRequest = (data: LiftRequestData) => {
		console.log('Lift Request Data:', data);
		console.log('Auto-generated Request Number:', data.requestNo);
		// TODO: Implement API call to create lift request
		
		// Hiển thị thông báo thành công với cảnh báo nếu cần
		if (!data.containerNumber?.trim()) {
			showSuccess(
				'Yêu cầu nâng container đã được tạo thành công!',
				`Số yêu cầu: ${data.requestNo}\n⚠️ Lưu ý: Chưa có số container, vui lòng cập nhật sau`,
				6000 // Hiển thị lâu hơn để user đọc cảnh báo
			);
		} else {
			showSuccess(
				'Yêu cầu nâng container đã được tạo thành công!',
				`Số yêu cầu: ${data.requestNo}`,
				4000 // Hiển thị trong 4 giây
			);
		}
		
		setIsCreateLiftModalOpen(false);
		// Trigger refresh of the table
		setRefreshTrigger(prev => prev + 1);
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
      <main className="container gate-page">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">
                Yêu cầu nâng container
              </h1>
            </div>
          </div>
        </div>

			{/* Import Request Component */}
			<ExportRequest
				localSearch={localSearch}
				setLocalSearch={setLocalSearch}
				localType={localType}
				setLocalType={setLocalType}
				localStatus={localStatus}
				setLocalStatus={setLocalStatus}
				refreshTrigger={refreshTrigger}
				onCreateRequest={handleCreateRequest}
				isReject={true}
			/>

        {/* Create Lift Request Modal */}
        <CreateLiftRequestModal
          isOpen={isCreateLiftModalOpen}
          onClose={() => setIsCreateLiftModalOpen(false)}
          onSubmit={handleSubmitLiftRequest}
        />
        
        {/* Toast Container */}
        <ToastContainer />
      </main>
    </>
  );
}
