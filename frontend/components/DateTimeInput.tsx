import React, { useState, useEffect, useRef } from 'react';

interface DateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy hh:mm",
  style,
  className,
  min,
  max,
  disabled = false
}) => {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [displayDateValue, setDisplayDateValue] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Convert ISO datetime string to separate date and time values
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          // Format date as YYYY-MM-DD for HTML input[type="date"]
          setDateValue(`${year}-${month}-${day}`);
          setTimeValue(`${hours}:${minutes}`);
          // Format display date as DD/MM/YYYY for Vietnamese format
          setDisplayDateValue(`${day}/${month}/${year}`);
        }
      } catch (error) {
        setDateValue('');
        setTimeValue('');
        setDisplayDateValue('');
      }
    } else {
      setDateValue('');
      setTimeValue('');
      setDisplayDateValue('');
    }
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    
    // Update display date format (DD/MM/YYYY)
    if (newDate) {
      const [year, month, day] = newDate.split('-');
      setDisplayDateValue(`${day}/${month}/${year}`);
    } else {
      setDisplayDateValue('');
    }
    
    if (newDate && timeValue) {
      const isoValue = `${newDate}T${timeValue}`;
      onChange(isoValue);
    } else if (newDate) {
      const isoValue = `${newDate}T00:00`;
      onChange(isoValue);
    } else {
      onChange('');
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (dateValue && newTime) {
      const isoValue = `${dateValue}T${newTime}`;
      onChange(isoValue);
    } else if (dateValue) {
      const isoValue = `${dateValue}T00:00`;
      onChange(isoValue);
    } else {
      onChange('');
    }
  };


  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {/* Date input - simple date picker */}
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          ref={dateInputRef}
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          style={{
            ...style,
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#374151',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          className={className}
          disabled={disabled}
          min={min}
          max={max}
        />
        <label style={{
          position: 'absolute',
          top: '-8px',
          left: '12px',
          background: 'white',
          padding: '0 4px',
          fontSize: '12px',
          color: '#64748b',
          fontWeight: '500'
        }}>
          Ngày
        </label>
      </div>
      
      {/* Time input - separate field */}
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          style={{
            ...style,
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#374151',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          className={className}
          disabled={disabled}
          placeholder="Chọn giờ"
        />
        <label style={{
          position: 'absolute',
          top: '-8px',
          left: '12px',
          background: 'white',
          padding: '0 4px',
          fontSize: '12px',
          color: '#64748b',
          fontWeight: '500'
        }}>
          Giờ
        </label>
      </div>
    </div>
  );
};

export default DateTimeInput;
