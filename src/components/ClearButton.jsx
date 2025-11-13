import React from 'react';
import { Button } from '@/components/ui/button';

export default function ClearButton({ onClear, disabled }) {
  return (
    <button 
      onClick={onClear}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all duration-200 flex items-center space-x-2 ${
        disabled 
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-md hover:shadow-lg'
      }`}
    >
      <span className="text-lg">🗑️</span>
      <span>Clear</span>
    </button>
  );
}