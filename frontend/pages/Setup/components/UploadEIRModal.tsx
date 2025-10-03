import React, { useState } from 'react';
import { setupService } from '../../../services/setupService';

interface UploadEIRModalProps {
  isOpen: boolean;
  onClose: () => void;
  shippingLineId: string;
  shippingLineName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const UploadEIRModal: React.FC<UploadEIRModalProps> = ({
  isOpen,
  onClose,
  shippingLineId,
  shippingLineName,
  onSuccess,
  onError
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onError('Vui lòng chọn file');
      return;
    }

    setIsUploading(true);
    try {
      const response = await setupService.uploadShippingLineEIR(shippingLineId, selectedFile);
      
      if (response.success) {
        onSuccess(`Đã upload file EIR cho ${shippingLineName} thành công!`);
        setSelectedFile(null);
        onClose();
      } else {
        onError(response.message || 'Upload thất bại');
      }
    } catch (error: any) {
      onError(error.message || 'Có lỗi xảy ra khi upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          margin: '0 auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Upload File EIR
          </h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            Upload file EIR cho: <strong>{shippingLineName}</strong>
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {selectedFile && (
          <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#059669' }}>
              ✓ File đã chọn: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          <p style={{ margin: 0 }}>• Chỉ chấp nhận file Excel (.xlsx, .xls)</p>
          <p style={{ margin: 0 }}>• Kích thước tối đa: 10MB</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={handleClose}
            disabled={isUploading}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: isUploading ? 'not-allowed' : 'pointer'
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: (!selectedFile || isUploading) ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: '4px',
              cursor: (!selectedFile || isUploading) ? 'not-allowed' : 'pointer'
            }}
          >
            {isUploading ? 'Đang upload...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};
