import React, { useState } from 'react';

export interface ContainerTypeFormData {
  code: string;
  description: string;
  note: string;
}

interface AddContainerTypeModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: ContainerTypeFormData) => void;
  formData: ContainerTypeFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContainerTypeFormData>>;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}

export const AddContainerTypeModal: React.FC<AddContainerTypeModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  formData,
  setFormData,
  errorText,
  language,
  translations
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim()) {
      return;
    }
    if (!formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContainerTypeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].addNewContainerType}</h3>
          <button className="modal-close" onClick={onCancel} style={{ color: 'white', outline: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {errorText && (
              <div 
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '24px',
                  color: '#dc2626',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '16px' }}>⚠️</span>
                {errorText}
              </div>
            )}
            
            <div style={{ marginBottom: '24px' }}>
              <label 
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}
              >
                {translations[language].containerTypeCode} 
                <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder={translations[language].containerTypeCodePlaceholder}
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label 
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}
              >
                {translations[language].description} 
                <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={translations[language].descriptionPlaceholder}
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label 
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}
              >
                {translations[language].note} 
                <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '400' }}>
                  ({translations[language].optional})
                </span>
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder={translations[language].notePlaceholder}
                rows={3}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="submit" className="btn" disabled={isSubmitting || !formData.code.trim() || !formData.description.trim()} style={{ opacity: isSubmitting || !formData.code.trim() || !formData.description.trim() ? 0.7 : 1, cursor: isSubmitting || !formData.code.trim() || !formData.description.trim() ? 'not-allowed' : 'pointer' }}>
              {translations[language].save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
