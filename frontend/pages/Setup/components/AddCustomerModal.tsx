// Add Customer Modal component
import React, { useState, useEffect } from 'react';

export interface CustomerFormData {
  code: string;
  name: string;
  address: string;
  taxCode: string;
  email: string;
  phone: string;
  note: string;
}

interface AddCustomerModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CustomerFormData) => void;
  formData: CustomerFormData;
  setFormData: (data: CustomerFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
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
    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].addNewCustomer || 'Thêm khách hàng mới'}</h3>
          <button className="modal-close" onClick={onCancel} style={{ color: 'white', outline: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {/* Error Message */}
            {errorText && (
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {errorText}
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
                Mã khách hàng <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Nhập mã khách hàng *"
                required
                disabled={isSubmitting}
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
                Tên khách hàng <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nhập tên khách hàng *"
                required
                disabled={isSubmitting}
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
                Địa chỉ <span style={{color: '#6b7280', fontWeight: '400'}}>(tùy chọn)</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Nhập địa chỉ (tùy chọn)"
                disabled={isSubmitting}
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

            {/* Tax Code Field - Optional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                Mã số thuế <span style={{color: '#6b7280', fontWeight: '400'}}>(tùy chọn)</span>
              </label>
              <input
                type="text"
                value={formData.taxCode}
                onChange={(e) => handleInputChange('taxCode', e.target.value)}
                placeholder="Nhập mã số thuế (tùy chọn)"
                disabled={isSubmitting}
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

            {/* Email Field - Optional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                Email <span style={{color: '#6b7280', fontWeight: '400'}}>(tùy chọn)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Nhập email (tùy chọn)"
                disabled={isSubmitting}
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
                Số điện thoại <span style={{color: '#6b7280', fontWeight: '400'}}>(tùy chọn)</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Nhập số điện thoại (tùy chọn)"
                disabled={isSubmitting}
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
                Ghi chú <span style={{color: '#6b7280', fontWeight: '400'}}>(tùy chọn)</span>
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder="Nhập ghi chú (tùy chọn)"
                rows={3}
                disabled={isSubmitting}
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
            <button type="submit" className="btn" disabled={isSubmitting || !formData.code.trim() || !formData.name.trim()} style={{ opacity: isSubmitting || !formData.code.trim() || !formData.name.trim() ? 0.7 : 1, cursor: isSubmitting || !formData.code.trim() || !formData.name.trim() ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
