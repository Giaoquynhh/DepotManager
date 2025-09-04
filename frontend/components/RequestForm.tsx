import { useState } from 'react';
import { api } from '@services/api';
import { useTranslation } from '../hooks/useTranslation';

interface RequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RequestForm({ onSuccess, onCancel }: RequestFormProps) {
  const { t } = useTranslation();
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
        setMessage(t('pages.requests.form.validation.containerIdRequired'));
        setLoading(false);
        return;
      }
      if (!selectedFile) {
        setMessage(t('pages.requests.form.validation.documentRequired'));
        setLoading(false);
        return;
      }
    }
    
    if (!form.etaDate || !form.etaTime) {
      setMessage(t('pages.requests.form.validation.etaRequired'));
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
      
      setMessage(t('pages.requests.form.success'));
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || t('common.error'));
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
        setMessage(t('pages.requests.form.validation.invalidFileType'));
        return;
      }
      
      // Kiểm tra kích thước file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage(t('pages.requests.form.validation.fileTooLarge'));
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
        <label htmlFor="type">{t('pages.requests.form.requestType')}</label>
        <select 
          id="type"
          value={form.type} 
          onChange={e => setForm({...form, type: e.target.value})}
          required
        >
          <option value="IMPORT">{t('pages.requests.filterOptions.import')}</option>
          <option value="EXPORT">{t('pages.requests.filterOptions.export')}</option>
        </select>
      </div>

      {/* Luồng Nhập - hiển thị khi type = IMPORT */}
      {form.type === 'IMPORT' && (
        <>
          <div className="form-group">
            <label htmlFor="container_no">{t('pages.requests.form.containerId')} <span className="required">*</span></label>
            <input 
              id="container_no"
              type="text"
              placeholder={t('pages.requests.form.containerIdPlaceholder')} 
              value={form.container_no} 
              onChange={e => setForm({...form, container_no: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label htmlFor="document">{t('pages.requests.form.documents')} <span className="required">*</span></label>
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
                  {selectedFile ? selectedFile.name : t('pages.requests.form.selectDocumentFile')}
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
              {t('pages.requests.form.fileFormat')}
            </small>
          </div>
        </>
      )}

      {/* ETA - hiển thị cho cả 2 loại */}
      <div className="form-group">
        <label htmlFor="eta">{t('pages.requests.form.eta')} <span className="required">*</span></label>
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
        <div className={`form-message ${message.includes(t('pages.requests.form.success')) ? 'success' : 'error'}`}>
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
          {t('pages.requests.form.cancel')}
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? t('pages.requests.form.creating') : t('pages.requests.form.createRequest')}
        </button>
      </div>
    </form>
  );
}
