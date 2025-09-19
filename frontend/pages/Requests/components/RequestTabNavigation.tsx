import React from 'react';

type ActiveTab = 'lift' | 'lower';

interface RequestTabNavigationProps {
	activeTab: ActiveTab;
	setActiveTab: (tab: ActiveTab) => void;
}

export const RequestTabNavigation: React.FC<RequestTabNavigationProps> = ({
	activeTab,
	setActiveTab
}) => {
	return (
		<div style={{
			display: 'flex',
			gap: '4px',
			marginBottom: '24px',
			padding: '4px',
			background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
			borderRadius: '12px',
			border: '1px solid #e2e8f0',
			boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
			position: 'relative',
			overflow: 'hidden'
		}}>
			{/* Background indicator */}
			<div
				style={{
					position: 'absolute',
					top: '4px',
					left: activeTab === 'lift' ? '4px' : 'calc(50% + 2px)',
					width: 'calc(50% - 4px)',
					height: 'calc(100% - 8px)',
					background: 'linear-gradient(135deg, #0b2b6d 0%, #1e40af 100%)',
					borderRadius: '8px',
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					boxShadow: '0 4px 6px rgba(11, 43, 109, 0.3), 0 1px 3px rgba(11, 43, 109, 0.2)',
					zIndex: 1
				}}
			/>
			
			<button 
				onClick={() => setActiveTab('lift')}
				style={{
					position: 'relative',
					zIndex: 2,
					flex: 1,
					padding: '12px 20px',
					border: 'none',
					background: 'transparent',
					color: activeTab === 'lift' ? 'white' : '#64748b',
					cursor: 'pointer',
					fontSize: '15px',
					fontWeight: '600',
					borderRadius: '8px',
					transition: 'all 0.2s ease',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '8px',
					textShadow: activeTab === 'lift' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
				}}
				onMouseEnter={(e) => {
					if (activeTab !== 'lift') {
						e.currentTarget.style.color = '#334155';
						e.currentTarget.style.transform = 'translateY(-1px)';
					}
				}}
				onMouseLeave={(e) => {
					if (activeTab !== 'lift') {
						e.currentTarget.style.color = '#64748b';
						e.currentTarget.style.transform = 'translateY(0)';
					}
				}}
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
				</svg>
				Yêu cầu nâng container
			</button>
			
			<button 
				onClick={() => setActiveTab('lower')}
				style={{
					position: 'relative',
					zIndex: 2,
					flex: 1,
					padding: '12px 20px',
					border: 'none',
					background: 'transparent',
					color: activeTab === 'lower' ? 'white' : '#64748b',
					cursor: 'pointer',
					fontSize: '15px',
					fontWeight: '600',
					borderRadius: '8px',
					transition: 'all 0.2s ease',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '8px',
					textShadow: activeTab === 'lower' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
				}}
				onMouseEnter={(e) => {
					if (activeTab !== 'lower') {
						e.currentTarget.style.color = '#334155';
						e.currentTarget.style.transform = 'translateY(-1px)';
					}
				}}
				onMouseLeave={(e) => {
					if (activeTab !== 'lower') {
						e.currentTarget.style.color = '#64748b';
						e.currentTarget.style.transform = 'translateY(0)';
					}
				}}
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M12 22V2M7 19H14.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H18"/>
				</svg>
				Yêu cầu hạ container
			</button>
		</div>
	);
};
