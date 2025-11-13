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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight text-left">
            {title}
          </h1>
        </div>
      )}
      
      {/* Letter Content */}
      {letterContent && (
        <div className="max-w-none text-left">
          {renderLetterContent(letterContent, footnotesList)}
        </div>
      )}
      
      {/* Footnotes */}
      {footnotesList.length > 0 && (
        <div className="border-t border-gray-200 pt-6 mt-8 text-left">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Notes</h3>
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
      const title = titleStmt.title;
      

      
      // If it's a simple string, return it
      if (typeof title === 'string') return title;
      
      // If it's an array, take the first item
      if (Array.isArray(title)) {
        return renderTitleContent(title[0]);
      }
      
      // If it's an object, render it properly
      return renderTitleContent(title);
    }
    
    return null;
  } catch (e) {
    console.error('Error extracting title:', e);
    return null;
  }
}

function renderTitleContent(titleObj) {
  if (typeof titleObj === 'string') {
    return titleObj;
  }
  
  if (typeof titleObj === 'object' && titleObj !== null) {
    // Handle simple text content
    if (titleObj['#text'] && Object.keys(titleObj).length === 1) {
      return titleObj['#text'];
    }
    
    // Special case: title with lb tag where parser combines text
    // The structure is: { "lb": "", "#text": "Part1Part2" }
    // We need to split the text and insert line breaks
    if (titleObj['lb'] !== undefined && titleObj['#text']) {
      const text = titleObj['#text'];
      
      // Common patterns to split on for German letters
      // Look for patterns like "PersonName an PersonNamevom Date" or "Title vom Date"
      const patterns = [
        /(\s+vom\s+)/i,
        /(\s+am\s+)/i, 
        /(\s+den\s+)/i,
        /(vom\s+)/i
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          const parts = text.split(pattern);
          if (parts.length >= 2) {
            const result = [];
            result.push(parts[0]);
            result.push(<br key="title-lb" />);
            // Add the separator and rest back together
            result.push(parts.slice(1).join(''));
            return <span>{result}</span>;
          }
        }
      }
      
      // Fallback: if no pattern matches, just return the text
      return text;
    }
    
    // Handle mixed content - this is the key part for titles with <lb/> tags
    const parts = [];
    
    // The XML parser might structure mixed content differently
    // Let's handle various possible structures
    if (Array.isArray(titleObj)) {
      // If title is an array of mixed content
      titleObj.forEach((item, index) => {
        if (typeof item === 'string') {
          parts.push(item);
        } else if (item === null || item === undefined) {
          // Sometimes <lb/> gets parsed as null/undefined
          parts.push(<br key={`lb-${index}`} />);
        } else if (typeof item === 'object') {
          // Handle nested objects
          parts.push(renderTitleContent(item));
        }
      });
    } else {
      // Handle object with mixed content
      Object.entries(titleObj).forEach(([key, value], index) => {
        if (key === '#text') {
          // Split text by potential line break markers and add the text
          if (typeof value === 'string') {
            parts.push(value);
          }
        } else if (key === 'lb') {
          // Add line break - can be single or array
          if (Array.isArray(value)) {
            value.forEach((_, i) => parts.push(<br key={`lb-${index}-${i}`} />));
          } else {
            parts.push(<br key={`lb-${index}`} />);
          }
        } else if (!key.startsWith('@_')) {
          // Handle other inline elements
          if (typeof value === 'string') {
            parts.push(value);
          } else if (value && typeof value === 'object') {
            parts.push(renderTitleContent(value));
          }
        }
      });
    }
    
    if (parts.length > 0) {
      return <span>{parts}</span>;
    }
  }
  
  return null;
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

