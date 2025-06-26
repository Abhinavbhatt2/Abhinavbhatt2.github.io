
import React from 'react';
import { TextAreaInputProps } from '../types';

const TextAreaInput: React.FC<TextAreaInputProps> = ({ id, label, value, onChange, placeholder, rows = 10, error }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-textDark mb-1">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`mt-1 block w-full p-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-card text-textDark placeholder-gray-400 resize-y`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default TextAreaInput;
