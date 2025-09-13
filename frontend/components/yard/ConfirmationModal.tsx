import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
  type = 'danger'
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmBg: 'rgba(239, 68, 68, 0.9)',
          confirmHoverBg: 'rgba(239, 68, 68, 1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          iconBg: 'rgba(239, 68, 68, 0.1)'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmBg: 'rgba(245, 158, 11, 0.9)',
          confirmHoverBg: 'rgba(245, 158, 11, 1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          iconBg: 'rgba(245, 158, 11, 0.1)'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmBg: 'rgba(59, 130, 246, 0.9)',
          confirmHoverBg: 'rgba(59, 130, 246, 1)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          iconBg: 'rgba(59, 130, 246, 0.1)'
        };
      default:
        return {
          icon: '⚠️',
          confirmBg: 'rgba(239, 68, 68, 0.9)',
          confirmHoverBg: 'rgba(239, 68, 68, 1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          iconBg: 'rgba(239, 68, 68, 0.1)'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="confirmation-modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="confirmation-modal-header">
          <div 
            className="confirmation-icon"
            style={{ 
              background: typeStyles.iconBg,
              border: `2px solid ${typeStyles.borderColor}`
            }}
          >
            {typeStyles.icon}
          </div>
          <h3 className="confirmation-title">{title}</h3>
        </div>

        {/* Modal Body */}
        <div className="confirmation-modal-body">
          <p className="confirmation-message">{message}</p>
        </div>

        {/* Modal Footer */}
        <div className="confirmation-modal-footer">
          <button 
            className="confirmation-btn confirmation-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className="confirmation-btn confirmation-btn-confirm"
            onClick={onConfirm}
            disabled={loading}
            style={{ 
              background: typeStyles.confirmBg,
              border: `1px solid ${typeStyles.borderColor}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = typeStyles.confirmHoverBg;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = typeStyles.confirmBg;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? (
              <div className="confirmation-loading">
                <div className="confirmation-spinner"></div>
                <span>Đang xử lý...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
