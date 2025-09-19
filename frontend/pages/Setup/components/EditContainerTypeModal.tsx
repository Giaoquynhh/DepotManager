import React, { useState } from 'react';
import { ContainerTypeFormData } from './AddContainerTypeModal';

interface EditContainerTypeModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: ContainerTypeFormData) => void;
  formData: ContainerTypeFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContainerTypeFormData>>;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
  originalCode: string;
}

export const EditContainerTypeModal: React.FC<EditContainerTypeModalProps> = ({
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
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="modal" 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.3s ease-out'
        }}
      >
        {/* Header với gradient đẹp */}
        <div 
          className="modal-header" 
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              ✏️
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              {translations[language].editContainerType}
            </h3>
          </div>
          <button 
            onClick={onCancel}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '18px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div 
            className="modal-body" 
            style={{
              padding: '32px',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}
          >
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
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
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
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
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
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          
          <div 
            className="modal-footer" 
            style={{
              padding: '24px 32px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            <button 
              type="button" 
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSubmitting ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {translations[language].cancel}
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.code.trim() || !formData.description.trim()}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                background: isSubmitting || !formData.code.trim() || !formData.description.trim() 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSubmitting || !formData.code.trim() || !formData.description.trim() 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSubmitting || !formData.code.trim() || !formData.description.trim() 
                  ? 'none' 
                  : '0 4px 14px 0 rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting && formData.code.trim() && formData.description.trim()) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(245, 158, 11, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting && formData.code.trim() && formData.description.trim()) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(245, 158, 11, 0.3)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div 
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <span>✏️</span>
                  {translations[language].update}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
