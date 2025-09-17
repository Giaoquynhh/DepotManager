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
          <button className="modal-close" onClick={onCancel}>
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
                {translations[language].code} <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease'
                }}
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder={translations[language].codePlaceholder}
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
                {translations[language].name} <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease'
                }}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={translations[language].namePlaceholder}
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
                {translations[language].eir} <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease'
                }}
                value={formData.eir}
                onChange={(e) => handleInputChange('eir', e.target.value)}
                placeholder={translations[language].eirPlaceholder}
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
                {translations[language].note} <span style={{color: '#6b7280', fontSize: '12px'}}>({translations[language].optional})</span>
              </label>
              <textarea
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder={translations[language].notePlaceholder}
                rows={3}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              {translations[language].cancel}
            </button>
            <button type="submit" className="btn">
              {translations[language].addNew}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
