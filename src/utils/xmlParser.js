import { XMLParser } from 'fast-xml-parser';

export function parseXmlText(xmlString) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: false,
      preserveOrder: true, // This is correct
    });
    
    const parsed = parser.parse(xmlString);

    // Case 1: Result is an array (e.g., [ { "?xml": ... }, { "TEI": ... } ])
    if (Array.isArray(parsed)) {
      // Find the first *element* node, skipping processing instructions and comments
      const rootElement = parsed.find(node => {
        const keys = Object.keys(node);
        // An element node will have one key (the tag name) that doesn't start with '?' or '!'
        return keys.length === 1 && !keys[0].startsWith('?') && !keys[0].startsWith('!');
      });

      if (rootElement) {
        return { data: rootElement, error: null };
      }
    }
    
    // Case 2: Result is a single object (e.g., { "TEI": ... })
    // This happens if there's no <?xml ...?> processing instruction
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed);
      // Check if it's a valid root element (like "TEI")
      if (keys.length > 0 && !keys[0].startsWith('?') && !keys[0].startsWith('!')) {
         return { data: parsed, error: null };
      }
    }
    
    // Fallback/Error if no valid root was found
    return { data: null, error: 'Could not find a valid root XML element.' };
    
  } catch (err) {
    const errorMessage = err.message || 'Failed to parse XML';
    return { 
      data: null, 
      error: `XML parsing error: ${errorMessage}` 
    };
  }
}