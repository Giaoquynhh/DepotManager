import React from 'react';
import Header from '@components/Header';
import { useTranslation } from '../hooks/useTranslation';
import { ImportRequest } from './Requests/components/ImportRequest';
import { CreateLiftRequestModal, LiftRequestData } from './Requests/components';

export default function LiftContainer() {
	const { t } = useTranslation();
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
		alert(`Yêu cầu nâng container đã được tạo thành công!\nSố yêu cầu: ${data.requestNo}`);
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
      <main className="container depot-requests">
        <div className="page-header modern-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title gradient gradient-ultimate">
                Yêu cầu nâng container
              </h1>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#64748b', 
                fontSize: '14px',
                fontWeight: '400'
              }}>
                Quản lý các yêu cầu nhập khẩu container (nâng container từ xe vào bãi)
              </p>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-success"
                onClick={handleCreateRequest}
              >
                Tạo yêu cầu nâng container
              </button>
            </div>
          </div>
        </div>

			{/* Import Request Component */}
			<ImportRequest
				localSearch={localSearch}
				setLocalSearch={setLocalSearch}
				localType={localType}
				setLocalType={setLocalType}
				localStatus={localStatus}
				setLocalStatus={setLocalStatus}
				refreshTrigger={refreshTrigger}
			/>

        {/* Create Lift Request Modal */}
        <CreateLiftRequestModal
          isOpen={isCreateLiftModalOpen}
          onClose={() => setIsCreateLiftModalOpen(false)}
          onSubmit={handleSubmitLiftRequest}
        />
      </main>
    </>
  );
}
