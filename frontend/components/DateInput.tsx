import React, { useState, useEffect, useRef } from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  style,
  className,
  min,
  max,
  disabled = false
}) => {
  const [dateValue, setDateValue] = useState('');
  const [displayDateValue, setDisplayDateValue] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Convert DD/MM/YYYY string to separate date value
  useEffect(() => {
    if (value) {
      try {
        // If value is in DD/MM/YYYY format, convert to YYYY-MM-DD
        if (value.includes('/')) {
          const [day, month, year] = value.split('/');
          if (day && month && year) {
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) {
              const yearStr = date.getFullYear();
              const monthStr = String(date.getMonth() + 1).padStart(2, '0');
              const dayStr = String(date.getDate()).padStart(2, '0');
              
              // Format date as YYYY-MM-DD for HTML input[type="date"]
              setDateValue(`${yearStr}-${monthStr}-${dayStr}`);
              // Format display date as DD/MM/YYYY for Vietnamese format
              setDisplayDateValue(`${dayStr}/${monthStr}/${yearStr}`);
            }
          }
        } else {
          // If value is already in YYYY-MM-DD format
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            setDateValue(`${year}-${month}-${day}`);
            setDisplayDateValue(`${day}/${month}/${year}`);
          }
        }
      } catch (error) {
        setDateValue('');
        setDisplayDateValue('');
      }
    } else {
      setDateValue('');
      setDisplayDateValue('');
    }
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    
    // Update display date format (DD/MM/YYYY)
    if (newDate) {
      const [year, month, day] = newDate.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      setDisplayDateValue(formattedDate);
      onChange(formattedDate);
    } else {
      setDisplayDateValue('');
      onChange('');
    }
  };

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      {/* Hidden date input for calendar functionality */}
      <input
        ref={dateInputRef}
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0
        }}
        disabled={disabled}
        min={min}
        max={max}
      />
      
      {/* Display input that shows Vietnamese format */}
      <input
        type="text"
        value={displayDateValue}
        onClick={() => !disabled && dateInputRef.current?.showPicker()}
        readOnly
        placeholder="dd/mm/yyyy"
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
          outline: 'none',
          backgroundColor: 'white'
        }}
        className={className}
        disabled={disabled}
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
  );
};

export default DateInput;