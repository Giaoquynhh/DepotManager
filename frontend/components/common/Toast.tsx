import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, visible, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Wait for animation to complete
  };

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '500px',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      cursor: 'pointer'
    };

    switch (type) {
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626'
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#dcfce7',
          border: '1px solid #bbf7d0',
          color: '#16a34a'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          color: '#d97706'
        };
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: '#dbeafe',
          border: '1px solid #bfdbfe',
          color: '#2563eb'
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  if (!visible && !isVisible) return null;

  return (
    <div style={getToastStyles()} onClick={handleClose}>
      <span style={{ fontSize: '18px' }}>{getIcon()}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
          {type === 'error' ? 'Lỗi tìm kiếm' : 
           type === 'success' ? 'Thành công' :
           type === 'warning' ? 'Cảnh báo' : 'Thông báo'}
        </div>
        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
          {message}
        </div>
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: 'inherit',
          padding: '0',
          marginLeft: '8px'
        }}
      >
        ×
      </button>
    </div>
  );
}
