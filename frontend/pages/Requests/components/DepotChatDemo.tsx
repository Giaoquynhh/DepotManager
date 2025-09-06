import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

interface ChatMessage {
	id: string;
	message: string;
	sender: {
		id: string;
		full_name: string;
		role: string;
	};
	createdAt: string;
}

interface DepotChatDemoProps {
	requestId: string;
	containerNo: string;
	requestType: string;
	requestStatus: string;
	onClose: () => void;
	onMinimize: () => void;
	onMouseDown: (e: React.MouseEvent) => void;
}

export default function DepotChatDemo({
	requestId,
	containerNo,
	requestType,
	requestStatus,
	onClose,
	onMinimize,
	onMouseDown
}: DepotChatDemoProps) {
	const { t } = useTranslation();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [sending, setSending] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Check if chat is allowed based on request status (allow SCHEDULED for demo)
	const isChatAllowed = requestStatus === 'SCHEDULED' || 
						 requestStatus === 'APPROVED' || 
						 requestStatus === 'IN_PROGRESS' || 
						 requestStatus === 'COMPLETED' || 
						 requestStatus === 'EXPORTED';

	// Auto scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Load demo messages when component mounts
	useEffect(() => {
		if (isChatAllowed) {
			setMessages([
				{
					id: '1',
					message: 'Xin chào! Tôi cần hỗ trợ về container này.',
					sender: {
						id: 'customer1',
						full_name: 'Khách hàng ABC',
						role: 'Customer'
					},
					createdAt: new Date(Date.now() - 300000).toISOString()
				},
				{
					id: '2',
					message: 'Chào bạn! Tôi sẽ hỗ trợ bạn ngay. Container này đang được xử lý.',
					sender: {
						id: 'depot1',
						full_name: 'Nhân viên Kho',
						role: 'Depot Staff'
					},
					createdAt: new Date(Date.now() - 180000).toISOString()
				}
			]);
		}
	}, [isChatAllowed]);

	const sendMessage = () => {
		if (!newMessage.trim()) return;

		setSending(true);
		
		// Simulate API delay
		setTimeout(() => {
			const newMsg: ChatMessage = {
				id: Date.now().toString(),
				message: newMessage.trim(),
				sender: {
					id: 'depot1',
					full_name: t('pages.requests.chat.depotStaff'),
					role: 'Depot Staff'
				},
				createdAt: new Date().toISOString()
			};
			
			setMessages(prev => [...prev, newMsg]);
			setNewMessage('');
			setSending(false);
		}, 500);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const getStatusMessage = () => {
		const statusMessages: Record<string, string> = {
			'SCHEDULED': `📅 ${t('pages.requests.filterOptions.scheduled')} - ${t('pages.requests.chat.activated')}`,
			'APPROVED': `✅ ${t('pages.requests.filterOptions.approved')} - ${t('pages.requests.chat.activated')}`,
			'IN_PROGRESS': `🔄 ${t('pages.requests.filterOptions.inProgress')} - ${t('pages.requests.chat.activated')}`,
			'COMPLETED': `✅ ${t('pages.requests.filterOptions.completed')} - ${t('pages.requests.chat.stillActive')}`,
			'EXPORTED': `📦 ${t('pages.requests.filterOptions.exported')} - ${t('pages.requests.chat.stillActive')}`,
			'PENDING': `📋 ${t('pages.requests.filterOptions.pending')} - ${t('pages.requests.chat.willActivateWhenScheduled')}`,
			'RECEIVED': `📥 ${t('pages.requests.filterOptions.received')} - ${t('pages.requests.chat.willActivateWhenAccepted')}`,
			'REJECTED': `❌ ${t('pages.requests.filterOptions.rejected')} - ${t('pages.requests.chat.notAvailable')}`
		};
		return statusMessages[requestStatus] || `🔄 ${t('pages.requests.chat.orderStatus')}: ${requestStatus}`;
	};

	if (!isChatAllowed) {
		return (
			<div 
				className="depot-chat-window"
				onMouseDown={onMouseDown}
			>
				<div className="chat-header">
				<div className="chat-title">
					💬 {t('pages.requests.chat.title')} - {containerNo}
				</div>
					<div className="chat-actions">
						<button onClick={onMinimize} className="chat-btn chat-minimize">−</button>
						<button onClick={onClose} className="chat-btn chat-close">×</button>
					</div>
				</div>
				<div className="chat-body">
					<div className="chat-status-message">
						{getStatusMessage()}
					</div>
					<div className="chat-info">
						<p><strong>{t('pages.requests.chat.container')}:</strong> {containerNo}</p>
						<p><strong>{t('pages.requests.chat.type')}:</strong> {requestType === 'IMPORT' ? t('pages.requests.chat.import') : requestType === 'EXPORT' ? t('pages.requests.chat.export') : t('pages.requests.chat.conversion')}</p>
						<p><strong>{t('pages.requests.chat.status')}:</strong> {requestStatus}</p>
						<p><strong>{t('pages.requests.chat.note')}:</strong> {t('pages.requests.chat.availableWhenScheduled')}</p>
						<p><strong>{t('pages.requests.chat.demo')}:</strong> {t('pages.requests.chat.demoDescription')}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div 
			className="depot-chat-window"
			onMouseDown={onMouseDown}
		>
			<div className="chat-header">
				<div className="chat-title">
					💬 {t('pages.requests.chat.title')} - {containerNo} ({t('pages.requests.chat.demo')})
				</div>
				<div className="chat-actions">
					<button onClick={onMinimize} className="chat-btn chat-minimize">−</button>
					<button onClick={onClose} className="chat-btn chat-close">×</button>
				</div>
			</div>
			
			<div className="chat-body">
				<div className="chat-status-message">
					{getStatusMessage()}
				</div>
				
				<div className="chat-messages">
							{messages.length === 0 ? (
								<div className="chat-empty">
									<p>{t('pages.requests.chat.noMessages')}</p>
									<small>{t('pages.requests.chat.startConversation')}</small>
								</div>
					) : (
						messages.map((message) => (
							<div 
								key={message.id} 
								className={`chat-message ${message.sender.id === 'depot1' ? 'chat-message-own' : 'chat-message-other'}`}
							>
								<div className="chat-message-header">
									<span className="chat-message-sender">
										{message.sender.full_name} ({message.sender.role})
									</span>
									<span className="chat-message-time">
										{new Date(message.createdAt).toLocaleString('vi-VN')}
									</span>
								</div>
								<div className="chat-message-content">
									{message.message}
								</div>
							</div>
						))
					)}
					<div ref={messagesEndRef} />
				</div>
				
				<div className="chat-input-area">
					<div className="chat-input-wrapper">
								<textarea
									className="chat-input"
									placeholder={`${t('pages.requests.chat.enterMessage')} (${t('pages.requests.chat.demoMode')})`}
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									disabled={sending}
									rows={2}
								/>
						<button
							className="chat-send-btn"
							onClick={sendMessage}
							disabled={!newMessage.trim() || sending}
						>
							{sending ? '⏳' : '📤'}
						</button>
					</div>
					<div style={{ fontSize: '11px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
						💡 Demo mode - Tin nhắn chỉ được lưu tạm thời
					</div>
				</div>
			</div>
		</div>
	);
}
