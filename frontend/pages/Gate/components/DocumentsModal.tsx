import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import DocumentViewer from './DocumentViewer';
import { useTranslation } from '../../../hooks/useTranslation';

interface Document {
  id: string;
  type: string;
  name: string;
  size: number;
  version: number;
  created_at: string;
  storage_key: string;
}

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  containerNo: string;
}

export default function DocumentsModal({ isOpen, onClose, requestId, containerNo }: DocumentsModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { t, currentLanguage } = useTranslation();

  useEffect(() => {
    if (isOpen && requestId) {
      fetchDocuments();
    }
  }, [isOpen, requestId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching documents for requestId:', requestId);
      
      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('pages.gate.messages.noAuthToken'));
        return;
      }
      
      const response = await api.get(`/gate/requests/${requestId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📄 Documents response:', response.data);
      console.log('📋 Request info:', {
        request_id: response.data.data.request_id,
        request_no: response.data.data.request_no,
        container_no: response.data.data.container_no
      });
      setDocuments(response.data.data.documents);
    } catch (error: any) {
      console.error('❌ Lỗi khi tải danh sách chứng từ:', error);
      setError(error.response?.data?.message || t('pages.gate.messages.fetchDocumentsError'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'image':
        return '🖼️';
      case 'pdf':
        return '📄';
      case 'eir':
        return '📋';
      case 'lolo':
        return '📄';
      case 'invoice':
        return '🧾';
      case 'supplement':
        return '📎';
      default:
        return '📄';
    }
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'document';
    if (['xls', 'xlsx'].includes(ext)) return 'spreadsheet';
    return 'file';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content documents-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>📄 Chứng từ - Container {containerNo}</h3>
            <div className="request-info">
              <span className="request-id">Request ID: {requestId}</span>
            </div>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>{t('common.loading')}</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>❌ {error}</p>
                <button onClick={fetchDocuments} className="retry-btn">
                  {t('common.retry')}
                </button>
              </div>
            ) : documents.length === 0 ? (
              <div className="no-documents">
                <div className="no-documents-icon">📭</div>
                <p>Không có chứng từ nào cho request này</p>
              </div>
            ) : (
              <div className="documents-list">
                <div className="documents-header">
                  <h4>📋 Danh sách chứng từ ({documents.length} tài liệu)</h4>
                </div>
                {documents.map((doc) => (
                  <div key={doc.id} className="document-item">
                    <div className="document-info">
                      <div className="document-icon">
                        {doc.type === 'image' ? (
                          <img 
                            src={doc.storage_key.startsWith('/backend/') ? doc.storage_key : `/backend${doc.storage_key}`}
                            alt={doc.name}
                            className="document-thumbnail"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div 
                          className="document-icon-fallback" 
                          style={{ display: doc.type === 'image' ? 'none' : 'block' }}
                        >
                          {getDocumentTypeIcon(doc.type)}
                        </div>
                      </div>
                      <div className="document-details">
                        <div className="document-name">{doc.name}</div>
                        <div className="document-meta">
                          <span className="document-type">{doc.type}</span>
                          <span className="document-size">{formatFileSize(doc.size)}</span>
                          <span className="document-version">v{doc.version}</span>
                          <span className="document-date">
                            {new Date(doc.created_at).toLocaleDateString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button
                        className="view-btn"
                        onClick={() => handleViewDocument(doc)}
                        title="Xem chi tiết"
                      >
                        👁️ Xem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={closeViewer}
          requestId={requestId}
          documentId={selectedDocument.storage_key}
          fileName={selectedDocument.name}
          fileType={getFileType(selectedDocument.name)}
        />
      )}
    </>
  );
}
