// Upload Excel Modal component
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface UploadExcelModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: (files: File[]) => void;
  language: 'vi' | 'en';
  translations: any;
  context?: 'shippingLines' | 'priceLists';
}

export const UploadExcelModal: React.FC<UploadExcelModalProps> = ({
  visible,
  onCancel,
  onUpload,
  language,
  translations,
  context = 'shippingLines'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  if (!visible) return null;

  const isExcel = (file: File) => (
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
    file.type === 'application/vnd.ms-excel' ||
    file.name.endsWith('.xlsx') || 
    file.name.endsWith('.xls')
  );

  const handleFileSelect = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const invalid = arr.find(f => !isExcel(f));
    if (invalid) {
      alert(translations[language].code 
        ? 'Vui lòng chọn file Excel (.xlsx hoặc .xls)'
        : 'Please select an Excel file (.xlsx or .xls)'
      );
      return;
    }
    setSelectedFiles(prev => [...prev, ...arr]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileSelect(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  const downloadTemplate = () => {
    // Create sample Excel data based on context
    const sampleData = context === 'priceLists'
      ? [
          ['STT', 'Mã dịch vụ', 'Tên dịch vụ', 'Loại hình', 'Giá', 'Ghi chú'],
          ['1', 'DV001', 'Nâng container 20GP lên xe', 'Nâng', '350000', 'Thời gian thực hiện: 15-20 phút'],
          ['2', 'DV002', 'Hạ container 40GP xuống bãi', 'Hạ', '450000', 'Bao gồm vận chuyển đến vị trí'],
          ['3', 'DV003', 'Tôn sửa cửa container', 'Tồn kho', '800000', 'Sửa chữa cửa hỏng, thay thế bản lề']
        ]
      : [
          ['STT', 'Mã hãng tàu', 'Tên hãng tàu', 'EIR', 'Ghi chú'],
          ['1', 'COSCO', 'COSCO SHIPPING Lines', 'EIR_COSCO_2024.xlsx', 'Hãng tàu lớn nhất Trung Quốc'],
          ['2', 'MSC', 'Mediterranean Shipping Company', 'EIR_MSC_2024.xlsx', 'Hãng tàu lớn thứ 2 thế giới'],
          ['3', 'MAEU', 'Maersk Line', 'EIR_MAEU_2024.xlsx', 'Tập đoàn logistics hàng đầu']
        ];

    // Convert to CSV format
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', context === 'priceLists' ? 'mau_bang_gia.csv' : 'mau_hang_tau.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{width: '600px', maxWidth: '90vw'}}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].uploadExcel}</h3>
          <button className="modal-close" onClick={handleCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
          {/* Template Download Section */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151'
            }}>
              {translations[language].code ? 'Mẫu file Excel' : 'Excel Template'}
            </h4>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              {translations[language].code 
                ? 'Tải xuống mẫu file Excel để xem định dạng dữ liệu cần thiết.'
                : 'Download the Excel template to see the required data format.'
              }
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {translations[language].code ? 'Tải mẫu Excel' : 'Download Template'}
            </button>
          </div>

          {/* File Upload Section */}
          <div style={{
            marginBottom: '20px'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {translations[language].code ? 'Chọn file Excel' : 'Select Excel File'} <span style={{color: '#dc2626'}}>*</span>
            </label>
            
            <div
              style={{
                border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
                borderRadius: '8px',
                padding: '32px 16px',
                textAlign: 'center',
                background: dragActive ? '#eff6ff' : '#f9fafb',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" style={{margin: '0 auto 16px'}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '500',
                color: '#374151'
              }}>
                {dragActive 
                  ? (translations[language].code ? 'Thả file vào đây' : 'Drop file here')
                  : (translations[language].code ? 'Kéo thả file Excel vào đây' : 'Drag and drop Excel file here')
                }
              </p>
              
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {translations[language].code ? 'hoặc' : 'or'}
              </p>
              
              <button
                type="button"
                style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {translations[language].code ? 'Chọn file' : 'Choose File'}
              </button>
            </div>
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div style={{
              padding: '12px 16px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {selectedFiles.map((f, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                  </svg>
                  <div style={{flex: 1}}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 500, color: '#0c4a6e' }}>{f.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#0369a1' }}>{(f.size/1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div style={{
            padding: '12px 16px',
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            <p style={{margin: '0 0 8px 0', fontWeight: '500'}}>
              {translations[language].code ? 'Lưu ý:' : 'Note:'}
            </p>
            <ul style={{margin: '0', paddingLeft: '20px'}}>
              {context === 'priceLists' ? (
                <>
                  <li>{translations[language].code ? 'File phải có định dạng .xlsx hoặc .xls' : 'File must be in .xlsx or .xls format'}</li>
                  <li>{translations[language].code ? 'Cột 1: "Mã dịch vụ" (bắt buộc, duy nhất)' : 'Column 1: "Service Code" (required, unique)'}</li>
                  <li>{translations[language].code ? 'Cột 2: "Tên dịch vụ" (bắt buộc)' : 'Column 2: "Service Name" (required)'}</li>
                  <li>{translations[language].code ? 'Cột 3: "Loại hình" (bắt buộc, ví dụ: Nâng/Hạ/Tồn kho)' : 'Column 3: "Type" (required, e.g., Nâng/Hạ/Tồn kho)'}</li>
                  <li>{translations[language].code ? 'Cột 4: "Giá" (bắt buộc, số; có thể chứa dấu chấm/phẩy hoặc chữ VND)' : 'Column 4: "Price" (required, number; dots/commas or VND allowed)'}</li>
                  <li>{translations[language].code ? 'Cột 5: "Ghi chú" (tùy chọn)' : 'Column 5: "Note" (optional)'}</li>
                </>
              ) : (
                <>
                  <li>{translations[language].code ? 'File phải có định dạng .xlsx hoặc .xls' : 'File must be in .xlsx or .xls format'}</li>
                  <li>{translations[language].code ? 'Cột đầu tiên phải là "Mã hãng tàu" (bắt buộc)' : 'First column must be "Shipping Line Code" (required)'}</li>
                  <li>{translations[language].code ? 'Cột thứ hai phải là "Tên hãng tàu" (bắt buộc)' : 'Second column must be "Shipping Line Name" (required)'}</li>
                  <li>{translations[language].code ? 'Cột thứ ba phải là "EIR" (bắt buộc)' : 'Third column must be "EIR" (required)'}</li>
                  <li>{translations[language].code ? 'Cột thứ tư là "Ghi chú" (tùy chọn)' : 'Fourth column is "Note" (optional)'}</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={handleCancel}>
            {translations[language].cancel}
          </button>
          <button 
            type="button" 
            className="btn" 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            style={{
              background: selectedFiles.length ? '#059669' : '#9ca3af',
              cursor: selectedFiles.length ? 'pointer' : 'not-allowed'
            }}
          >
            {translations[language].code ? 'Tải lên' : 'Upload'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
