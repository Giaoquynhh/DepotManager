// Upload Price List Excel Modal component
import React, { useRef } from 'react';

interface UploadPriceListExcelModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (file: File) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}

export const UploadPriceListExcelModal: React.FC<UploadPriceListExcelModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  errorText,
  language,
  translations
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSubmit(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onSubmit(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: '500px', maxWidth: '90vw'}}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].uploadPriceListExcel}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {errorText && (
            <div className="error-message mb-4">
              {errorText}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {translations[language].excelFormatInstructions}
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p><strong>{translations[language].requiredColumns}:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{translations[language].serviceCode} - {translations[language].required}</li>
                <li>{translations[language].serviceName} - {translations[language].required}</li>
                <li>{translations[language].type} - {translations[language].required} (Nâng/Hạ/Tồn kho)</li>
                <li>{translations[language].price} - {translations[language].required}</li>
                <li>{translations[language].note} - {translations[language].optional}</li>
              </ul>
            </div>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-lg font-medium">
                {translations[language].clickToUploadOrDragAndDrop}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {translations[language].excelFilesOnly}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {translations[language].cancel}
          </button>
        </div>
      </div>
    </div>
  );
};

