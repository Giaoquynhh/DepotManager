// Edit Price List Modal component
import React from 'react';
import { formatVietnamesePriceInput, parseFormattedNumber } from '../../../utils/numberFormat';

export interface PriceListFormData {
  serviceCode: string;
  serviceName: string;
  type: string;
  price: string;
  note: string;
}

interface EditPriceListModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: PriceListFormData) => void;
  formData: PriceListFormData;
  setFormData: (data: PriceListFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
  existingPriceLists?: Array<{ serviceCode: string }>;
  currentId?: string;
}

export const EditPriceListModal: React.FC<EditPriceListModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  formData,
  setFormData,
  errorText,
  language,
  translations,
  existingPriceLists = [],
  currentId
}) => {
  const [duplicateCodeError, setDuplicateCodeError] = React.useState<string>('');
  
  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate service code
    if (duplicateCodeError) {
      return;
    }
    
    // Submit with clean price data
    const submitData = {
      ...formData,
      price: parseFormattedNumber(formData.price)
    };
    onSubmit(submitData);
  };

  const handleInputChange = (field: keyof PriceListFormData, value: string) => {
    let processedValue = value;
    
    // Format price field with dots
    if (field === 'price') {
      processedValue = formatVietnamesePriceInput(value);
    }
    
    setFormData({
      ...formData,
      [field]: processedValue
    });
    
    // Check for duplicate service code (exclude current item)
    if (field === 'serviceCode') {
      setDuplicateCodeError('');
      if (value.trim()) {
        const isDuplicate = existingPriceLists.some(
          pl => pl.serviceCode.toLowerCase() === value.toLowerCase() && pl.id !== currentId
        );
        if (isDuplicate) {
          setDuplicateCodeError('Mã dịch vụ này đã tồn tại');
        }
      }
    }
  };

  const typeOptions = [
    { value: 'Nâng', label: 'Nâng' },
    { value: 'Hạ', label: 'Hạ' },
    { value: 'Tồn kho', label: 'Tồn kho' }
  ];

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
      onClick={onCancel}
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
        onClick={(e) => e.stopPropagation()}
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
              {translations[language].editPriceList}
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

        <form onSubmit={handleSubmit} className="modal-body">
          {errorText && (
            <div className="error-message mb-4">
              {errorText}
            </div>
          )}
          {duplicateCodeError && (
            <div className="error-message mb-4" style={{color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 12px'}}>
              {duplicateCodeError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {translations[language].serviceCode} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.serviceCode}
              onChange={(e) => handleInputChange('serviceCode', e.target.value)}
              placeholder={translations[language].enterServiceCode}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {translations[language].serviceName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.serviceName}
              onChange={(e) => handleInputChange('serviceName', e.target.value)}
              placeholder={translations[language].enterServiceName}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {translations[language].type} <span className="text-red-500">*</span>
            </label>
            <select
              className="form-input"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              required
            >
              <option value="">{translations[language].selectType}</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {translations[language].price} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder={translations[language].enterPrice}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {translations[language].note}
            </label>
            <textarea
              className="form-input"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder={translations[language].enterNote}
              rows={3}
            />
          </div>
        </form>

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
            type="submit"
            disabled={!formData.serviceCode.trim() || !formData.serviceName.trim() || !formData.type.trim() || !formData.price.trim()}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: !formData.serviceCode.trim() || !formData.serviceName.trim() || !formData.type.trim() || !formData.price.trim()
                ? '#9ca3af' 
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: !formData.serviceCode.trim() || !formData.serviceName.trim() || !formData.type.trim() || !formData.price.trim()
                ? 'not-allowed' 
                : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: !formData.serviceCode.trim() || !formData.serviceName.trim() || !formData.type.trim() || !formData.price.trim()
                ? 'none' 
                : '0 4px 14px 0 rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (formData.serviceCode.trim() && formData.serviceName.trim() && formData.type.trim() && formData.price.trim()) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(245, 158, 11, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (formData.serviceCode.trim() && formData.serviceName.trim() && formData.type.trim() && formData.price.trim()) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(245, 158, 11, 0.3)';
              }
            }}
            onClick={handleSubmit}
          >
            <span>✏️</span>
            {translations[language].update}
          </button>
        </div>
      </div>
    </div>
  );
};

