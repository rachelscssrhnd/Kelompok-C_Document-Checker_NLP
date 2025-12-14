import { UploadedDocument } from "@/types/document";

// Extract text from a File object based on its type
export async function extractTextFromFile(doc: UploadedDocument): Promise<string> {
  const file = doc.file;
  
  switch (doc.type) {
    case 'txt':
      return await file.text();
      
    case 'docx':
      return await extractFromDocx(file);
      
    case 'pdf':
      return await extractFromPdf(file);
      
    case 'image':
      // For images, we'd need OCR - for now return placeholder
      // In production, this would use an OCR service
      return `[Image content from ${doc.name} - OCR processing required]`;
      
    default:
      return await file.text();
  }
}

// Extract text from DOCX file
async function extractFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // DOCX is a ZIP file containing XML
    // We'll use a simple approach to extract text from document.xml
    const text = await parseDocxContent(uint8Array);
    return text;
  } catch (error) {
    console.error('Error extracting DOCX:', error);
    return `[Error extracting text from ${file.name}]`;
  }
}

// Simple DOCX parser using JSZip-like approach
async function parseDocxContent(data: Uint8Array): Promise<string> {
  // Import pako for unzipping
  const { inflate } = await import('pako');
  
  try {
    // Find the document.xml in the DOCX (ZIP) file
    const zip = await parseZip(data);
    const documentXml = zip['word/document.xml'];
    
    if (!documentXml) {
      throw new Error('document.xml not found in DOCX');
    }
    
    // Parse XML and extract text
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    
    // Extract all text nodes from w:t elements
    const textNodes = xmlDoc.getElementsByTagName('w:t');
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      currentParagraph += node.textContent || '';
      
      // Check if this is end of paragraph
      const parent = node.parentElement;
      if (parent?.nextElementSibling?.tagName === 'w:p' || i === textNodes.length - 1) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
        }
        currentParagraph = '';
      }
    }
    
    return paragraphs.join('\n');
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw error;
  }
}

// Simple ZIP parser
async function parseZip(data: Uint8Array): Promise<Record<string, string>> {
  const { inflate } = await import('pako');
  const files: Record<string, string> = {};
  
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  
  while (offset < data.length - 4) {
    // Look for local file header signature
    const signature = view.getUint32(offset, true);
    
    if (signature !== 0x04034b50) {
      // Not a local file header, might be central directory
      break;
    }
    
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);
    
    const fileNameStart = offset + 30;
    const fileNameBytes = data.slice(fileNameStart, fileNameStart + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    
    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
    const compressedData = data.slice(dataStart, dataStart + compressedSize);
    
    // Only process XML files we care about
    if (fileName.endsWith('.xml')) {
      try {
        let content: Uint8Array;
        if (compressionMethod === 8) {
          // Deflate compression
          content = inflate(compressedData);
        } else if (compressionMethod === 0) {
          // No compression
          content = compressedData;
        } else {
          content = compressedData;
        }
        files[fileName] = new TextDecoder().decode(content);
      } catch (e) {
        console.warn(`Failed to decompress ${fileName}:`, e);
      }
    }
    
    offset = dataStart + compressedSize;
  }
  
  return files;
}

// Extract text from PDF file
async function extractFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const text = await parsePdfContent(new Uint8Array(arrayBuffer));
    return text;
  } catch (error) {
    console.error('Error extracting PDF:', error);
    return `[Error extracting text from ${file.name}]`;
  }
}

// Simple PDF text extractor
async function parsePdfContent(data: Uint8Array): Promise<string> {
  const content = new TextDecoder('latin1').decode(data);
  const textParts: string[] = [];
  
  // Find text streams in the PDF
  // This is a simplified parser - real PDFs are more complex
  const streamRegex = /stream\s*([\s\S]*?)endstream/g;
  let match;
  
  while ((match = streamRegex.exec(content)) !== null) {
    const streamContent = match[1];
    
    // Look for text operators: Tj, TJ, ', "
    const textMatches = streamContent.match(/\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g);
    
    if (textMatches) {
      for (const tm of textMatches) {
        // Extract text from parentheses
        const parenMatches = tm.match(/\(([^)]*)\)/g);
        if (parenMatches) {
          for (const pm of parenMatches) {
            const text = pm.slice(1, -1);
            // Decode escape sequences
            const decoded = text
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\\\/g, '\\');
            if (decoded.trim()) {
              textParts.push(decoded);
            }
          }
        }
      }
    }
  }
  
  // Also try to find BT...ET text blocks
  const btRegex = /BT\s*([\s\S]*?)ET/g;
  while ((match = btRegex.exec(content)) !== null) {
    const block = match[1];
    const textInBlock = block.match(/\(([^)]+)\)/g);
    if (textInBlock) {
      for (const t of textInBlock) {
        const text = t.slice(1, -1).trim();
        if (text && !textParts.includes(text)) {
          textParts.push(text);
        }
      }
    }
  }
  
  if (textParts.length === 0) {
    return '[PDF text extraction limited - complex PDF structure detected]';
  }
  
  return textParts.join(' ');
}
