import { FileText } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Document Similarity Checker
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare documents using multiple NLP methods
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
