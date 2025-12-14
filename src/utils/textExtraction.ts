import { UploadedDocument } from "@/types/document";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

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
      // For images, we need OCR - will be processed server-side
      // Return the base64 image data for server processing
      return await extractFromImage(file);
      
    default:
      return await file.text();
  }
}

// Extract text from DOCX file using mammoth
async function extractFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    if (!text || text.trim().length === 0) {
      console.warn('No text extracted from DOCX, trying fallback');
      return await extractFromDocxFallback(new Uint8Array(arrayBuffer));
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting DOCX with mammoth:', error);
    // Try fallback method
    try {
      const arrayBuffer = await file.arrayBuffer();
      return await extractFromDocxFallback(new Uint8Array(arrayBuffer));
    } catch (fallbackError) {
      console.error('Fallback DOCX extraction also failed:', fallbackError);
      return `[Error extracting text from ${file.name}]`;
    }
  }
}

// Fallback DOCX parser using manual ZIP parsing
async function extractFromDocxFallback(data: Uint8Array): Promise<string> {
  const { inflate } = await import('pako');
  
  try {
    const zip = await parseZip(data, inflate);
    const documentXml = zip['word/document.xml'];
    
    if (!documentXml) {
      throw new Error('document.xml not found in DOCX');
    }
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    
    const textNodes = xmlDoc.getElementsByTagName('w:t');
    const paragraphs: string[] = [];
    
    for (let i = 0; i < textNodes.length; i++) {
      const text = textNodes[i].textContent || '';
      if (text.trim()) {
        paragraphs.push(text);
      }
    }
    
    return paragraphs.join(' ');
  } catch (error) {
    console.error('DOCX fallback parsing error:', error);
    throw error;
  }
}

// Simple ZIP parser
async function parseZip(data: Uint8Array, inflate: (input: Uint8Array) => Uint8Array): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  
  while (offset < data.length - 4) {
    const signature = view.getUint32(offset, true);
    
    if (signature !== 0x04034b50) {
      break;
    }
    
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);
    
    const fileNameStart = offset + 30;
    const fileNameBytes = data.slice(fileNameStart, fileNameStart + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    
    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
    const compressedData = data.slice(dataStart, dataStart + compressedSize);
    
    if (fileName.endsWith('.xml')) {
      try {
        let content: Uint8Array;
        if (compressionMethod === 8) {
          content = inflate(compressedData);
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

// Extract text from PDF file using pdf.js
async function extractFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const textParts: string[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      
      if (pageText.trim()) {
        textParts.push(pageText);
      }
    }
    
    const extractedText = textParts.join('\n');
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.warn('No text extracted from PDF - might be scanned/image PDF');
      return `[Scanned PDF - OCR required for ${file.name}]`;
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting PDF:', error);
    return `[Error extracting text from ${file.name}]`;
  }
}

// Extract from image - convert to base64 for OCR processing
async function extractFromImage(file: File): Promise<string> {
  try {
    // For now, return a marker indicating OCR is needed
    // The edge function could potentially use an OCR API
    // But since we don't have OCR set up, we'll note this
    const base64 = await fileToBase64(file);
    
    // Return marker with some metadata
    return `[Image: ${file.name} - Size: ${file.size} bytes - OCR processing required]`;
  } catch (error) {
    console.error('Error processing image:', error);
    return `[Error processing image ${file.name}]`;
  }
}

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
