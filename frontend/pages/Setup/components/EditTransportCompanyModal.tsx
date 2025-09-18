// Edit Transport Company Modal component
import React, { useState, useEffect } from 'react';

export interface TransportCompanyFormData {
  code: string;
  name: string;
  address: string;
  mst: string;
  phone: string;
  note: string;
}

interface EditTransportCompanyModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TransportCompanyFormData) => void;
  formData: TransportCompanyFormData;
  setFormData: (data: TransportCompanyFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
  originalCode: string;
}

export const EditTransportCompanyModal: React.FC<EditTransportCompanyModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  formData,
  setFormData,
  errorText,
  language,
  translations,
  originalCode
}) => {
  const [localError, setLocalError] = useState('');

  // Clear local error when modal opens
  useEffect(() => {
    if (visible) {
      setLocalError('');
    }
  }, [visible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim()) {
      setLocalError(translations[language].code ? 'Vui lòng nhập mã nhà xe.' : 'Please enter transport company code.');
      return;
    }
    if (!formData.name.trim()) {
      setLocalError(translations[language].name ? 'Vui lòng nhập tên nhà xe.' : 'Please enter transport company name.');
      return;
    }

    // Clear any previous errors
    setLocalError('');
    
    // Submit the form
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof TransportCompanyFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
    // Clear error when user starts typing
    if (localError) {
      setLocalError('');
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" style={{
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
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '12px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '500',
            color: '#111827'
          }}>
            {translations[language].editTransportCompany}
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Message */}
          {(errorText || localError) && (
            <div style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ⚠ {errorText || localError}
            </div>
          )}

          {/* Code Field - Required */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder={`${translations[language].transportCompanyCodePlaceholder} *`}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '400'
              }}
            />
          </div>

          {/* Name Field - Required */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={`${translations[language].transportCompanyNamePlaceholder} *`}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            />
          </div>

          {/* Address Field - Optional */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={`${translations[language].addressPlaceholder} (${translations[language].optional})`}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* MST Field - Optional */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={formData.mst}
              onChange={(e) => handleInputChange('mst', e.target.value)}
              placeholder={`${translations[language].mstPlaceholder} (${translations[language].optional})`}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '400'
              }}
            />
          </div>

          {/* Phone Field - Optional */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={`${translations[language].phonePlaceholder} (${translations[language].optional})`}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Note Field - Optional */}
          <div style={{ marginBottom: '24px' }}>
            <textarea
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder={`${translations[language].notePlaceholder} (${translations[language].optional})`}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '400',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '16px'
          }}>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#059669',
                color: 'white',
                fontSize: '14px',
                fontWeight: '400',
                cursor: 'pointer'
              }}
            >
              {translations[language].update}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
