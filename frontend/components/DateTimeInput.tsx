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
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
          
          setDateValue(`${year}-${month}-${day}`);
          setTimeValue(`${hours}:${minutes}`);
          setDisplayValue(`${day}/${month}/${year} ${hours}:${minutes}`);
        }
      } catch (error) {
        setDateValue('');
        setTimeValue('');
        setDisplayValue('');
      }
    } else {
      setDateValue('');
      setTimeValue('');
      setDisplayValue('');
    }
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    
    if (newDate && timeValue) {
      const isoValue = `${newDate}T${timeValue}`;
      onChange(isoValue);
      
      // Update display value
      const [year, month, day] = newDate.split('-');
      setDisplayValue(`${day}/${month}/${year} ${timeValue}`);
    } else if (newDate) {
      const isoValue = `${newDate}T00:00`;
      onChange(isoValue);
      
      // Update display value
      const [year, month, day] = newDate.split('-');
      setDisplayValue(`${day}/${month}/${year} 00:00`);
    } else {
      onChange('');
      setDisplayValue('');
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (dateValue && newTime) {
      const isoValue = `${dateValue}T${newTime}`;
      onChange(isoValue);
      
      // Update display value
      const [year, month, day] = dateValue.split('-');
      setDisplayValue(`${day}/${month}/${year} ${newTime}`);
    } else if (dateValue) {
      const isoValue = `${dateValue}T00:00`;
      onChange(isoValue);
      
      // Update display value
      const [year, month, day] = dateValue.split('-');
      setDisplayValue(`${day}/${month}/${year} 00:00`);
    } else {
      onChange('');
      setDisplayValue('');
    }
  };

  const handleDisplayClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={displayValue}
          onClick={handleDisplayClick}
          readOnly
          placeholder={placeholder}
          style={{
            ...style,
            flex: 1,
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          className={className}
          disabled={disabled}
        />
        <input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          style={{
            ...style,
            flex: 1
          }}
          className={className}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default DateTimeInput;
