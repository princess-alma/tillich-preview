import React from 'react';


export function renderParsedXml(teiElement) {
  if (!teiElement || teiElement.tagName.toLowerCase() !== 'tei') {
    return <div className="text-red-600">Not a valid TEI document</div>;
  }
  
  // Create a list to hold footnotes
  const footnotesList = [];
  
  // Extract content
  const title = extractTitle(teiElement);
  const letterContent = extractLetterContent(teiElement);
  
  return (
    <div className="space-y-6">
      {/* 1. Title */}
      {title && (
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight text-left">
            {renderNodeList(title.childNodes, footnotesList)}
          </h1>
        </div>
      )}
      
      {/* 2. Letter Content */}
      {letterContent && (
        <div className="max-w-none text-left">
          {/* Render all children of the main content node */}
          {renderNodeList(letterContent.childNodes, footnotesList)}
        </div>
      )}
      
      {/* 3. Footnotes */}
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

function renderNodeList(nodes, footnotesList) {
  return Array.from(nodes).map((node, index) => {
    return renderNode(node, footnotesList, `node-${index}`);
  });
}

function renderNode(node, footnotesList, key) {
  // Case 1: Text Node (nodeType === 3)
  // Just render the text content
  if (node.nodeType === 3) {
    return node.textContent;
  }

  // Case 2: Element Node (nodeType === 1)
  // Render the corresponding React component
  if (node.nodeType === 1) {
    const tagName = node.tagName.toLowerCase();
    
    // Get all attributes as a simple object
    const attrs = Array.from(node.attributes).reduce((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
    
    const children = renderNodeList(node.childNodes, footnotesList);
    
    const entityStyle = "bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium";

    // Helper: map rs @type values to pastel Tailwind classes
    const rsTypeToClass = (type) => {
      if (!type) return "bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium";
      const t = type.toLowerCase();
      // Pastel palette for the specific rs types used in this project
      const map = {
        person: "bg-pink-100 text-pink-800 px-1 py-0.5 rounded text-sm font-medium",
        place: "bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-sm font-medium",
        work: "bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm font-medium",
        bible: "bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm font-medium",
        letter: "bg-sky-100 text-sky-800 px-1 py-0.5 rounded text-sm font-medium",
        default: "bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium",
      };
      return map[t] || map.default;
    };

    switch (tagName) {
      // Block elements
      case 'p':
        return <p key={key} className="mb-4 leading-relaxed">{children}</p>;
      case 'opener':
        return <div key={key} className="mb-6 text-gray-700">{children}</div>;
      case 'closer':
        return <div key={key} className="mt-6 text-gray-700">{children}</div>;
      case 'dateline':
        return <div key={key} className="text-left mb-4 text-gray-600">{children}</div>;
      case 'salute':
        return <div key={key} className="mb-4 font-medium">{children}</div>;
      case 'signed':
        return <div key={key} className="text-left mt-4 font-medium">{children}</div>;

      // Entity tags (Highlight Only)
      case 'rs': {
        // RS elements often have a @type attribute specifying what they refer to
        const rsType = attrs.type || attrs.t || attrs.subtype || '';
        const rsClass = rsTypeToClass(rsType);
        return <span key={key} className={rsClass} title={rsType || undefined}>{children}</span>;
      }
      case 'persname':
      case 'placename':
      case 'work':
      case 'organization':
      case 'date':
        return <span key={key} className={entityStyle}>{children}</span>;
      
      // Inline formatting
      case 'q':
        return <span key={key} className="italic">"{children}"</span>;
      case 'hi':
        const rendition = attrs.rend || attrs.rendition;
        let className = '';
        if (rendition === 'u' || rendition === 'underline' || rendition === 'uu') className = 'underline';
        else if (rendition === 'i' || rendition === 'italic') className = 'italic';
        else if (rendition === 'b' || rendition === 'bold') className = 'font-bold';
        else if (rendition === 'aq') className = 'font-mono';
        return <span key={key} className={className}>{children}</span>;
      case 'foreign':
        return <span key={key} className="italic text-gray-700" title={`Language: ${attrs['xml:lang'] || 'unknown'}`}>{children}</span>;

      case 'note':
        const noteIndex = footnotesList.length + 1;
        footnotesList.push(renderNodeList(node.childNodes, [])); 
        return <sup key={key} className="text-blue-600 hover:text-blue-800 cursor-help font-medium">{noteIndex}</sup>;
      case 'choice':
        const expan = node.querySelector('expan');
        if (expan) {
          return <span key={key} className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm" title="Expanded abbreviation">{renderNodeList(expan.childNodes, footnotesList)}</span>;
        }
        const abbr = node.querySelector('abbr');
        if (abbr) {
          return <span key={key} className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-sm" title="Abbreviation">{renderNodeList(abbr.childNodes, footnotesList)}</span>;
        }
        return <span key={key}>{children}</span>; // Fallback
      case 'add':
        return <span key={key} className="text-green-700 bg-green-100" title="Addition">{children}</span>;
      case 'del':
        return <span key={key} className="text-red-700 line-through" title="Deletion">{children}</span>;
      case 'sic':
        return <span key={key} className="italic text-gray-500" title="Original spelling retained">{children}</span>;
      case 'supplied':
        return <span key={key} className="text-gray-500" title="Supplied by editor">{children}</span>;
      case 'formula':
        return <span key={key} className="font-mono text-sm text-blue-700">{children}</span>;
      case 'unclear':
        return <span key={key} className="bg-gray-100 text-gray-500" title="Unclear text">{children}</span>;

      case 'pb':
        // Don't render the first page break (n=1) as it's redundant
        if (attrs.n === '1' || attrs.n === 1) {
          return null;
        }
        return <div key={key} title={`Page ${attrs.n}`} className="my-2 border-t border-gray-300 w-16 mx-auto opacity-50"></div>;
      case 'lb':
        return <br key={key} />;

      // Default: render children without a wrapper
      // This makes the renderer robust to unknown tags (like <body>, <div>)
      default:
        return <React.Fragment key={key}>{children}</React.Fragment>;
    }
  }
  return null;
}

function extractTitle(teiElement) {
  try {
    // Use querySelector to find the title node
    return teiElement.querySelector("teiHeader > fileDesc > titleStmt > title");
  } catch (e) {
    console.error('Error extracting title:', e);
    return null;
  }
}

function extractLetterContent(teiElement) {
  try {
    const body = teiElement.querySelector("text > body");
    if (!body) return null;    
    const writingSession = body.querySelector("div[type='writingSession']");
    return writingSession || body;
  } catch (e) {
    console.error('Error extracting letter content:', e);
    return null;
  }
}