function renderTEIElement(element, footnotesList, key = 'element', inline = false) {
  if (!element) return null;
  

  
  // Handle text content
  if (typeof element === 'string') {
    return <span key={key}>{element}</span>;
  }
  
  // Handle arrays
  if (Array.isArray(element)) {
    if (inline) {
      // For inline arrays, add spaces between elements
      const items = [];
      element.forEach((item, index) => {
        if (index > 0) {
          items.push(' '); // Add space before each item except the first
        }
        items.push(renderTEIElement(item, footnotesList, `${key}-${index}`, inline));
      });
      return <span key={key}>{items}</span>;
    } else {
      // For block arrays, use div with spacing
      return (
        <div key={key} className="space-y-2">
          {element.map((item, index) => renderTEIElement(item, footnotesList, `${key}-${index}`, inline))}
        </div>
      );
    }
  }
  
  // Handle objects
  if (typeof element === 'object') {
    const tagEntries = Object.entries(element).filter(([k]) => !k.startsWith('@_'));
    
    // Use span for inline rendering, div for block
    const Wrapper = inline ? 'span' : 'div';
    
    return (
      <Wrapper key={key}>
        {tagEntries.map(([tagName, content]) => {
          return renderTEITag(tagName, content, element, footnotesList, `${key}-${tagName}`, inline);
        })}
      </Wrapper>
    );
  }
  
  return null;
}

function renderTEITag(tagName, content, element, footnotesList, key, inline = false) {
  const attributes = Object.entries(element).filter(([k]) => k.startsWith('@_'));
  const attrs = Object.fromEntries(attributes.map(([k, v]) => [k.substring(2), v]));
  
  switch (tagName) {
    case 'p':
      return (
        <p key={key} className="mb-4 leading-relaxed">
          {renderContent(content, footnotesList, true)}
        </p>
      );
      
    case 'opener':
    case 'closer':
      return (
        <div key={key} className={`${tagName === 'opener' ? 'mb-6' : 'mt-6'} italic text-gray-700`}>
          {renderContent(content, footnotesList, true)}
        </div>
      );
      
    case 'dateline':
      return (
        <div key={key} className="text-left mb-4 text-gray-600">
          {renderContent(content, footnotesList, true)}
        </div>
      );
      
    case 'salute':
      return (
        <div key={key} className="mb-4 font-medium">
          {renderContent(content, footnotesList, true)}
        </div>
      );
      
    case 'signed':
      return (
        <div key={key} className="text-left mt-4 font-medium">
          {renderContent(content, footnotesList, true)}
        </div>
      );
      
    case 'rs':
      const rsType = attrs.type || 'reference';
      const bgColor = getRsColor(rsType);
      return (
        <span key={key} className={`${bgColor} px-1 py-0.5 rounded text-sm font-medium`}>
          {renderContent(content, footnotesList, true)}
        </span>
      );
      
    case 'persName':
      return (
        <span key={key} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium">
          {renderContent(content, footnotesList, true)}
        </span>
      );
      
    case 'placeName':
      return (
        <span key={key} className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-sm font-medium">
          {renderContent(content, footnotesList, true)}
        </span>
      );
      
    case 'date':
      return (
        <span key={key} className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm font-medium">
          {renderContent(content, footnotesList, true)}
        </span>
      );
      
    case 'q':
      return (
        <span key={key} className="italic">
          "{renderContent(content, footnotesList, true)}"
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
          {renderContent(content, footnotesList, true)}
        </span>
      );
      
    case 'choice':
      // For choice elements, prefer expan over abbr
      if (content.expan) {
        return (
          <span key={key} className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm" title="Expanded abbreviation">
            {renderContent(content.expan, footnotesList, true)}
          </span>
        );
      } else if (content.abbr) {
        return (
          <span key={key} className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm" title="Abbreviation">
            {renderContent(content.abbr, footnotesList, true)}
          </span>
        );
      }
      return renderContent(content, footnotesList, inline);
      
    case 'pb':
      // Page break - show as a subtle divider
      return <div key={key} className="my-2 border-t border-gray-300 w-16 mx-auto opacity-50"></div>;
      
    case 'lb':
      // Line break
      return <br key={key} />;
      
    case '#text':
      return <span key={key}>{content}</span>;
      
    default:
      // For unknown tags, just render content
      return <span key={key}>{renderContent(content, footnotesList, true)}</span>;
  }
}

function renderContent(content, footnotesList, inline = false) {
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content.map((item, index) => renderTEIElement(item, footnotesList, `content-${index}`, inline));
  }
  
  if (typeof content === 'object') {
    return renderTEIElement(content, footnotesList, 'content', inline);
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