import { useState } from 'react';
import ChatWindow from './ChatWindow';

interface ChatMiniProps {
  requestId: string;
  requestStatus?: string;
  rejectedReason?: string;
  requestType?: string;
  containerNo?: string;
  onStatusChange?: (status: string) => void;
}

export default function ChatMini({
  requestId,
  requestStatus,
  rejectedReason,
  requestType,
  containerNo,
  onStatusChange
}: ChatMiniProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Chat trigger button (when closed)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="chat-mini-trigger"
        title="Mở chat hỗ trợ"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    );
  }

  // Full chat window
  return (
    <div className="chat-mini-container">
      <ChatWindow
        requestId={requestId}
        requestStatus={requestStatus}
        rejectedReason={rejectedReason}
        requestType={requestType}
        containerNo={containerNo}
        onClose={handleClose}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}





