import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../../components/Header';

import { api } from '@services/api';

export default function ViewEIRByContainer() {
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
      
      // Debug logging
      console.log('🔍 Debug fetchEIRData:');
      console.log('  - containerNo:', containerNo);
      console.log('  - api object:', api);
      console.log('  - api type:', typeof api);
      console.log('  - api.get method:', api?.get);
      
      if (!api) {
        throw new Error('API object is undefined');
      }
      
      if (!api.get) {
        throw new Error('API.get method is undefined');
      }
      
      // Gọi API để lấy thông tin EIR với authentication
      const response = await api.get(`/finance/eir/container/${containerNo}`, {
        responseType: 'blob' // Để nhận file binary
      });
      
      // Lấy thông tin file từ response
      const contentType = response.headers['content-type'];
      const contentLength = response.headers['content-length'];
      const contentDisposition = response.headers['content-disposition'];
      
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

    } catch (err: any) {
      console.error('Error fetching EIR:', err);
      setError('Lỗi khi tải EIR: ' + err.message);
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
      <>
        <Header />
        <main className="container">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div>Đang tải EIR...</div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="container">
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#d32f2f' }}>
            <h3>Lỗi</h3>
            <p>{error}</p>
            <button 
              onClick={() => router.back()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Quay lại
            </button>
          </div>
        </main>
      </>
    );
  }

  const isImage = eirData?.contentType?.startsWith('image/');
  const isPdf = eirData?.contentType === 'application/pdf';

  return (
    <>
      <Header />
      <main className="container">
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2>EIR - Container {containerNo}</h2>
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
            <button 
              onClick={() => router.back()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Quay lại
            </button>
          </div>

          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#f9f9f9'
          }}>
            {isImage ? (
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
            ) : isPdf ? (
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
            ) : (
              <div style={{ textAlign: 'center', color: '#666' }}>
                <p>Không thể hiển thị file này trực tiếp</p>
                <p>Vui lòng tải xuống để xem</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
      `}</style>
    </>
  );
}
