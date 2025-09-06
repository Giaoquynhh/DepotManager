import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import styles from '../styles/RejectModal.module.css';

interface RejectModalProps {
  visible: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function RejectModal({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
  placeholder,
  confirmText,
  cancelText,
  loading = false
}: RejectModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setReason('');
      setError('');
    }
  }, [visible]);

  const handleConfirm = () => {
    const trimmedReason = reason.trim();
    
    if (!trimmedReason) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    if (trimmedReason.length < 5) {
      setError('Lý do từ chối phải có ít nhất 5 ký tự');
      return;
    }

    if (trimmedReason.length > 500) {
      setError('Lý do từ chối không được vượt quá 500 ký tự');
      return;
    }

    setError('');
    onConfirm(trimmedReason);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleConfirm();
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.rejectModalOverlay}>
      <div className={styles.rejectModalContainer}>
        <div className={styles.rejectModalHeader}>
          <div className={styles.rejectModalIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 className={styles.rejectModalTitle}>
            {title || 'Từ chối yêu cầu'}
          </h3>
        </div>

        <div className={styles.rejectModalBody}>
          <p className={styles.rejectModalMessage}>
            {message || 'Bạn có chắc chắn muốn từ chối yêu cầu này không?'}
          </p>
          
          <div className={styles.rejectModalForm}>
            <label className={styles.rejectModalLabel}>
              Lý do từ chối
              <span className={styles.required}>*</span>
            </label>
            <textarea
              className={`${styles.rejectModalTextarea} ${error ? styles.error : ''}`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyPress}
              placeholder={placeholder || 'Nhập lý do từ chối yêu cầu...'}
              rows={4}
              maxLength={500}
              disabled={loading}
            />
            <div className={styles.rejectModalCharCount}>
              {reason.length}/500
            </div>
            {error && (
              <div className={styles.rejectModalError}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className={styles.rejectModalFooter}>
          <button
            type="button"
            className={`${styles.rejectModalBtn} ${styles.rejectModalBtnCancel}`}
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
            className={`${styles.rejectModalBtn} ${styles.rejectModalBtnConfirm}`}
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
          >
            {loading ? (
              <div className={styles.rejectModalSpinner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              </div>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            )}
            {confirmText || 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}
