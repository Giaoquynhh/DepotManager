// Edit Price List Modal component
import React from 'react';

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
    
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof PriceListFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: '500px', maxWidth: '90vw'}}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].editPriceList}</h3>
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
              type="number"
              className="form-input"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder={translations[language].enterPrice}
              min="0"
              step="0.01"
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

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {translations[language].cancel}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            {translations[language].update}
          </button>
        </div>
      </div>
    </div>
  );
};

