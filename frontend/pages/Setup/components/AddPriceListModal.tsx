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

  const ValidationTooltip = ({ field }: { field: string }) => {
    if (fieldError !== field) return null;
    
    return (
      <div className="validation-tooltip">
        <div className="validation-tooltip-content">
          <div className="validation-text">{getErrorMessage(field)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: '500px', maxWidth: '90vw'}}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].addNewPriceList}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
          >
            ×
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
            <div className="form-input-wrapper">
              <input
                type="text"
                className={`form-input ${fieldError === 'serviceCode' ? 'error' : ''}`}
                value={formData.serviceCode}
                onChange={(e) => handleInputChange('serviceCode', e.target.value)}
                placeholder={translations[language].enterServiceCode}
                required
              />
              <ValidationTooltip field="serviceCode" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {translations[language].serviceName} <span className="text-red-500">*</span>
            </label>
            <div className="form-input-wrapper">
              <input
                type="text"
                className={`form-input ${fieldError === 'serviceName' ? 'error' : ''}`}
                value={formData.serviceName}
                onChange={(e) => handleInputChange('serviceName', e.target.value)}
                placeholder={translations[language].enterServiceName}
                required
              />
              <ValidationTooltip field="serviceName" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {translations[language].type} <span className="text-red-500">*</span>
            </label>
            <div className="form-input-wrapper">
              <select
                className={`form-input ${fieldError === 'type' ? 'error' : ''}`}
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
              <ValidationTooltip field="type" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {translations[language].price} <span className="text-red-500">*</span>
            </label>
            <div className="form-input-wrapper">
              <input
                type="text"
                className={`form-input ${fieldError === 'price' ? 'error' : ''}`}
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder={translations[language].enterPrice}
                required
              />
              <ValidationTooltip field="price" />
            </div>
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

        <div className="modal-footer">
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            {translations[language].save}
          </button>
        </div>
      </div>
    </div>
  );
};

// CSS for validation tooltip
const validationTooltipStyles = `
  .form-input-wrapper {
    position: relative;
  }
  
  .validation-tooltip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    margin-top: 4px;
  }
  
  .validation-tooltip-content {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 8px 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
    min-width: 200px;
  }
  
  .validation-tooltip-content::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid #f8f9fa;
  }
  
  .validation-tooltip-content::after {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid #dee2e6;
  }
  
  .validation-text {
    color: #333;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
  }
  
  .form-input.error {
    border-color: #ff6b35;
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = validationTooltipStyles;
  document.head.appendChild(styleElement);
}

