import React from 'react';

export const Alert = ({ type = 'info', message, className = '' }: { type?: 'info' | 'error' | 'success', message: string, className?: string }) => {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
  };

  return (
    <div className={`p-4 border rounded-md ${styles[type]} ${className}`}>
      {message}
    </div>
  );
};
