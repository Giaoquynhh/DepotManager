import React, { useState } from 'react';

interface UploadContainerTypeExcelModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: (files: File[]) => void;
  language: 'vi' | 'en';
  translations: any;
}

export const UploadContainerTypeExcelModal: React.FC<UploadContainerTypeExcelModalProps> = ({
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
    const header = [['Mã loại', 'Mô tả', 'Ghi chú']];
    const rows = [
      ['20GP', "20' General Purpose", ''],
      ['40GP', "40' General Purpose", ''],
    ];
    const csv = [...header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'container-types-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxWidth: '95vw' }}>
        <div className="modal-header">
          <h3 className="modal-title">{translations[language].uploadExcel}</h3>
          <button className="modal-close" onClick={onCancel} style={{ color: 'white', outline: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
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
              {translations[language].uploadInstructions}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563', lineHeight: 1.7 }}>
              <li>{translations[language].code ? 'File gồm 3 cột: Mã loại, Mô tả, Ghi chú' : 'File has 3 columns: Code, Description, Note'}</li>
              <li>{translations[language].code ? 'Mã loại và Mô tả là bắt buộc' : 'Code and Description are required'}</li>
              <li>{translations[language].uploadInstruction4}</li>
            </ul>
            <button
              className="btn btn-outline"
              onClick={downloadTemplate}
              style={{ marginTop: 12 }}
            >
              {translations[language].downloadTemplate}
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
              border: `2px dashed ${isDragging ? '#7c3aed' : '#d1d5db'}`,
              background: isDragging ? 'rgba(124, 58, 237, 0.06)' : '#fff',
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
              htmlFor="containerTypeExcelInput"
              className="btn"
              style={{ background: '#7c3aed', color: '#fff', cursor: 'pointer', display: 'inline-block' }}
            >
              {translations[language].selectFile || 'Select Excel file'}
            </label>
            <input
              id="containerTypeExcelInput"
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
            {translations[language].upload}
          </button>
        </div>
      </div>
    </div>
  );
};


