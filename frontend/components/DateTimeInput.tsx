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
      {/* Date input - separate field */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={displayDateValue}
            readOnly
            style={{
              ...style,
              width: '100%',
              padding: '12px 40px 12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#374151',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              background: 'white'
            }}
            className={className}
            disabled={disabled}
            placeholder="dd/mm/yyyy"
          />
          {/* Calendar icon */}
          <div 
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: '#64748b',
              transition: 'color 0.2s ease',
              padding: '4px',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
              }
            }}
            onClick={() => {
              if (!disabled && dateInputRef.current) {
                dateInputRef.current.showPicker();
              }
            }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{
                transition: 'color 0.2s ease'
              }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>
        <input
          ref={dateInputRef}
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
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
