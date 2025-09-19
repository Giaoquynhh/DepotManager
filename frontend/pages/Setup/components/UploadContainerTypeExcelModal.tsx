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
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="modal"
        style={{
          width: '92%',
          maxWidth: 640,
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          animation: 'modalSlideIn 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
            color: '#fff',
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>📤</div>
            <h3 style={{ margin: 0, fontWeight: 600 }}>{translations[language].uploadExcel}</h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              width: 36,
              height: 32,
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer'
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: 28 }}>
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
        <div className="modal-footer" style={{ padding: '18px 28px', background: '#f9fafb', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-outline" onClick={onCancel}>{translations[language].cancel}</button>
          <button
            className="btn"
            onClick={handleUpload}
            disabled={selectedFiles.length===0}
            style={{
              background: selectedFiles.length? 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)' : '#9ca3af',
              color: '#fff',
              cursor: selectedFiles.length? 'pointer' : 'not-allowed'
            }}
          >
            {translations[language].upload}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};


