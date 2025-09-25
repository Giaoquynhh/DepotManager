import React from 'react';
import { useRouter } from 'next/router';
import Header from '@components/Header';
import { useTranslation } from '../../../hooks/useTranslation';
import { ExportRequest } from '../../Requests/components/ExportRequest';
import { CreateLowerRequestModal, LowerRequestData } from '../../Requests/components';
import { requestService } from '../../../services/requests';
import { useToast } from '../../../hooks/useToastHook';
import { useRouteRefresh } from '../../../hooks/useRouteRefresh';

export default function LowerContainer() {
	const router = useRouter();
	const { t } = useTranslation();
	const { showSuccess, ToastContainer } = useToast();
	const [localSearch, setLocalSearch] = React.useState('');
	const [localType, setLocalType] = React.useState('all');
	const [localStatus, setLocalStatus] = React.useState('all');
	const [isCreateLowerModalOpen, setIsCreateLowerModalOpen] = React.useState(false);
	const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [isReject, setIsReject] = React.useState(false);
  const routeRefreshKey = useRouteRefresh();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isRejectParam = params.get('isReject');
      setIsReject(isRejectParam === 'true' || isRejectParam === '1');
    }
  }, []);

  // Force refresh when route changes to ensure fresh data
  React.useEffect(() => {
    if (router.isReady) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [router.pathname, router.isReady]);

  // Additional refresh when route changes (using custom hook)
  React.useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [routeRefreshKey]);

  const handleCreateRequest = () => {
    setIsCreateLowerModalOpen(true);
  };

	const handleSubmitLowerRequest = async (data: LowerRequestData) => {
		// Modal đã gọi API tạo request rồi, chỉ cần refresh table và đóng modal
		console.log('Lower Request Data received:', data);
		console.log('Auto-generated Request Number:', data.requestNo);

		// Hiển thị thông báo thành công giống trang Nâng container
		showSuccess(
			'Yêu cầu hạ container đã được tạo thành công!',
			`Số yêu cầu: ${data.requestNo}`,
			4000
		);
		
		// Trigger refresh of the table
		setRefreshTrigger(prev => prev + 1);
		setIsCreateLowerModalOpen(false);
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
                Yêu cầu hạ container
              </h1>
            </div>
          </div>
        </div>

			{/* Export Request Component */}
			<ExportRequest
				localSearch={localSearch}
				setLocalSearch={setLocalSearch}
				localType={localType}
				setLocalType={setLocalType}
				localStatus={localStatus}
				setLocalStatus={setLocalStatus}
				refreshTrigger={refreshTrigger}
        isReject={isReject}
				onCreateRequest={handleCreateRequest}
			/>

        {/* Create Lower Request Modal */}
        <CreateLowerRequestModal
          isOpen={isCreateLowerModalOpen}
          onClose={() => setIsCreateLowerModalOpen(false)}
          onSubmit={handleSubmitLowerRequest}
        />

			{/* Toast Container */}
			<ToastContainer />
      </main>
    </>
  );
}
