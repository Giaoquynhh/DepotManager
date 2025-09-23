import React from 'react';

interface ModalHeaderProps {
	title: string;
	onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose }) => {
	return (
		<div style={{
			padding: '24px 32px 16px',
			borderBottom: '1px solid #e5e7eb',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between'
		}}>
			<h2 style={{
				margin: 0,
				fontSize: '20px',
				fontWeight: '600',
				color: '#1f2937'
			}}>
				{title}
			</h2>
			<button
				onClick={onClose}
				style={{
					background: 'none',
					border: 'none',
					fontSize: '24px',
					cursor: 'pointer',
					color: '#6b7280',
					padding: '4px',
					borderRadius: '4px',
					transition: 'all 0.2s'
				}}
				onMouseOver={(e) => {
					e.currentTarget.style.background = '#f3f4f6';
					e.currentTarget.style.color = '#374151';
				}}
				onMouseOut={(e) => {
					e.currentTarget.style.background = 'none';
					e.currentTarget.style.color = '#6b7280';
				}}
			>
				×
			</button>
		</div>
	);
};


