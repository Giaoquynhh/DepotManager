// Upload Transport Company Excel Modal component
import React, { useState } from 'react';

interface UploadTransportCompanyExcelModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: (files: File[]) => void;
  language: 'vi' | 'en';
  translations: any;
}

export const UploadTransportCompanyExcelModal: React.FC<UploadTransportCompanyExcelModalProps> = ({
  visible,
  onCancel,
  onUpload,
  language,
  translations
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || f.type === 'application/vnd.ms-excel' || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
      if (files.length === 0) {
        alert(translations[language].code ? 'Vui lòng chọn file Excel (.xlsx hoặc .xls)' : 'Please select an Excel file (.xlsx or .xls)');
      } else {
        setSelectedFiles(prev => [...prev, ...files]);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(f => f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || f.type === 'application/vnd.ms-excel' || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
      if (files.length === 0) {
        alert(translations[language].code ? 'Vui lòng chọn file Excel (.xlsx hoặc .xls)' : 'Please select an Excel file (.xlsx or .xls)');
      } else {
        setSelectedFiles(prev => [...prev, ...files]);
      }
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const handleDownloadTemplate = () => {
    // Create sample data for template
    const sampleData = [
      ['Mã nhà xe', 'Tên nhà xe', 'Địa chỉ', 'MST', 'SĐT', 'Ghi chú'],
      ['HH01', 'Công ty Vận tải Hoàng Huy', '125 Phố Huế, Hai Bà Trưng, Hà Nội', '0101234567', '024-3936-1234', 'Chuyên tuyến Hà Nội – các tỉnh miền Bắc'],
      ['TC02', 'Công ty Vận tải Thành Công', '456 Điện Biên Phủ, Q. Bình Thạnh, TPHCM', '0301234568', '028-3844-5678', 'Vận tải container, đầu kéo rơ moóc'],
      ['ML03', 'Tập đoàn Mai Linh', '89 Điện Biên Phủ, Q.Hồng Bàng, Hải Phòng', '1501234570', '0296-3841-345', 'Đa dạng loại xe, mạng lưới toàn quốc']
    ];

    // Convert to CSV format
    const csvContent = sampleData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Mau_nha_xe.xlsx');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '12px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827'
          }}>
            {translations[language].uploadExcel}
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151'
          }}>
            {translations[language].uploadInstructions}
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            color: '#6b7280',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            <li>{translations[language].uploadInstruction1}</li>
            <li>{translations[language].uploadInstruction2}</li>
            <li>{translations[language].uploadInstruction3}</li>
            <li>{translations[language].uploadInstruction4}</li>
          </ul>
        </div>

        {/* Template Download */}
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0369a1'
              }}>
                {translations[language].downloadTemplate}
              </h4>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#0369a1'
              }}>
                {translations[language].templateDescription}
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {translations[language].download}
            </button>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#f0f9ff' : '#fafafa',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
            multiple
            style={{ display: 'none' }}
          />
          
          <div style={{
            fontSize: '48px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            📁
          </div>
          
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151'
          }}>
            {dragActive 
              ? (translations[language].dropFile || 'Drop file here')
              : (translations[language].selectFile || 'Select Excel file')
            }
          </h3>
          
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            {translations[language].supportedFormats}
          </p>
          
          <button
            type="button"
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {translations[language].browseFiles}
          </button>
        </div>

        {/* Selected File */}
        {selectedFiles.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #bbf7d0'
          }}>
            {selectedFiles.map((f, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#166534' }}>{f.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>{(f.size/1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#166534', padding: 4 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '16px'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {translations[language].cancel}
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: selectedFiles.length ? '#059669' : '#9ca3af',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: selectedFiles.length ? 'pointer' : 'not-allowed'
            }}
          >
            {translations[language].upload}
          </button>
        </div>
      </div>
    </div>
  );
};
