// Add Shipping Line Modal component
import React from 'react';

export interface ShippingLineFormData {
  code: string;
  name: string;
  eir: string;
  note: string;
}

interface AddShippingLineModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: ShippingLineFormData) => void;
  formData: ShippingLineFormData;
  setFormData: (data: ShippingLineFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}

export const AddShippingLineModal: React.FC<AddShippingLineModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  formData,
  setFormData,
  errorText,
  language,
  translations
}) => {
  if (!visible) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ShippingLineFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: '500px', maxWidth: '90vw'}}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].addNewShippingLine}</h3>
          <button className="modal-close" onClick={onCancel} style={{color: 'white', outline: 'none'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
            {errorText && (
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {errorText}
              </div>
            )}

            <div style={{marginBottom: '20px'}}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].codePlaceholder)} <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '400',
                  transition: 'border-color 0.2s ease'
                }}
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder={`${translations[language].codePlaceholder} *`}
                required
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].namePlaceholder)} <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '400',
                  transition: 'border-color 0.2s ease'
                }}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={`${translations[language].namePlaceholder} *`}
                required
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {toLabel(translations[language].eirPlaceholder)} <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '400',
                  transition: 'border-color 0.2s ease'
                }}
                value={formData.eir}
                onChange={(e) => handleInputChange('eir', e.target.value)}
                placeholder={`${translations[language].eirPlaceholder} *`}
                required
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{marginBottom: '20px'}}>
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
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '400',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder={`${translations[language].notePlaceholder} (${translations[language].optional})`}
                rows={3}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
