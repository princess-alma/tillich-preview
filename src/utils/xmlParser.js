export function parseXmlText(xmlString) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");

    // Check for parser errors
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      return { 
        data: null, 
        error: `XML parsing error: ${parserError.textContent}` 
      };
    }

    // doc.documentElement is the root element, e.g., <TEI>
    if (doc.documentElement) {
      return { data: doc.documentElement, error: null };
    } else {
      return { data: null, error: 'Could not find a valid root XML element.' };
    }
    
  } catch (err) {
    const errorMessage = err.message || 'Failed to parse XML';
    return { 
      data: null, 
      error: `XML parsing error: ${errorMessage}` 
    };
  }
}