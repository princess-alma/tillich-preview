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

// Helper to safely get the first element from a potential array
function getFirst(item) {
  return Array.isArray(item) ? item[0] : item;
}

function extractTitle(tei) {
  try {
    const header = getFirst(tei.teiHeader) || getFirst(tei.TEIHeader);
    const fileDesc = getFirst(header.fileDesc);
    const titleStmt = getFirst(fileDesc.titleStmt);
    
    if (titleStmt.title) {
      // title content is an array of text and <lb> nodes
      const titleContent = titleStmt.title;
      return renderTitleContent(titleContent);
    }
    
    return null;
  } catch (e) {
    console.error('Error extracting title:', e);
    return null;
  }
}

function renderTitleContent(titleContent) {
  if (typeof titleContent === 'string') {
    return titleContent;
  }

  // Handle arrays from preserveOrder
  if (Array.isArray(titleContent)) {
    return (
      <React.Fragment>
        {titleContent.map((item, index) => {
          if (item['#text']) {
            return item['#text'];
          }
          if (item.lb !== undefined) {
            return <br key={`lb-${index}`} />;
          }
          // Handle nested tags within title if any
          const tagName = Object.keys(item).find(k => !k.startsWith('@_'));
          if (tagName) {
            return renderTitleContent(item[tagName]); // Recursive
          }
          return null;
        })}
      </React.Fragment>
    );
  }
  
  // Fallback for simple object (e.g., just { '#text': '...' })
  if (typeof titleContent === 'object' && titleContent !== null && titleContent['#text']) {
    return titleContent['#text'];
  }
  
  return null;
}

function extractLetterContent(tei) {
  try {
    const text = getFirst(tei.text);
    const body = getFirst(text.body);
    
    // Look for div with type="writingSession" or just use body
    if (body.div) {
      const allDivs = Array.isArray(body.div) ? body.div : [body.div];
      const writingSession = allDivs.find(d => d['@_type'] === 'writingSession') || allDivs[0];
      return writingSession;
    }
    
    return body;
  } catch (e) {
    console.error('Error extracting letter content:', e);
    return null;
  }
}

function renderLetterContent(content, footnotesList) {
  if (!content) return null;
  
  // The content of writingSession is an array of <pb>, <opener>, <p>, etc.
  // We render it directly.
  return (
    <div className="space-y-4">
      {renderContent(content, footnotesList, false)}
    </div>
  );
}

function renderTEIElement(element, footnotesList, key = 'element', inline = false) {
  if (!element) return null;
  
  // Handle text node
  if (element['#text']) {
    return element['#text'];
  }
  
  // Handle string (should be rare now, but good failsafe)
  if (typeof element === 'string') {
    return element;
  }
  
  // Handle arrays (e.g., multiple <p> tags)
  if (Array.isArray(element)) {
      const Wrapper = inline ? React.Fragment : 'div';
      const className = !inline ? 'space-y-2' : '';
      return (
        <Wrapper key={key} className={className}>
          {element.map((item, index) => renderTEIElement(item, footnotesList, `${key}-${index}`, inline))}
        </Wrapper>
      );
  }
  
  // Handle a single element node (e.g., { "p": [...] } or { "rs": [...] })
  if (typeof element === 'object' && element !== null) {
    const tagEntries = Object.entries(element).filter(([k]) => !k.startsWith('@_'));

    // This should now be the main path
    if (tagEntries.length === 1) {
      const [tagName, content] = tagEntries[0];
      return renderTEITag(tagName, content, element, footnotesList, `${key}-${tagName}`, inline);
    }

    // Fallback for mis-parsed objects (like <opener> which has multiple children)
    const Wrapper = inline ? 'span' : 'div';
    return (
      <Wrapper key={key} className={!inline ? 'space-y-2' : ''}>
        {tagEntries.map(([tagName, content]) => {
          return renderTEITag(tagName, content, element, footnotesList, `${key}-${tagName}`, inline);
        })}
      </Wrapper>
    );
  }
  
  return null;
}

