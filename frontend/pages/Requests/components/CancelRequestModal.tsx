import React, { useState } from 'react';

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  requestNo?: string;
}

export const CancelRequestModal: React.FC<CancelRequestModalProps> = ({ isOpen, onClose, onConfirm, requestNo }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const submit = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Hủy yêu cầu {requestNo ? `- ${requestNo}` : ''}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Lý do hủy</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Nhập lý do hủy..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {error && <span className="error-text">{error}</span>}
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn btn-danger" onClick={submit}>Xác nhận hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
};


