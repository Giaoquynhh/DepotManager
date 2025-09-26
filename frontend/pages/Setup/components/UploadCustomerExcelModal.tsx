// Upload Customer Excel Modal component
import React, { useState } from 'react';

interface UploadCustomerExcelModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: (files: File[]) => void;
  language: 'vi' | 'en';
  translations: any;
}

export const UploadCustomerExcelModal: React.FC<UploadCustomerExcelModalProps> = ({
  visible,
  onCancel,
  onUpload,
  language,
  translations
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  if (!visible) return null;

  const isExcel = (file: File) =>
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.toLowerCase().endsWith('.xlsx') ||
    file.name.toLowerCase().endsWith('.xls');

  const handleUpload = () => {
    if (selectedFiles.length === 0 || selectedFiles.some(f => !isExcel(f))) {
      alert(translations[language].code ? 'Vui lòng chọn file Excel (.xlsx hoặc .xls)' : 'Please select an Excel file (.xlsx or .xls)');
      return;
    }
    onUpload(selectedFiles);
  };

  const downloadTemplate = () => {
    const header = [['Mã khách hàng', 'Tên khách hàng', 'Địa chỉ', 'Mã số thuế', 'Email', 'Số điện thoại', 'Ghi chú']];
    const rows = [
      ['KH001', 'Công ty TNHH ABC', '123 Đường ABC, Quận 1, TP.HCM', '0123456789', 'contact@abc.com', '0901234567', 'Khách hàng VIP'],
      ['KH002', 'Công ty Cổ phần XYZ', '456 Đường XYZ, Quận 2, TP.HCM', '0987654321', 'info@xyz.com', '0907654321', 'Khách hàng thường'],
    ];
    const csv = [...header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxWidth: '95vw' }}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].uploadExcel || 'Upload Excel'}</h3>
          <button className="modal-close" onClick={onCancel} style={{ color: 'white', outline: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Instructions */}
          <div style={{
            border: '1px solid #e5e7eb',
            background: '#fafafa',
            borderRadius: 12,
            padding: 16,
            marginBottom: 18
          }}>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              {translations[language].uploadInstructions || 'Hướng dẫn upload file Excel'}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563', lineHeight: 1.7 }}>
              <li>{translations[language].code ? 'File gồm 7 cột: Mã khách hàng, Tên khách hàng, Địa chỉ, Mã số thuế, Email, Số điện thoại, Ghi chú' : 'File has 7 columns: Customer Code, Name, Address, Tax Code, Email, Phone, Note'}</li>
              <li>{translations[language].code ? 'Mã khách hàng, Tên khách hàng là bắt buộc' : 'Customer Code and Name are required'}</li>
              <li>{translations[language].code ? 'Email phải đúng định dạng' : 'Email must be valid format'}</li>
              <li>{translations[language].code ? 'Hỗ trợ định dạng .xlsx và .xls' : 'Supports .xlsx and .xls formats'}</li>
            </ul>
            <button
              className="btn btn-outline"
              onClick={downloadTemplate}
              style={{ marginTop: 12 }}
            >
              {translations[language].downloadTemplate || 'Tải mẫu file Excel'}
            </button>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = Array.from(e.dataTransfer.files || []).filter(isExcel);
              if (files.length) setSelectedFiles(prev => [...prev, ...files]);
            }}
            style={{
              border: `2px dashed ${isDragging ? '#3b82f6' : '#d1d5db'}`,
              background: isDragging ? 'rgba(59, 130, 246, 0.06)' : '#fff',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center'
            }}
          >
            <div style={{ color: '#6b7280', marginBottom: 10 }}>
              {selectedFiles.length
                ? (translations[language].code ? 'Đã chọn:' : 'Selected:')
                : (translations[language].code ? 'Kéo và thả file Excel vào đây' : 'Drag and drop an Excel file here')}
            </div>
            {selectedFiles.length > 0 && (
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                    <span>📄</span>
                    <span>{f.name}</span>
                    <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <label
              htmlFor="customerExcelInput"
              className="btn"
              style={{ background: '#3b82f6', color: '#fff', cursor: 'pointer', display: 'inline-block' }}
            >
              {translations[language].selectFile || 'Chọn file Excel'}
            </label>
            <input
              id="customerExcelInput"
              type="file"
              accept=".xlsx,.xls"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn" onClick={handleUpload} disabled={selectedFiles.length===0} style={{ opacity: selectedFiles.length? 1 : 0.7, cursor: selectedFiles.length? 'pointer' : 'not-allowed' }}>
            {translations[language].upload || 'Tải lên'}
          </button>
        </div>
      </div>
    </div>
  );
};
