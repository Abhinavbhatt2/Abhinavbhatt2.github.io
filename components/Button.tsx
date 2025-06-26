
import React from 'react';
import { ButtonProps } from '../types';

const Button: React.FC<ButtonProps> = ({ onClick, disabled = false, isLoading = false, children, variant = 'primary', className = '' }) => {
  const baseStyle = "flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const variantStyles = {
    primary: "text-primary-text bg-primary border-transparent hover:bg-primary-hover focus:ring-primary",
    secondary: "text-primary bg-transparent border-primary hover:bg-blue-50 focus:ring-primary",
  };

  const combinedClassName = `${baseStyle} ${variantStyles[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={combinedClassName}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
