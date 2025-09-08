import React, { useState, useEffect, useRef } from 'react';
import { api } from '@services/api';
import { useTranslation } from '../../../hooks/useTranslation';

interface ChatMessage {
	id: string;
	message: string;
	sender: {
		id: string;
		full_name: string;
		email: string;
		role: string;
	};
	createdAt: string;
}

interface DepotChatWindowProps {
	requestId: string;
	containerNo: string;
	requestType: string;
	requestStatus: string;
	isPaid?: boolean;
	onClose: () => void;
	onMinimize: () => void;
	onMouseDown: (e: React.MouseEvent) => void;
	// Thêm props để theo dõi thay đổi thông tin
	hasSupplementDocuments?: boolean;
	lastSupplementUpdate?: string;
}

export default function DepotChatWindow({
	requestId,
	containerNo,
	requestType,
	requestStatus,
	isPaid = false,
	onClose,
	onMinimize,
	onMouseDown,
	hasSupplementDocuments = false,
	lastSupplementUpdate
}: DepotChatWindowProps) {
	const { t } = useTranslation();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [chatRoomId, setChatRoomId] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [me, setMe] = useState<any>(null);

	// Check if chat is allowed based on request status (chỉ chặn PENDING, PICK_CONTAINER)
	const isChatAllowed = !['PENDING', 'PICK_CONTAINER'].includes(requestStatus);

	// Load user info
	useEffect(() => {
		api.get('/auth/me').then(r => setMe(r.data)).catch(() => {});
	}, []);

	// Auto scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Load chat room and messages
	useEffect(() => {
		if (!requestId || !isChatAllowed) return;

		// Cho trạng thái PENDING_ACCEPT, load từ localStorage hoặc tạo welcome message
		if (requestStatus === 'PENDING_ACCEPT') {
			const storageKey = `chat_messages_${requestId}`;
			const savedMessages = localStorage.getItem(storageKey);
			
			if (savedMessages) {
				try {
					const parsedMessages = JSON.parse(savedMessages);
					setMessages(parsedMessages);
					console.log('Loaded messages from localStorage:', parsedMessages);
				} catch (error) {
					console.error('Error parsing saved messages:', error);
					// Nếu lỗi parse, xóa localStorage và tạo welcome message mới
					localStorage.removeItem(storageKey);
				}
			}
			
			// Nếu không có tin nhắn đã lưu, tạo welcome message
			if (!savedMessages || messages.length === 0) {
				const welcomeMessage: ChatMessage = {
					id: `welcome-pending-accept-${Date.now()}`,
					message: `📧 **XÁC NHẬN ĐÃ GỬI:** Đơn hàng đã được gửi xác nhận cho khách hàng!\n\n📦 Container: ${containerNo}\n📋 Trạng thái: Chờ chấp nhận\n\nBây giờ bạn có thể chat trực tiếp với khách hàng để trao đổi thông tin chi tiết.`,
					sender: {
						id: 'system',
						full_name: 'Hệ thống',
						email: 'system@example.com',
						role: 'System'
					},
					createdAt: new Date().toISOString()
				};
				
				setMessages([welcomeMessage]);
				localStorage.setItem(storageKey, JSON.stringify([welcomeMessage]));
			}
			
			setLoading(false);
			return;
		}

		const loadChatRoom = async () => {
			setLoading(true);
			try {
				// Get or create chat room for this request
				const response = await api.get(`/chat/request/${requestId}`);
				setChatRoomId(response.data.id);
				
				// Load messages
				const messagesResponse = await api.get(`/chat/${response.data.id}/messages`);
				setMessages(messagesResponse.data.data || messagesResponse.data); // Handle both response formats
			} catch (error) {
				console.error('Error loading chat room:', error);
				// Fallback to demo messages if backend fails
				setMessages([
					{
						id: '1',
						message: 'Xin chào! Tôi cần hỗ trợ về container này.',
						sender: {
							id: 'customer1',
							full_name: 'Khách hàng ABC',
							email: 'customer@example.com',
							role: 'Customer'
						},
						createdAt: new Date(Date.now() - 300000).toISOString()
					},
					{
						id: '2',
						message: 'Chào bạn! Tôi sẽ hỗ trợ bạn ngay.',
						sender: {
							id: me?.id || 'depot1',
							full_name: me?.full_name || 'Nhân viên Kho',
							email: me?.email || 'depot@example.com',
							role: me?.role || 'Depot Staff'
						},
						createdAt: new Date(Date.now() - 180000).toISOString()
					}
				]);
			} finally {
				setLoading(false);
			}
		};

		loadChatRoom();
	}, [requestId, isChatAllowed, me, requestStatus]);

	// Thêm thông báo khi khách hàng bổ sung thông tin
	useEffect(() => {
		// Debug log để kiểm tra
		console.log('Supplement check:', { hasSupplementDocuments, lastSupplementUpdate, isChatAllowed, containerNo });
		
		if (hasSupplementDocuments && lastSupplementUpdate && isChatAllowed) {
			console.log('Creating supplement notification...');
			
			const supplementMessage: ChatMessage = {
				id: `supplement-${Date.now()}`,
				message: `📋 **THÔNG BÁO:** Khách hàng đã bổ sung thông tin cho đơn hàng!\n\n📅 Thời gian cập nhật: ${new Date(lastSupplementUpdate).toLocaleString('vi-VN')}\n📦 Container: ${containerNo}\n\nVui lòng kiểm tra và xử lý thông tin mới.`,
				sender: {
					id: 'system',
					full_name: 'Hệ thống',
					email: 'system@depot.com',
					role: 'System'
				},
				createdAt: new Date().toISOString()
			};

			// Thêm message vào đầu danh sách để hiển thị ở trên cùng
			setMessages(prev => [supplementMessage, ...prev]);
		}
	}, [hasSupplementDocuments, lastSupplementUpdate, isChatAllowed, containerNo]);

	// Tự động tạo supplement notification khi mở chat lần đầu
	useEffect(() => {
		// Chỉ tạo notification khi thực sự có supplement documents
		if (isChatAllowed && hasSupplementDocuments && lastSupplementUpdate && messages.length === 0) {
			console.log('Auto-creating supplement notification on first chat open...');
			
			const autoSupplementMessage: ChatMessage = {
				id: `auto-supplement-${Date.now()}`,
				message: `📋 **THÔNG BÁO:** Khách hàng đã bổ sung thông tin cho đơn hàng!\n\n📅 Thời gian cập nhật: ${new Date(lastSupplementUpdate).toLocaleString('vi-VN')}\n📦 Container: ${containerNo}\n\nVui lòng kiểm tra và xử lý thông tin mới.`,
				sender: {
					id: 'system',
					full_name: 'Hệ thống',
					email: 'system@depot.com',
					role: 'System'
				},
				createdAt: new Date().toISOString()
			};

			// Thêm message vào đầu danh sách
			setMessages([autoSupplementMessage]);
		}
	}, [isChatAllowed, hasSupplementDocuments, lastSupplementUpdate, containerNo, messages.length]);

	// Tự động tạo welcome message cho PENDING_ACCEPT status
	useEffect(() => {
		if (isChatAllowed && requestStatus === 'PENDING_ACCEPT' && messages.length === 0) {
			console.log('Auto-creating welcome message for PENDING_ACCEPT status...');
			
			const welcomeMessage: ChatMessage = {
				id: `welcome-pending-accept-${Date.now()}`,
				message: `📧 **XÁC NHẬN ĐÃ GỬI:** Đơn hàng đã được gửi xác nhận cho khách hàng!\n\n📦 Container: ${containerNo}\n📋 Trạng thái: Chờ chấp nhận\n\nBây giờ bạn có thể chat trực tiếp với khách hàng để trao đổi thông tin chi tiết.`,
				sender: {
					id: 'system',
					full_name: 'Hệ thống',
					email: 'system@example.com',
					role: 'System'
				},
				createdAt: new Date().toISOString()
			};

			// Thêm message vào đầu danh sách
			setMessages([welcomeMessage]);
			
			// Lưu vào localStorage
			const storageKey = `chat_messages_${requestId}`;
			localStorage.setItem(storageKey, JSON.stringify([welcomeMessage]));
		}
	}, [isChatAllowed, requestStatus, containerNo, messages.length, requestId]);

	// Poll for new messages
	useEffect(() => {
		// Không poll cho trạng thái PENDING_ACCEPT
		if (!chatRoomId || requestStatus === 'PENDING_ACCEPT') return;

		const pollMessages = async () => {
			try {
				const response = await api.get(`/chat/${chatRoomId}/messages`);
				setMessages(response.data.data || response.data); // Handle both response formats
			} catch (error) {
				console.error('Error polling messages:', error);
			}
		};

		const interval = setInterval(pollMessages, 3000); // Poll every 3 seconds
		return () => clearInterval(interval);
	}, [chatRoomId, requestStatus]);

	// Poll localStorage cho trạng thái PENDING_ACCEPT để đồng bộ tin nhắn
	useEffect(() => {
		if (requestStatus !== 'PENDING_ACCEPT') return;

		const pollLocalStorage = () => {
			const storageKey = `chat_messages_${requestId}`;
			const savedMessages = localStorage.getItem(storageKey);
			
			if (savedMessages) {
				try {
					const parsedMessages = JSON.parse(savedMessages);
					// Chỉ cập nhật nếu có tin nhắn mới
					if (parsedMessages.length !== messages.length) {
						setMessages(parsedMessages);
						console.log('Synced messages from localStorage:', parsedMessages);
					}
				} catch (error) {
					console.error('Error parsing saved messages during polling:', error);
				}
			}
		};

		const interval = setInterval(pollLocalStorage, 1000); // Poll every 1 second for real-time sync
		return () => clearInterval(interval);
	}, [requestId, requestStatus, messages.length]);

	const sendMessage = async () => {
		if (!newMessage.trim() || !me || isPaid) return;

		// Cho trạng thái PENDING_ACCEPT, luôn sử dụng local message
		if (requestStatus === 'PENDING_ACCEPT') {
			const newMsg: ChatMessage = {
				id: Date.now().toString(),
				message: newMessage.trim(),
				sender: {
					id: me?.id || 'depot1',
					full_name: me?.full_name || 'Nhân viên Kho',
					email: me?.email || 'depot@example.com',
					role: me?.role || 'Depot Staff'
				},
				createdAt: new Date().toISOString()
			};
			
			// Cập nhật state và lưu vào localStorage
			setMessages(prev => {
				const updatedMessages = [...prev, newMsg];
				const storageKey = `chat_messages_${requestId}`;
				localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
				return updatedMessages;
			});
			
			setNewMessage('');
			return;
		}

		// Cho các trạng thái khác, gọi API
		if (!chatRoomId) return;

		setSending(true);
		try {
			const response = await api.post(`/chat/${chatRoomId}/messages`, {
				message: newMessage.trim()
			});

			// Add new message to local state
			setMessages(prev => [...prev, response.data]);
			setNewMessage('');
		} catch (error) {
			console.error('Error sending message:', error);
			// Fallback to local message if backend fails
			const newMsg: ChatMessage = {
				id: Date.now().toString(),
				message: newMessage.trim(),
				sender: {
					id: me?.id || 'depot1',
					full_name: me?.full_name || 'Nhân viên Kho',
					email: me?.email || 'depot@example.com',
					role: me?.role || 'Depot Staff'
				},
				createdAt: new Date().toISOString()
			};
			setMessages(prev => [...prev, newMsg]);
			setNewMessage('');
		} finally {
			setSending(false);
		}
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
			'PENDING_ACCEPT': `📧 ${t('pages.requests.filterOptions.pendingAccept')} - ${t('pages.requests.chat.activated')}`,
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
			>
				<div className="chat-header" onMouseDown={onMouseDown}>
				<div className="chat-title">
					💬 {t('pages.requests.chat.title')} - {containerNo}
				</div>
					<div className="chat-actions">
						<button onMouseDown={(e) => e.stopPropagation()} onClick={onMinimize} className="chat-btn chat-minimize">−</button>
						<button onMouseDown={(e) => e.stopPropagation()} onClick={onClose} className="chat-btn chat-close">×</button>
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
					</div>
				</div>
			</div>
		);
	}

	return (
		<div 
			className="depot-chat-window"
		>
			<div className="chat-header" onMouseDown={onMouseDown}>
				<div className="chat-title">
					💬 {t('pages.requests.chat.title')} - {containerNo}
				</div>
				<div className="chat-actions">
					<button onMouseDown={(e) => e.stopPropagation()} onClick={onMinimize} className="chat-btn chat-minimize">−</button>
					<button onMouseDown={(e) => e.stopPropagation()} onClick={onClose} className="chat-btn chat-close">×</button>
				</div>
			</div>
			
			<div className="chat-body">
				{loading ? (
					<div className="chat-loading">
						<div className="loading-spinner"></div>
						<p>{t('pages.requests.chat.loadingMessages')}</p>
					</div>
				) : (
					<>
						<div className="chat-status-message">
							{getStatusMessage()}
							
							{/* Test button để demo supplement notification */}
							{process.env.NODE_ENV === 'development' && (
								<div style={{ marginTop: '8px' }}>
									<button
										onClick={() => {
											const testMessage: ChatMessage = {
												id: `test-supplement-${Date.now()}`,
												message: `📋 **${t('pages.requests.chat.notification')}:** ${t('pages.requests.chat.customerSupplementedInfo')}!\n\n📅 ${t('pages.requests.chat.updateTime')}: ${new Date().toLocaleString('vi-VN')}\n📦 Container: ${containerNo}\n\n${t('pages.requests.chat.pleaseCheckNewInfo')}.`,
												sender: {
													id: 'system',
													full_name: t('pages.requests.chat.system'),
													email: 'system@depot.com',
													role: 'System'
												},
												createdAt: new Date().toISOString()
											};
											setMessages(prev => [testMessage, ...prev]);
										}}
										style={{
											background: '#f59e0b',
											color: 'white',
											border: 'none',
											padding: '4px 8px',
											borderRadius: '4px',
											fontSize: '11px',
											cursor: 'pointer'
										}}
									>
										🧪 {t('pages.requests.chat.testSupplementNotification')}
									</button>
									
									{/* Debug button để test localStorage */}
									<button
										onClick={() => {
											const storageKey = `chat_messages_${requestId}`;
											const savedMessages = localStorage.getItem(storageKey);
											console.log('Current localStorage content:', savedMessages);
											console.log('Current messages state:', messages);
										}}
										style={{
											background: '#10b981',
											color: 'white',
											border: 'none',
											padding: '4px 8px',
											borderRadius: '4px',
											fontSize: '11px',
											cursor: 'pointer',
											marginLeft: '8px'
										}}
									>
										🔍 {t('pages.requests.chat.debugLocalStorage')}
									</button>
								</div>
							)}
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
										className={`chat-message ${
											message.sender.id === 'system' 
												? 'chat-message-system' 
												: message.sender.id === me?.id 
													? 'chat-message-own' 
													: 'chat-message-other'
										}`}
									>
										<div className="chat-message-header">
											<span className="chat-message-sender">
												{message.sender.id === 'system' ? '🔔 ' : ''}
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
									placeholder={isPaid ? t('pages.requests.payment.paid') + ' - Chat đã khóa' : t('pages.requests.chat.enterMessage')}
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									disabled={sending || isPaid}
									rows={2}
								/>
								<button
									className="chat-send-btn"
									onClick={sendMessage}
									disabled={!newMessage.trim() || sending || isPaid}
								>
									{sending ? '⏳' : '📤'}
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
