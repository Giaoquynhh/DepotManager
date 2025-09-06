import React from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = false,
  autoCloseDelay = 3000
}: NotificationModalProps) {
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: '#f0fdf4',
          borderColor: '#22c55e',
          iconBg: '#dcfce7',
          iconColor: '#16a34a',
          titleColor: '#15803d'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: '#fef2f2',
          borderColor: '#ef4444',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
          titleColor: '#b91c1c'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: '#fffbeb',
          borderColor: '#f59e0b',
          iconBg: '#fef3c7',
          iconColor: '#d97706',
          titleColor: '#b45309'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          bgColor: '#eff6ff',
          borderColor: '#3b82f6',
          iconBg: '#dbeafe',
          iconColor: '#2563eb',
          titleColor: '#1d4ed8'
        };
    }
  };

  const colors = getIconAndColors();

  return (
    <div 
      className="notification-overlay"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 2000,
        pointerEvents: 'none',
        margin: '0 20px 0 0'
      }}
    >
      <div 
        className="notification-modal"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '350px',
          width: '350px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          border: `2px solid ${colors.borderColor}`,
          position: 'relative',
          animation: 'slideInFromRight 0.3s ease-out',
          pointerEvents: 'auto'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>

        {/* Icon and content */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: colors.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}
          >
            {colors.icon}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: colors.titleColor,
                lineHeight: '1.4'
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: '0',
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.5'
              }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: colors.borderColor,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            OK
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
