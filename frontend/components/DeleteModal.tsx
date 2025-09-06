import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import styles from '../styles/DeleteModal.module.css';

interface DeleteModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  itemName?: string;
  itemType?: string;
}

export default function DeleteModal({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  loading = false,
  itemName,
  itemType = 'yêu cầu'
}: DeleteModalProps) {
  const { t } = useTranslation();
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setIsConfirmed(false);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleConfirm();
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.deleteModalOverlay}>
      <div className={styles.deleteModalContainer}>
        <div className={styles.deleteModalHeader}>
          <div className={styles.deleteModalIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </div>
          <h3 className={styles.deleteModalTitle}>
            {title || `Gỡ bỏ ${itemType}`}
          </h3>
        </div>

        <div className={styles.deleteModalBody}>
          <p className={styles.deleteModalMessage}>
            {message || `Bạn có chắc chắn muốn gỡ bỏ ${itemType} này khỏi danh sách Depot không?`}
          </p>
          
          {itemName && (
            <div className={styles.deleteModalItemInfo}>
              <div className={styles.deleteModalItemLabel}>
                {itemType.charAt(0).toUpperCase() + itemType.slice(1)}:
              </div>
              <div className={styles.deleteModalItemName}>
                {itemName}
              </div>
            </div>
          )}

          <div className={styles.deleteModalWarning}>
            <div className={styles.deleteModalWarningIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73,18-8-14a2,2 0 0,0-3.48,0l-8,14A2,2 0 0,0,4,21h16a2,2 0 0,0,1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div className={styles.deleteModalWarningText}>
              <strong>Lưu ý:</strong> {itemType.charAt(0).toUpperCase() + itemType.slice(1)} vẫn sẽ hiển thị là "Từ chối" ở phía Khách hàng.
            </div>
          </div>

          <div className={styles.deleteModalForm}>
            <label className={styles.deleteModalCheckboxLabel}>
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                disabled={loading}
                className={styles.deleteModalCheckbox}
              />
              <span className={styles.deleteModalCheckboxText}>
                Tôi hiểu và xác nhận muốn gỡ bỏ {itemType} này
              </span>
            </label>
          </div>
        </div>

        <div className={styles.deleteModalFooter}>
          <button
            type="button"
            className={`${styles.deleteModalBtn} ${styles.deleteModalBtnCancel}`}
            onClick={onCancel}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            {cancelText || 'Hủy'}
          </button>
          <button
            type="button"
            className={`${styles.deleteModalBtn} ${styles.deleteModalBtnConfirm}`}
            onClick={handleConfirm}
            disabled={loading || !isConfirmed}
            onKeyDown={handleKeyPress}
          >
            {loading ? (
              <div className={styles.deleteModalSpinner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              </div>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            )}
            {confirmText || 'Xác nhận gỡ bỏ'}
          </button>
        </div>
      </div>
    </div>
  );
}
