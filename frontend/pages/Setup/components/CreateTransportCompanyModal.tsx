// Create Transport Company Modal component
import React from 'react';

export interface TransportCompanyFormData {
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  vehicleCount: number;
}

interface CreateTransportCompanyModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TransportCompanyFormData) => void;
  title: string;
  formData: TransportCompanyFormData;
  setFormData: (data: TransportCompanyFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}

export const CreateTransportCompanyModal: React.FC<CreateTransportCompanyModalProps> = ({
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

  const handleInputChange = (field: keyof TransportCompanyFormData, value: string | number) => {
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
              <input
                type="text"
                className="form-input"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder={`${translations[language].codePlaceholder} *`}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={`${translations[language].namePlaceholder} *`}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder={`${translations[language].contactPersonPlaceholder} (tùy chọn)`}
              />
            </div>

            <div className="form-group">
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={`${translations[language].phonePlaceholder} (tùy chọn)`}
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={`${translations[language].emailPlaceholder} (tùy chọn)`}
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                className="form-input"
                value={formData.vehicleCount}
                onChange={(e) => handleInputChange('vehicleCount', parseInt(e.target.value) || 0)}
                placeholder={`${translations[language].vehicleCountPlaceholder} (tùy chọn)`}
                min="0"
              />
            </div>

            <div className="form-group">
              <textarea
                className="form-input"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={`${translations[language].addressPlaceholder} (tùy chọn)`}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn">
              {translations[language].save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
