import { XMLParser } from 'fast-xml-parser';

export function parseXmlText(xmlString) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });
    
    const parsed = parser.parse(xmlString);
    return { data: parsed, error: null };
  } catch (err) {
    const errorMessage = err.message || 'Failed to parse XML';
    return { 
      data: null, 
      error: `XML parsing error: ${errorMessage}` 
    };
  }
}