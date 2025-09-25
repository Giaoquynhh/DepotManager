import React, { useState, useEffect } from 'react';
import { useTranslation } from '@hooks/useTranslation';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_key: string;
  created_at: string;
}

interface ContainerImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  containerNo: string;
  attachments: Attachment[];
  imageType: 'inspection' | 'documents'; // 'inspection' cho ảnh kiểm tra, 'documents' cho ảnh chứng từ
}

export default function ContainerImagesModal({ 
  isOpen, 
  onClose, 
  containerNo, 
  attachments, 
  imageType 
}: ContainerImagesModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { t, currentLanguage } = useTranslation();

  // Lọc attachments theo loại
  const filteredAttachments = attachments.filter(att => {
    if (imageType === 'inspection') {
      return att.file_type?.startsWith('image/');
    } else {
      return !att.file_type?.startsWith('image/');
    }
  });

  const handleViewImage = (attachment: Attachment) => {
    setSelectedImage(attachment);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedImage(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    return '📎';
  };

  const getImagePreview = (attachment: Attachment) => {
    if (attachment.file_type?.startsWith('image/')) {
      return (
        <div 
          style={{
            width: '80px',
            height: '60px',
            backgroundImage: `url(${process.env.NEXT_PUBLIC_API_URL}/uploads/${attachment.storage_key})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}
        />
      );
    }
    return (
      <div style={{
        width: '80px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        fontSize: '24px'
      }}>
        {getFileTypeIcon(attachment.file_name)}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(2px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1100
        }}
        onClick={onClose}
      >
        <div
          style={{ 
            background: '#fff', 
            borderRadius: 12, 
            width: '720px', 
            maxWidth: '95vw', 
            maxHeight: '85vh', 
            overflow: 'auto', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)' 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '16px 20px', 
            borderBottom: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {imageType === 'inspection' ? 'Ảnh kiểm tra' : 'Ảnh chứng từ'} - {containerNo}
            </h3>
            <button 
              onClick={onClose} 
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: 20, 
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: 20 }}>
            {filteredAttachments.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  Không có {imageType === 'inspection' ? 'ảnh kiểm tra' : 'ảnh chứng từ'} nào
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {filteredAttachments.map((attachment) => (
                  <div 
                    key={attachment.id} 
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: '#fff'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleViewImage(attachment)}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      {getImagePreview(attachment)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#374151' }}>
                      <div style={{ 
                        fontWeight: '500', 
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {attachment.file_name}
                      </div>
                      <div style={{ color: '#6b7280' }}>
                        {formatFileSize(attachment.file_size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ 
            padding: '16px 20px', 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button 
              onClick={onClose}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#6b7280';
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            background: 'rgba(0,0,0,0.8)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1200
          }}
          onClick={closeViewer}
        >
          <div
            style={{ 
              background: '#fff', 
              borderRadius: 12, 
              maxWidth: '90vw', 
              maxHeight: '90vh', 
              overflow: 'auto', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '16px 20px', 
              borderBottom: '1px solid #e5e7eb' 
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                {selectedImage.file_name}
              </h3>
              <button 
                onClick={closeViewer} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: 20, 
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              {selectedImage.file_type?.startsWith('image/') ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${selectedImage.storage_key}`}
                  alt={selectedImage.file_name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              ) : (
                <div style={{
                  padding: '40px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    {getFileTypeIcon(selectedImage.file_name)}
                  </div>
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    Không thể xem trước file này
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
                    {selectedImage.file_name} ({formatFileSize(selectedImage.file_size)})
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
