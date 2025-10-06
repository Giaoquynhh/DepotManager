import React, { useState } from 'react';
import { DateTimeInput } from '../components/DateTimeInput';

const DateTimeInputExample: React.FC = () => {
  const [appointmentTime, setAppointmentTime] = useState('');

  const handleChange = (value: string) => {
    setAppointmentTime(value);
    console.log('Selected datetime:', value);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>DateTimeInput Component Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Thời gian hẹn (với icon lịch):
        </label>
        <DateTimeInput
          value={appointmentTime}
          onChange={handleChange}
          placeholder="Chọn ngày và giờ"
        />
        <div style={{ 
          marginTop: '8px', 
          fontSize: '12px', 
          color: '#64748b',
          fontStyle: 'italic'
        }}>
          💡 Click vào icon lịch để chọn ngày
        </div>
      </div>

      <div style={{ 
        background: '#f8fafc', 
        padding: '12px', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <strong>Giá trị hiện tại (ISO):</strong> {appointmentTime || 'Chưa chọn'}<br/>
        <strong>Định dạng hiển thị:</strong> {appointmentTime ? new Date(appointmentTime).toLocaleDateString('vi-VN') + ' ' + new Date(appointmentTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}) : 'Chưa chọn'}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => setAppointmentTime('')}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Xóa lựa chọn
        </button>
      </div>
    </div>
  );
};

export default DateTimeInputExample;
