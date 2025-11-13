import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Preview({ loading, error, filename, children }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">Preview</h2>
      </div>
      <div className="p-8">
        {loading && (
          <div className="flex items-center justify-center space-x-4 py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 text-lg">Parsing XML...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">❌</span>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {!filename && !loading && !error && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📄</div>
            <p className="text-gray-500 text-xl">
              Upload an XML file to see a beautiful preview
            </p>
          </div>
        )}
        
        {children && (
          <div className="max-h-[600px] overflow-y-auto space-y-6 bg-gray-50 p-6 rounded-lg border">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}