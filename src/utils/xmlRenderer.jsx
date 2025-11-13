import React from 'react';

// TEI-specific renderer for letter documents
export function renderParsedXml(parsed) {
  if (!parsed) return null;
  
  // Navigate to TEI structure
  const tei = parsed.TEI || parsed.tei;
  if (!tei) {
    return <div className="text-red-600">Not a valid TEI document</div>;
  }
  
  // Extract title from header
  const title = extractTitle(tei);
  
  // Extract letter content
  const letterContent = extractLetterContent(tei);
  
  // Create footnotes array that will be populated during rendering
  const footnotesList = [];
  
  return (
    <div className="space-y-6">
      {/* Title */}
      {title && (
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>
        </div>
      )}
      
      {/* Letter Content */}
      {letterContent && (
        <div className="prose prose-lg max-w-none">
          {renderLetterContent(letterContent, footnotesList)}
        </div>
      )}
      
      {/* Footnotes */}
      {footnotesList.length > 0 && (
        <div className="border-t border-gray-200 pt-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <div className="space-y-3">
            {footnotesList.map((note, index) => (
              <div key={index} className="text-sm text-gray-700 flex">
                <sup className="text-blue-600 font-medium mr-2">{index + 1}</sup>
                <div className="flex-1">{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extractTitle(tei) {
  try {
    const header = tei.teiHeader || tei.TEIHeader;
    const fileDesc = header.fileDesc;
    const titleStmt = fileDesc.titleStmt;
    
    if (titleStmt.title) {
      // Handle title as string or object with #text
      const title = titleStmt.title;
      if (typeof title === 'string') return title;
      if (title['#text']) return title['#text'];
      if (Array.isArray(title)) return title[0]['#text'] || title[0];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

function extractLetterContent(tei) {
  try {
    const text = tei.text;
    const body = text.body;
    
    // Look for div with type="writingSession" or just use body
    if (body.div) {
      const writingSession = Array.isArray(body.div) 
        ? body.div.find(d => d['@_type'] === 'writingSession') || body.div[0]
        : body.div;
      return writingSession;
    }
    
    return body;
  } catch (e) {
    return null;
  }
}

function renderLetterContent(content, footnotesList) {
  if (!content) return null;
  
  return (
    <div className="space-y-4">
      {renderTEIElement(content, footnotesList)}
    </div>
  );
}

function renderTEIElement(element, footnotesList, key = 'element') {
  if (!element) return null;
  
  // Handle text content
  if (typeof element === 'string') {
    return <span key={key}>{element}</span>;
  }
  
  // Handle arrays
  if (Array.isArray(element)) {
    return (
      <div key={key} className="space-y-2">
        {element.map((item, index) => renderTEIElement(item, footnotesList, `${key}-${index}`))}
      </div>
    );
  }
  
  // Handle objects
  if (typeof element === 'object') {
    const tagEntries = Object.entries(element).filter(([k]) => !k.startsWith('@_'));
    
    return (
      <div key={key}>
        {tagEntries.map(([tagName, content]) => {
          return renderTEITag(tagName, content, element, footnotesList, `${key}-${tagName}`);
        })}
      </div>
    );
  }
  
  return null;
}

function renderTEITag(tagName, content, element, footnotesList, key) {
  const attributes = Object.entries(element).filter(([k]) => k.startsWith('@_'));
  const attrs = Object.fromEntries(attributes.map(([k, v]) => [k.substring(2), v]));
  
  switch (tagName) {
    case 'p':
      return (
        <p key={key} className="mb-4 leading-relaxed">
          {renderContent(content, footnotesList)}
        </p>
      );
      
    case 'opener':
    case 'closer':
      return (
        <div key={key} className={`${tagName === 'opener' ? 'mb-6' : 'mt-6'} italic text-gray-700`}>
          {renderContent(content, footnotesList)}
        </div>
      );
      
    case 'dateline':
      return (
        <div key={key} className="text-right mb-4 text-gray-600">
          {renderContent(content, footnotesList)}
        </div>
      );
      
    case 'salute':
      return (
        <div key={key} className="mb-4 font-medium">
          {renderContent(content, footnotesList)}
        </div>
      );
      
    case 'signed':
      return (
        <div key={key} className="text-right mt-4 font-medium">
          {renderContent(content, footnotesList)}
        </div>
      );
      
    case 'rs':
      const rsType = attrs.type || 'reference';
      const bgColor = getRsColor(rsType);
      return (
        <span key={key} className={`${bgColor} px-1 py-0.5 rounded text-sm font-medium`}>
          {renderContent(content, footnotesList)}
        </span>
      );
      
    case 'persName':
      return (
        <span key={key} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium">
          {renderContent(content, footnotesList)}
        </span>
      );
      
    case 'placeName':
      return (
        <span key={key} className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-sm font-medium">
          {renderContent(content, footnotesList)}
        </span>
      );
      
    case 'date':
      return (
        <span key={key} className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm font-medium">
          {renderContent(content, footnotesList)}
        </span>
      );
      
    case 'note':
      const noteIndex = footnotesList.length + 1;
      footnotesList.push(renderContent(content, [])); // Don't nest footnotes
      return (
        <sup key={key} className="text-blue-600 hover:text-blue-800 cursor-help font-medium">
          {noteIndex}
        </sup>
      );
      
    case 'hi':
      const rendition = attrs.rend || attrs.rendition;
      let className = '';
      if (rendition === 'u' || rendition === 'underline') className = 'underline';
      else if (rendition === 'i' || rendition === 'italic') className = 'italic';
      else if (rendition === 'b' || rendition === 'bold') className = 'font-bold';
      
      return (
        <span key={key} className={className}>
          {renderContent(content, footnotesList)}
        </span>
      );
      
    case 'choice':
      // For choice elements, prefer expan over abbr
      if (content.expan) {
        return (
          <span key={key} className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm" title="Expanded abbreviation">
            {renderContent(content.expan, footnotesList)}
          </span>
        );
      } else if (content.abbr) {
        return (
          <span key={key} className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm" title="Abbreviation">
            {renderContent(content.abbr, footnotesList)}
          </span>
        );
      }
      return renderContent(content, footnotesList);
      
    case 'pb':
      // Page break - show as a subtle divider
      return <div key={key} className="my-2 border-t border-gray-300 w-16 mx-auto opacity-50"></div>;
      
    case '#text':
      return <span key={key}>{content}</span>;
      
    default:
      // For unknown tags, just render content
      return <span key={key}>{renderContent(content, footnotesList)}</span>;
  }
}

function renderContent(content, footnotesList) {
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content.map((item, index) => renderTEIElement(item, footnotesList, `content-${index}`));
  }
  
  if (typeof content === 'object') {
    return renderTEIElement(content, footnotesList);
  }
  
  return null;
}

function getRsColor(type) {
  switch (type) {
    case 'person':
      return 'bg-blue-100 text-blue-800';
    case 'place':
      return 'bg-green-100 text-green-800';
    case 'work':
    case 'book':
      return 'bg-orange-100 text-orange-800';
    case 'organization':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}