function renderTEITag(tagName, content, element, footnotesList, key, inline = false) {
  // Get attributes from the parent 'element' object
  const attrs = Object.fromEntries(
    Object.entries(element)
      .filter(([k]) => k.startsWith('@_'))
      .map(([k, v]) => [k.substring(2), v])
  );
  
  // --- START: Simplified Entity Styling ---
  // A generic style for all highlighted entities as requested.
  const entityStyle = "bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium";
  // --- END: Simplified Entity Styling ---
  
  switch (tagName) {
    // Block elements
    case 'p':
      return (
        <p key={key} className="mb-4 leading-relaxed">
          {renderContent(content, footnotesList, true)}
        </p>
      );
      
    case 'opener':
      return (
        <div key={key} className="mb-6 text-gray-700">
          {renderContent(content, footnotesList, false)}
        </div>
      );

    case 'closer':
      return (
        <div key={key} className="mt-6 text-gray-700">
          {renderContent(content, footnotesList, false)}
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

    // --- START: Updated Entity Tags (Highlight Only) ---
    case 'rs':
    case 'persName':
    case 'placeName':
    case 'work':
    case 'organization': // Added common entity tags
    case 'date': // 'date' was also styled, let's group it
      return (
        <span key={key} className={entityStyle}>
          {renderContent(content, footnotesList, true)}
        </span>
      );
    // --- END: Updated Entity Tags ---
      
    case 'q':
      return (
        <span key={key} className="italic">
          "{renderContent(content, footnotesList, true)}"
        </span>
      );
      
    case 'note':
      const noteIndex = footnotesList.length + 1;
      // Pass an empty array for footnotesList to prevent nested notes
      // but entities *inside* the note will still be rendered/highlighted
      footnotesList.push(renderContent(content, [])); 
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
      const expan = Array.isArray(content) ? content.find(n => n.expan) : null;
      const abbr = Array.isArray(content) ? content.find(n => n.abbr) : null;

      if (expan) {
        return (
          <span key={key} className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm" title="Expanded abbreviation">
            {renderContent(expan.expan, footnotesList, true)}
          </span>
        );
      } else if (abbr) {
        return (
          <span key={key} className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm" title="Abbreviation">
            {renderContent(abbr.abbr, footnotesList, true)}
          </span>
        );
      }
      return renderContent(content, footnotesList, inline);
      
    // Other tags from your files
    case 'add':
      return (
        <span key={key} className="text-green-700 bg-green-100" title="Addition">
          {renderContent(content, footnotesList, true)}
        </span>
      );
    
    case 'del':
      return (
        <span key={key} className="text-red-700 line-through" title="Deletion">
          {renderContent(content, footnotesList, true)}
        </span>
      );

    case 'sic':
      return (
        <span key={key} className="italic text-gray-500" title="Original spelling retained">
          {renderContent(content, footnotesList, true)}
        </span>
      );
    
    case 'supplied':
      return (
        <span key={key} className="text-gray-500" title="Supplied by editor">
          {renderContent(content, footnotesList, true)}
        </span>
      );
    
    case 'formula':
      return (
        <span key={key} className="font-mono text-sm text-blue-700">
          {renderContent(content, footnotesList, true)}
        </span>
      );

    case 'unclear':
      return (
        <span key={key} className="bg-gray-100 text-gray-500" title="Unclear text">
          {renderContent(content, footnotesList, true)}
        </span>
      );
      
    // Structural tags
    case 'pb':
      return <div key={key} title={`Page ${attrs.n}`} className="my-2 border-t border-gray-300 w-16 mx-auto opacity-50"></div>;
      
    case 'lb':
      return <br key={key} />;
      
    case '#text':
      return content;
      
    default:
      // For unknown tags, just render their content
      return <React.Fragment key={key}>{renderContent(content, footnotesList, inline)}</React.Fragment>;
  }
}

function renderContent(content, footnotesList, inline = false) {
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    // This is the main path for mixed content (text nodes and element nodes)
    return <>{content.map((item, index) => renderTEIElement(item, footnotesList, `content-${index}`, inline))}</>;
  }
  
  if (typeof content === 'object' && content !== null) {
    // This handles cases where content is a single object (e.g., { '#text': '...' })
    return renderTEIElement(content, footnotesList, 'content', inline);
  }
  
  return null;
}