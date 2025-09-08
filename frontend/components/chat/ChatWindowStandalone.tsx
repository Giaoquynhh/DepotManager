import ChatWindow from './ChatWindow';

interface ChatWindowStandaloneProps {
  requestId: string;
  requestStatus?: string;
  rejectedReason?: string;
  requestType?: string;
  containerNo?: string;
  appointmentTime?: string;
  appointmentLocation?: string;
  appointmentNote?: string;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
  positionIndex?: number;
  isPaid?: boolean;
}

export default function ChatWindowStandalone({
  requestId,
  requestStatus,
  rejectedReason,
  requestType,
  containerNo,
  appointmentTime,
  appointmentLocation,
  appointmentNote,
  onClose,
  onStatusChange,
  positionIndex = 0,
  isPaid = false
}: ChatWindowStandaloneProps) {
  // Kích thước cửa sổ chat và khoảng cách
  const CHAT_HEIGHT = 500; // đồng bộ với .chat-window trong CSS
  const GAP = 16;
  const bottomOffset = 20 + positionIndex * (CHAT_HEIGHT + GAP);

  return (
    <div
      className="chat-mini-container"
      style={{ bottom: bottomOffset, right: 20, zIndex: 10000 + positionIndex }}
    >
      <ChatWindow
        requestId={requestId}
        requestStatus={requestStatus}
        rejectedReason={rejectedReason}
        requestType={requestType}
        containerNo={containerNo}
        appointmentTime={appointmentTime}
        appointmentLocation={appointmentLocation}
        appointmentNote={appointmentNote}
        onClose={onClose}
        onStatusChange={onStatusChange}
        isPaid={isPaid}
      />
    </div>
  );
}
