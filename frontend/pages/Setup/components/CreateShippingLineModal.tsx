// Create Shipping Line Modal component
import React from 'react';

export interface ShippingLineFormData {
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

interface CreateShippingLineModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: ShippingLineFormData) => void;
  title: string;
  formData: ShippingLineFormData;
  setFormData: (data: ShippingLineFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}

export const CreateShippingLineModal: React.FC<CreateShippingLineModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  title,
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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

            <div className="form-group">
              <label className="form-label">
                {translations[language].code} <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder={translations[language].codePlaceholder}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {translations[language].name} <span style={{color: '#dc2626'}}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={translations[language].namePlaceholder}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{translations[language].contactPerson}</label>
              <input
                type="text"
                className="form-input"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder={translations[language].contactPersonPlaceholder}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{translations[language].phone}</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={translations[language].phonePlaceholder}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{translations[language].email}</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={translations[language].emailPlaceholder}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{translations[language].address}</label>
              <textarea
                className="form-input"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={translations[language].addressPlaceholder}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              {translations[language].cancel}
            </button>
            <button type="submit" className="btn">
              {translations[language].save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
