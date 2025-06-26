
import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Processing your request..." }) => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="ml-3 text-textDark">{message}</p>
    </div>
  );
};

export default LoadingSpinner;