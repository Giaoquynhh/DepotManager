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
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Convert ISO date string to separate date value and display format
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          
          setDateValue(`${year}-${month}-${day}`);
          setDisplayValue(`${day}/${month}/${year}`);
        }
      } catch (error) {
        setDateValue('');
        setDisplayValue('');
      }
    } else {
      setDateValue('');
      setDisplayValue('');
    }
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    
    if (newDate) {
      const isoValue = `${newDate}T00:00:00.000Z`;
      onChange(isoValue);
      
      // Update display value
      const [year, month, day] = newDate.split('-');
      setDisplayValue(`${day}/${month}/${year}`);
    } else {
      onChange('');
      setDisplayValue('');
    }
  };

  const handleDisplayClick = () => {
    if (!disabled) {
      dateInputRef.current?.showPicker();
    }
  };

  const handleDisplayFocus = () => {
    setIsFocused(true);
  };

  const handleDisplayBlur = () => {
    setIsFocused(false);
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
      <input
        type="text"
        value={displayValue}
        onClick={handleDisplayClick}
        onFocus={handleDisplayFocus}
        onBlur={handleDisplayBlur}
        readOnly
        placeholder={placeholder}
        style={{
          ...style,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        className={className}
        disabled={disabled}
      />
    </div>
  );
};

export default DateInput;
