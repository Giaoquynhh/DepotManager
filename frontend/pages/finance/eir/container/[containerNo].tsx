import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '@services/api';

export default function EIRViewer() {
  const router = useRouter();
  const { containerNo } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eirData, setEirData] = useState<any>(null);

  useEffect(() => {
    if (containerNo) {
      fetchEIRData();
    }
  }, [containerNo]);

  const fetchEIRData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching EIR for container:', containerNo);
      
      // Gọi API để lấy thông tin EIR với authentication
      const response = await api.get(`/finance/eir/container/${containerNo}`, {
        responseType: 'blob' // Để nhận file binary
      });
      
      console.log('🔍 API Response:', response);
      console.log('🔍 Response headers:', response.headers);
      
      // Lấy thông tin file từ response
      const contentType = response.headers['content-type'];
      const contentLength = response.headers['content-length'];
      const contentDisposition = response.headers['content-disposition'];
      
      console.log('🔍 Content-Type:', contentType);
      console.log('🔍 Content-Length:', contentLength);
      console.log('🔍 Content-Disposition:', contentDisposition);
      
      // Lấy filename từ content-disposition header
      let filename = 'EIR';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Tạo URL cho file để hiển thị
      const blob = new Blob([response.data], { type: contentType });
      const fileUrl = URL.createObjectURL(blob);

      setEirData({
        contentType,
        contentLength,
        filename,
        url: fileUrl,
        blob: blob
      });

      console.log('🔍 EIR data set successfully');

    } catch (err: any) {
      console.error('🔍 Error fetching EIR:', err);
      setError('Lỗi khi tải EIR: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (eirData?.blob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(eirData.blob);
      link.download = eirData.filename;
      link.target = '_blank';
      link.click();
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>Đang mở EIR cho container: {containerNo}</div>
        <div>Vui lòng đợi...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ color: 'red' }}>❌ {error}</div>
        <button 
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>
          📄 EIR Container {containerNo}
        </h1>
        <button 
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Quay lại
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#666', margin: '10px 0' }}>
          Tên file: {eirData?.filename}
          {eirData?.contentLength && (
            <span style={{ marginLeft: '20px' }}>
              Kích thước: {(parseInt(eirData.contentLength) / 1024).toFixed(1)} KB
            </span>
          )}
        </p>
        <button 
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          📥 Tải xuống
        </button>
      </div>
      
      <div style={{ 
        flex: 1, 
        border: '1px solid #dee2e6', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#f9f9f9',
        overflow: 'auto'
      }}>
        {eirData ? (
          (() => {
            const isImage = eirData.contentType?.startsWith('image/');
            const isPdf = eirData.contentType === 'application/pdf';
            
            if (isImage) {
              return (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={eirData.url} 
                    alt={`EIR for container ${containerNo}`}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '600px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    onError={() => setError('Không thể hiển thị hình ảnh')}
                  />
                </div>
              );
            } else if (isPdf) {
              return (
                <div style={{ textAlign: 'center' }}>
                  <iframe
                    src={eirData.url}
                    title={`EIR for container ${containerNo}`}
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              );
            } else {
              return (
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <p>Không thể hiển thị file này trực tiếp</p>
                  <p>Vui lòng tải xuống để xem</p>
                </div>
              );
            }
          })()
        ) : (
          <div style={{ textAlign: 'center', color: '#666' }}>
            <p>Đang tải EIR...</p>
          </div>
        )}
      </div>
    </div>
  );
}
