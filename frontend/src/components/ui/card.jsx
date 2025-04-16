import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`rounded-2xl shadow-md border p-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
