import React from 'react';

interface ConfirmDeleteModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  title,
  message,
  itemName,
  isDeleting = false
}) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '400px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel} style={{ color: 'white', outline: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-body" style={{ padding: '24px' }}>
          <div style={{ 
            marginBottom: '20px' 
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>
              {message}
            </p>
          </div>
          
          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: '#374151',
              fontWeight: '500'
            }}>
              <strong>"{itemName}"</strong>
            </p>
          </div>
          
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <p style={{ 
              margin: 0, 
              fontSize: '13px', 
              color: '#dc2626' 
            }}>
              Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn.
            </p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              backgroundColor: '#dc2626',
              borderColor: '#dc2626',
              color: 'white'
            }}
          >
            {isDeleting ? (
              <>
                <div 
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}
                />
                Đang xóa...
              </>
            ) : (
              <>
                🗑️ Xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
