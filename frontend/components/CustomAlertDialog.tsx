import React from 'react';
import styles from './CustomAlertDialog.module.css';

export interface CustomAlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'error' | 'success' | 'info';
  loading?: boolean;
}

export const CustomAlertDialog: React.FC<CustomAlertDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  loading = false
}) => {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={styles.customAlertBackdrop} onClick={onCancel}>
      <div className={`${styles.customAlertDialog} ${styles[type]}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.customAlertHeader}>
          <div className={styles.customAlertIcon}>
            {getIcon()}
          </div>
          <h3 className={styles.customAlertTitle}>{title}</h3>
        </div>

        {/* Body */}
        <div className={styles.customAlertBody}>
          <p className={styles.customAlertMessage}>{message}</p>
        </div>

        {/* Actions */}
        <div className={styles.customAlertActions}>
          <button 
            className={`${styles.customAlertButton} ${styles.customAlertButtonCancel}`}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className={`${styles.customAlertButton} ${styles.customAlertButtonConfirm}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
