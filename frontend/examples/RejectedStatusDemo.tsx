import React from 'react';
import '../styles/rejected-status.css';

const RejectedStatusDemo: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🎨 Demo: Trạng thái "Đã từ chối" (REJECTED)</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>📋 Các kích thước khác nhau:</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <span className="status-rejected small">Đã từ chối</span>
          <span className="status-rejected medium">Đã từ chối</span>
          <span className="status-rejected large">Đã từ chối</span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>✨ Hiệu ứng đặc biệt:</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <span className="status-rejected">Đã từ chối (Shimmer)</span>
          <span className="status-rejected pulse">Đã từ chối (Pulse)</span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🎯 Với icon:</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <span className="status-rejected with-icon">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Đã từ chối
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🔄 Trạng thái hover:</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>Hover vào các badge bên dưới để xem hiệu ứng:</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <span className="status-rejected">Hover me!</span>
          <span className="status-rejected medium">Hover me!</span>
          <span className="status-rejected large">Hover me!</span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>📊 So sánh với các trạng thái khác:</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <span className="status-pending">Đang xử lý</span>
          <span className="status-received">Đã nhận</span>
          <span className="status-completed">Hoàn thành</span>
          <span className="status-rejected">Đã từ chối</span>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🎨 Màu sắc và style:</h3>
        <div style={{ 
          background: '#FEE2E2', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #FCA5A5',
          marginBottom: '10px'
        }}>
          <p style={{ margin: '0', color: '#991B1B', fontWeight: '600' }}>
            🎯 Màu nền: #FEE2E2 (Đỏ nhạt)<br/>
            🎯 Màu chữ: #991B1B (Đỏ đậm)<br/>
            🎯 Border: #FCA5A5<br/>
            ✨ Hiệu ứng: Shimmer animation + Hover effects
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>♿ Accessibility:</h3>
        <ul style={{ color: '#666', fontSize: '14px' }}>
          <li>✅ Hỗ trợ high contrast mode</li>
          <li>✅ Hỗ trợ reduced motion</li>
          <li>✅ Focus state rõ ràng</li>
          <li>✅ Dark mode support</li>
          <li>✅ Print-friendly</li>
        </ul>
      </div>

      <div style={{ 
        background: '#F0F9FF', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #BAE6FD'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0369A1' }}>💡 Cách sử dụng:</h4>
        <pre style={{ 
          background: '#FFFFFF', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          margin: '0'
        }}>
{`// Basic usage
<span className="status-rejected">Đã từ chối</span>

// With size
<span className="status-rejected small">Đã từ chối</span>
<span className="status-rejected medium">Đã từ chối</span>
<span className="status-rejected large">Đã từ chối</span>

// With effects
<span className="status-rejected pulse">Đã từ chối</span>

// With icon
<span className="status-rejected with-icon">
  <svg className="icon">...</svg>
  Đã từ chối
</span>`}
        </pre>
      </div>
    </div>
  );
};

export default RejectedStatusDemo;
