import React from 'react';

function renderNode(key, node, depth = 0) {
  if (node == null) return null;
  
  // Handle text nodes
  if (typeof node === 'string' || typeof node === 'number') {
    const text = String(node).trim();
    if (!text) return null;
    return (
      <div key={key} className="text-gray-800 leading-relaxed">
        {text}
      </div>
    );
  }
  
  // Handle arrays
  if (Array.isArray(node)) {
    return (
      <div key={key} className="space-y-4">
        {node.map((child, i) => renderNode(`${key}-${i}`, child, depth))}
      </div>
    );
  }
  
  // Handle objects
  if (typeof node === 'object') {
    const entries = Object.entries(node);
    
    return (
      <div key={key} className={`space-y-4 ${depth > 0 ? 'ml-6 pl-4 border-l-4 border-blue-200' : ''}`}>
        {entries.map(([k, v]) => {
          // Skip attributes for now (they start with @_)
          if (k.startsWith('@_')) return null;
          
          const displayKey = k === '#text' ? 'Content' : k;
          
          // Special styling for different XML elements
          const isMetadata = ['date', 'sender', 'recipient', 'subject'].includes(k.toLowerCase());
          const isParagraph = k.toLowerCase() === 'paragraph';
          
          return (
            <div key={k} className="space-y-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className={`font-semibold capitalize text-sm flex items-center space-x-2 ${
                isMetadata ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {isMetadata && <span className="text-lg">ℹ️</span>}
                {isParagraph && <span className="text-lg">📝</span>}
                {!isMetadata && !isParagraph && <span className="text-lg">📋</span>}
                <span>{displayKey.replace(/([A-Z])/g, ' $1').trim()}:</span>
              </div>
              <div className={`${
                isParagraph ? 'text-base leading-relaxed font-medium text-gray-900' : 'text-gray-700'
              } ${isMetadata ? 'bg-blue-50 p-3 rounded border-l-4 border-blue-400' : ''}`}>
                {renderNode(k, v, depth + 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  return null;
}

export function renderParsedXml(parsed) {
  if (!parsed) return null;
  
  return (
    <div className="space-y-4">
      {renderNode('root', parsed)}
    </div>
  );
}