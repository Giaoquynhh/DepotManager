import React, { useState, useEffect } from 'react';
import styles from '../styles/AcceptModal.module.css';
import { useTranslation } from '../hooks/useTranslation';

interface AcceptModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function AcceptModal({
  visible,
  onConfirm,
  onCancel,
  loading = false,
  title,
  message,
  confirmText,
  cancelText
}: AcceptModalProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={styles.acceptModalOverlay}
      onClick={handleCancel}
      onKeyDown={handleKeyPress}
      tabIndex={-1}
    >
      <div 
        className={styles.acceptModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.acceptModalHeader}>
          <div className={styles.acceptModalIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
          </div>
          <h3 className={styles.acceptModalTitle}>
            {title || t('pages.requests.acceptModal.title')}
          </h3>
        </div>
        
        <div className={styles.acceptModalBody}>
          <p className={styles.acceptModalMessage}>
            {message || t('pages.requests.acceptModal.message')}
          </p>
        </div>
        
        <div className={styles.acceptModalFooter}>
          <button
            type="button"
            className={styles.acceptModalCancel}
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText || t('pages.requests.acceptModal.cancel')}
          </button>
          <button
            type="button"
            className={styles.acceptModalConfirm}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className={styles.acceptModalSpinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                </svg>
                {t('pages.requests.acceptModal.processing')}
              </>
            ) : (
              confirmText || t('pages.requests.acceptModal.confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
