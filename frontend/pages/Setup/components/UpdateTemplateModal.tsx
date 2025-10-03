import React, { useState } from 'react';
import { setupService } from '../../../services/setupService';

interface UpdateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  shippingLineId: string;
  shippingLineName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const UpdateTemplateModal: React.FC<UpdateTemplateModalProps> = ({
  isOpen,
  onClose,
  shippingLineId,
  shippingLineName,
  onSuccess,
  onError
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedFile) {
      onError('Vui lòng chọn file template mới');
      return;
    }

    setIsUpdating(true);
    try {
      // Upload file mới
      const uploadResponse = await setupService.uploadShippingLineEIR(shippingLineId, selectedFile);
      
      if (uploadResponse.success) {
        // Cập nhật template_eir với file mới
        const updateResponse = await setupService.updateShippingLineTemplate(shippingLineId, uploadResponse.data.filename);
        
        if (updateResponse.success) {
          onSuccess(`Đã cập nhật template EIR cho ${shippingLineName} thành công!`);
          setSelectedFile(null);
          onClose();
        } else {
          onError(updateResponse.message || 'Cập nhật template thất bại');
        }
      } else {
        onError(uploadResponse.message || 'Upload file thất bại');
      }
    } catch (error: any) {
      onError(error.message || 'Có lỗi xảy ra khi cập nhật template');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
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
        zIndex: 1000
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>
          🔄 Cập nhật Template EIR
        </h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
            Hãng tàu: <span style={{ color: '#7c3aed' }}>{shippingLineName}</span>
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Chọn file template EIR mới để thay thế file mẫu hiện tại
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Chọn file template mới:
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px dashed #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#f9fafb',
              cursor: 'pointer'
            }}
            disabled={isUpdating}
          />
          {selectedFile && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#059669' }}>
              ✅ Đã chọn: {selectedFile.name}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            disabled={isUpdating}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.5 : 1
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleUpdateTemplate}
            disabled={!selectedFile || isUpdating}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: isUpdating ? '#9ca3af' : '#7c3aed',
              color: 'white',
              cursor: (!selectedFile || isUpdating) ? 'not-allowed' : 'pointer',
              opacity: (!selectedFile || isUpdating) ? 0.5 : 1
            }}
          >
            {isUpdating ? '🔄 Đang cập nhật...' : '✅ Cập nhật Template'}
          </button>
        </div>
      </div>
    </div>
  );
};
