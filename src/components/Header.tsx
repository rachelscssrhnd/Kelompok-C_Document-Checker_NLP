import { FileText } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full border-b border-border bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Document Similarity Checker
          </h1>
          <p className="text-sm text-muted-foreground">
            Membandingkan dokumen menggunakan berbagai metode berbasis NLP
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
