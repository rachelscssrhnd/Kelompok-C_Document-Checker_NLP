import { useCallback, useState } from "react";
import { Upload, FileText, Image, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadedDocument } from "@/types/document";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
  documents: UploadedDocument[];
  onDocumentsChange: (docs: UploadedDocument[]) => void;
}

const getFileType = (file: File): UploadedDocument['type'] => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'txt') return 'txt';
  if (['jpg', 'jpeg', 'png'].includes(ext || '')) return 'image';
  return 'txt';
};

const getFileIcon = (type: UploadedDocument['type']) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-4 h-4 text-destructive" />;
    case 'docx':
      return <FileText className="w-4 h-4 text-secondary" />;
    case 'image':
      return <Image className="w-4 h-4 text-success" />;
    default:
      return <File className="w-4 h-4 text-muted-foreground" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileUploadZone = ({ documents, onDocumentsChange }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newDocs: UploadedDocument[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: getFileType(file),
      size: file.size,
      file,
    }));

    onDocumentsChange([...documents, ...newDocs]);
  }, [documents, onDocumentsChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeDocument = (id: string) => {
    onDocumentsChange(documents.filter((doc) => doc.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <label
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-accent/50"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className={cn(
            "p-3 rounded-full mb-3 transition-colors",
            isDragging ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-6 h-6 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <p className="mb-2 text-sm text-foreground">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOCX, TXT, JPG, PNG (OCR supported)
          </p>
        </div>
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          multiple
          accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {/* File List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              Uploaded Documents ({documents.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDocumentsChange([])}
              className="text-muted-foreground hover:text-destructive text-xs h-7"
            >
              Clear all
            </Button>
          </div>
          <ul className="space-y-2">
            {documents.map((doc, index) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {getFileIcon(doc.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeDocument(doc.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
