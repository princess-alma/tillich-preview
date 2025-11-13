import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function FileUploader({ onFileText, inputKey = 0 }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      onFileText(String(reader.result), file.name);
    };
    reader.onerror = () => {
      onFileText(null, file.name, new Error('Failed to read file'));
    };
    reader.readAsText(file);
  }

  return (
    <>
      <input
        key={inputKey} // Allows parent to reset by changing key
        ref={inputRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        onChange={handleChange}
        className="hidden"
      />
      <button 
        onClick={() => inputRef.current?.click()}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
      >
        <span className="text-lg">📤</span>
        <span>Upload XML</span>
      </button>
    </>
  );
}