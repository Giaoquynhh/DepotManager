// Add Price List Modal component
import React from 'react';
import { formatVietnamesePriceInput, parseFormattedNumber } from '../../../utils/numberFormat';

export interface PriceListFormData {
  serviceCode: string;
  serviceName: string;
  type: string;
  price: string;
  note: string;
}

interface AddPriceListModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: PriceListFormData) => void;
  formData: PriceListFormData;
  setFormData: (data: PriceListFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
  existingPriceLists?: Array<{ serviceCode: string }>;
}

export const AddPriceListModal: React.FC<AddPriceListModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  formData,
  setFormData,
  errorText,
  language,
  translations,
  existingPriceLists = []
}) => {
  const [validationError, setValidationError] = React.useState<string>('');
  const [fieldError, setFieldError] = React.useState<string>('');
  const [duplicateCodeError, setDuplicateCodeError] = React.useState<string>('');
  
  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setFieldError('');
    
    // Validation
    if (!formData.serviceCode.trim()) {
      setFieldError('serviceCode');
      return;
    }
    if (!formData.serviceName.trim()) {
      setFieldError('serviceName');
      return;
    }
    if (!formData.type) {
      setFieldError('type');
      return;
    }
    const cleanPrice = parseFormattedNumber(formData.price);
    if (!cleanPrice || parseFloat(cleanPrice) <= 0) {
      setFieldError('price');
      return;
    }
    
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
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
    if (fieldError === field) {
      setFieldError('');
    }
    
    // Check for duplicate service code
    if (field === 'serviceCode') {
      setDuplicateCodeError('');
      if (value.trim()) {
        const isDuplicate = existingPriceLists.some(
          pl => pl.serviceCode.toLowerCase() === value.toLowerCase()
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

  const getErrorMessage = (field: string) => {
    switch (field) {
      case 'serviceCode':
        return 'Vui lòng điền vào trường này.';
      case 'serviceName':
        return 'Vui lòng điền vào trường này.';
      case 'type':
        return 'Vui lòng chọn loại hình.';
      case 'price':
        return 'Giá phải lớn hơn 0.';
      default:
        return 'Vui lòng điền vào trường này.';
    }
  };


  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].addNewPriceList}</h3>
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
            {duplicateCodeError && (
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
                {duplicateCodeError}
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
                Mã dịch vụ 
                <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.serviceCode}
                onChange={(e) => handleInputChange('serviceCode', e.target.value)}
                placeholder="Nhập mã dịch vụ"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: fieldError === 'serviceCode' ? '2px solid #dc2626' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldError === 'serviceCode' ? '#dc2626' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {fieldError === 'serviceCode' && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                  {getErrorMessage('serviceCode')}
                </div>
              )}
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
                Tên dịch vụ 
                <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.serviceName}
                onChange={(e) => handleInputChange('serviceName', e.target.value)}
                placeholder="Nhập tên dịch vụ"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: fieldError === 'serviceName' ? '2px solid #dc2626' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldError === 'serviceName' ? '#dc2626' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {fieldError === 'serviceName' && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                  {getErrorMessage('serviceName')}
                </div>
              )}
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
                Loại hình 
                <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: fieldError === 'type' ? '2px solid #dc2626' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldError === 'type' ? '#dc2626' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Chọn loại hình</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldError === 'type' && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                  {getErrorMessage('type')}
                </div>
              )}
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
                Giá 
                <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="Nhập giá"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: fieldError === 'price' ? '2px solid #dc2626' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = fieldError === 'price' ? '#dc2626' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {fieldError === 'price' && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                  {getErrorMessage('price')}
                </div>
              )}
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
                Ghi chú 
                <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '400' }}>
                  (tùy chọn)
                </span>
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder="Nhập ghi chú"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!formData.serviceCode.trim() || !formData.serviceName.trim() || !formData.type.trim() || !formData.price.trim()}
            >
              {translations[language].save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


