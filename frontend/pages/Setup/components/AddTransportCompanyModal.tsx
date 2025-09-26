// Add Transport Company Modal component
import React, { useState, useEffect } from 'react';

export interface TransportCompanyFormData {
  code: string;
  name: string;
  address: string;
  mst: string;
  phone: string;
  note: string;
}

interface AddTransportCompanyModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TransportCompanyFormData) => void;
  formData: TransportCompanyFormData;
  setFormData: (data: TransportCompanyFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}

export const AddTransportCompanyModal: React.FC<AddTransportCompanyModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  formData,
  setFormData,
  errorText,
  language,
  translations
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

  // Normalize placeholder text to label by removing leading verbs like "Nhập" or "Enter"
  const toLabel = (text: string) => {
    if (!text) return '';
    const normalized = text
      .replace(/^\s*Nhập\s+/i, '')
      .replace(/^\s*Enter\s+/i, '')
      .trim();
    return normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : '';
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: '500px', maxWidth: '90vw'}}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].addNewTransportCompany}</h3>
          <button className="modal-close" onClick={onCancel} style={{color: 'white', outline: 'none'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
            {/* Error Message */}
            {(errorText || localError) && (
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {errorText || localError}
              </div>
            )}

            {/* Code Field - Required */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].transportCompanyCodePlaceholder)} <span style={{color: '#dc2626'}}>*</span>
              </label>
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].transportCompanyNamePlaceholder)} <span style={{color: '#dc2626'}}>*</span>
              </label>
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
                  fontWeight: '400'
                }}
              />
            </div>

            {/* Address Field - Optional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].addressPlaceholder)} <span style={{color: '#6b7280', fontWeight: '400'}}>({translations[language].optional})</span>
              </label>
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
                  fontSize: '14px',
                  fontWeight: '400'
                }}
              />
            </div>

            {/* MST Field - Optional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].mstPlaceholder)} <span style={{color: '#6b7280', fontWeight: '400'}}>({translations[language].optional})</span>
              </label>
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].phonePlaceholder)} <span style={{color: '#6b7280', fontWeight: '400'}}>({translations[language].optional})</span>
              </label>
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
                  fontSize: '14px',
                  fontWeight: '400'
                }}
              />
            </div>

            {/* Note Field - Optional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].notePlaceholder)} <span style={{color: '#6b7280', fontWeight: '400'}}>({translations[language].optional})</span>
              </label>
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

          </div>

          <div className="modal-footer">
            <button type="submit" className="btn">
              {translations[language].addNew}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
