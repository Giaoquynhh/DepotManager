import React from 'react';

interface SuccessMessageProps {
  message: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div style={{
      marginBottom: '16px',
      padding: '12px 16px',
      background: '#dcfce7',
      color: '#166534',
      borderRadius: '8px',
      border: '1px solid #bbf7d0',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      ✓ {message}
    </div>
  );
};
