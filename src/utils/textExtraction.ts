import { UploadedDocument } from "@/types/document";

// Extract text/data from a File object based on its type
// Returns base64 for binary files, text for text files
export async function extractTextFromFile(doc: UploadedDocument): Promise<string> {
  const file = doc.file;
  
  switch (doc.type) {
    case 'txt':
      return await file.text();
      
    case 'docx':
    case 'pdf':
    case 'image':
      // For binary files, return base64 encoded content
      // Python backend will handle proper extraction with PyMuPDF, python-docx, doctr
      return await fileToBase64(file);
      
    default:
      return await file.text();
  }
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Return full data URL (includes mime type)
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
