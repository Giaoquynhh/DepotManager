import React from 'react';
import Header from '@components/Header';
import { useTranslation } from '../hooks/useTranslation';
import { ExportRequest } from './Requests/components/ExportRequest';
import { CreateLowerRequestModal, LowerRequestData } from './Requests/components';

export default function LowerContainer() {
	const { t } = useTranslation();
	const [localSearch, setLocalSearch] = React.useState('');
	const [localType, setLocalType] = React.useState('all');
	const [localStatus, setLocalStatus] = React.useState('all');
	const [isCreateLowerModalOpen, setIsCreateLowerModalOpen] = React.useState(false);
	const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleCreateRequest = () => {
    setIsCreateLowerModalOpen(true);
  };

	const handleSubmitLowerRequest = (data: LowerRequestData) => {
		console.log('Lower Request Data:', data);
		console.log('Auto-generated Request Number:', data.requestNo);
		// TODO: Implement API call to create lower request
		alert(`Yêu cầu hạ container đã được tạo thành công!\nSố yêu cầu: ${data.requestNo}`);
		setIsCreateLowerModalOpen(false);
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
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">
                Yêu cầu hạ container
              </h1>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#64748b', 
                fontSize: '14px',
                fontWeight: '400'
              }}>
                Quản lý các yêu cầu xuất khẩu container (hạ container từ bãi lên xe)
              </p>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-success"
                onClick={handleCreateRequest}
              >
                Tạo yêu cầu hạ container
              </button>
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
			/>

        {/* Create Lower Request Modal */}
        <CreateLowerRequestModal
          isOpen={isCreateLowerModalOpen}
          onClose={() => setIsCreateLowerModalOpen(false)}
          onSubmit={handleSubmitLowerRequest}
        />
      </main>
    </>
  );
}
