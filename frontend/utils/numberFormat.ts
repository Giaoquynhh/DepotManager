// Utility functions for number formatting

/**
 * Format a number with thousand separators (dots)
 * @param value - The number to format
 * @returns Formatted string with dots as thousand separators
 */
export const formatNumberWithDots = (value: string | number): string => {
  if (!value && value !== 0) return '';
  
  // Convert to string and remove any existing formatting
  const stringValue = value.toString().replace(/\./g, '');
  
  // Parse as number to ensure it's valid
  const numValue = parseFloat(stringValue);
  if (isNaN(numValue)) return '';
  
  // Format with dots as thousand separators
  return numValue.toLocaleString('vi-VN');
};

/**
 * Parse a formatted number string back to a clean number string
 * @param formattedValue - The formatted string (e.g., "1.000.000" or "1.000.000.50")
 * @returns Clean number string (e.g., "1000000" or "1000000.50")
 */
export const parseFormattedNumber = (formattedValue: string): string => {
  if (!formattedValue) return '';
  
  // Check if there's a decimal point
  const decimalIndex = formattedValue.lastIndexOf('.');
  
  if (decimalIndex !== -1) {
    // Split into integer and decimal parts
    const integerPart = formattedValue.substring(0, decimalIndex);
    const decimalPart = formattedValue.substring(decimalIndex + 1);
    
    // Remove dots from integer part (thousand separators)
    const cleanIntegerPart = integerPart.replace(/\./g, '');
    
    // Check if decimal part has more than 2 digits (likely thousand separators)
    if (decimalPart.length > 2) {
      // This is likely thousand separators, not decimal
      return (cleanIntegerPart + decimalPart).replace(/\./g, '');
    } else {
      // This is a proper decimal
      return cleanIntegerPart + '.' + decimalPart;
    }
  } else {
    // No decimal point, just remove all dots
    return formattedValue.replace(/\./g, '');
  }
};

/**
 * Format price input while user is typing
 * @param value - The input value
 * @returns Formatted value for display
 */
export const formatPriceInput = (value: string): string => {
  if (!value) return '';
  
  // Remove all non-numeric characters except decimal point
  let cleanValue = value.replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points - keep only the first one
  const decimalIndex = cleanValue.indexOf('.');
  if (decimalIndex !== -1) {
    const beforeDecimal = cleanValue.substring(0, decimalIndex);
    const afterDecimal = cleanValue.substring(decimalIndex + 1).replace(/\./g, '');
    cleanValue = beforeDecimal + '.' + afterDecimal;
  }
  
  // Split by decimal point
  const parts = cleanValue.split('.');
  
  // Format the integer part with dots as thousand separators
  if (parts[0]) {
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // If there's a decimal part, add it back
    if (parts.length > 1) {
      return `${integerPart}.${parts[1]}`;
    }
    
    return integerPart;
  }
  
  return cleanValue;
};

/**
 * Format price input specifically for Vietnamese currency (no decimals)
 * @param value - The input value
 * @returns Formatted value for display
 */
export const formatVietnamesePriceInput = (value: string): string => {
  if (!value) return '';
  
  // Remove all non-numeric characters
  const cleanValue = value.replace(/[^\d]/g, '');
  
  // Format with dots as thousand separators
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
