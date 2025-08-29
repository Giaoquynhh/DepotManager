import { useState } from 'react';
import { api } from '@services/api';

interface RequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RequestForm({ onSuccess, onCancel }: RequestFormProps) {
  const [form, setForm] = useState({ 
    type: 'IMPORT', 
    container_no: '', 
    etaDate: '', 
    etaTime: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation dựa trên loại yêu cầu
    if (form.type === 'IMPORT') {
      if (!form.container_no.trim()) {
        setMessage('Mã định danh container là bắt buộc cho yêu cầu nhập');
        setLoading(false);
        return;
      }
      if (!selectedFile) {
        setMessage('Chứng từ là bắt buộc cho yêu cầu nhập');
        setLoading(false);
        return;
      }
    }
    
    if (!form.etaDate || !form.etaTime) {
      setMessage('Thời gian dự kiến (ETA) là bắt buộc');
      setLoading(false);
      return;
    }

    try {
      // Tạo FormData để upload file
      const formData = new FormData();
      formData.append('type', form.type);
      
      // Chỉ gửi container_no và document cho loại IMPORT
      if (form.type === 'IMPORT') {
        formData.append('container_no', form.container_no);
        if (selectedFile) {
          formData.append('document', selectedFile);
        }
      }
      
      // ETA luôn được gửi cho cả 2 loại
      if (form.etaDate && form.etaTime) {
        const etaDateTime = `${form.etaDate}T${form.etaTime}`;
        formData.append('eta', etaDateTime);
      }

      await api.post('/requests', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage('Đã tạo yêu cầu thành công!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra định dạng file - kiểm tra cả MIME type và extension
      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const hasValidMimeType = allowedMimeTypes.includes(file.type);
      const hasValidExtension = fileExtension && allowedExtensions.includes(`.${fileExtension}`);
      
      if (!hasValidMimeType && !hasValidExtension) {
        setMessage('Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)');
        return;
      }
      
      // Kiểm tra kích thước file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage('File quá lớn. Kích thước tối đa là 10MB');
        return;
      }
      
      setSelectedFile(file);
      setMessage('');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="request-form">
      <div className="form-group">
        <label htmlFor="type">Loại yêu cầu</label>
        <select 
          id="type"
          value={form.type} 
          onChange={e => setForm({...form, type: e.target.value})}
          required
        >
          <option value="IMPORT">Nhập</option>
          <option value="EXPORT">Xuất</option>
        </select>
      </div>

      {/* Luồng Nhập - hiển thị khi type = IMPORT */}
      {form.type === 'IMPORT' && (
        <>
          <div className="form-group">
            <label htmlFor="container_no">Mã định danh container <span className="required">*</span></label>
            <input 
              id="container_no"
              type="text"
              placeholder="Nhập mã container..." 
              value={form.container_no} 
              onChange={e => setForm({...form, container_no: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label htmlFor="document">Chứng từ (PDF/Ảnh) <span className="required">*</span></label>
            <div className="file-upload-container">
              <input
                id="document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="document" className="file-upload-label">
                <span className="file-upload-icon">📎</span>
                <span className="file-upload-text">
                  {selectedFile ? selectedFile.name : 'Chọn file chứng từ...'}
                </span>
              </label>
            </div>
            {selectedFile && (
              <div className="file-preview">
                <span className="file-name">{selectedFile.name}</span>
                <button 
                  type="button" 
                  onClick={removeFile}
                  className="file-remove"
                >
                  ✕
                </button>
              </div>
            )}
            <small className="file-hint">
              Định dạng: PDF, JPG, PNG. Kích thước tối đa: 10MB
            </small>
          </div>
        </>
      )}

      {/* ETA - hiển thị cho cả 2 loại */}
      <div className="form-group">
        <label htmlFor="eta">Thời gian dự kiến (ETA) <span className="required">*</span></label>
        <div className="eta-inputs">
          <div className="eta-date">
            <input 
              id="etaDate"
              type="date" 
              value={form.etaDate} 
              onChange={e => setForm({...form, etaDate: e.target.value})}
              required
            />
          </div>
          <div className="eta-time">
            <input 
              id="etaTime"
              type="time" 
              value={form.etaTime} 
              onChange={e => setForm({...form, etaTime: e.target.value})}
              required
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`form-message ${message.includes('thành công') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-actions">
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo yêu cầu'}
        </button>
      </div>
    </form>
  );
}
