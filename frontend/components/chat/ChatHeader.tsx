interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export default function ChatHeader({
  title,
  subtitle,
  onClose
}: ChatHeaderProps) {
  return (
    <div className="chat-header">
      <div className="chat-header-content">
        <div className="chat-header-info">
          <div className="chat-header-text">
            <h3 className="chat-header-title">{title}</h3>
            {subtitle && <p className="chat-header-subtitle">{subtitle}</p>}
          </div>
        </div>
        
        <div className="chat-header-actions">
          <button
            className="chat-header-btn chat-close-btn"
            onClick={onClose}
            title="Đóng chat"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}





