import { useState } from "react";
import { Loader2, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import FileUploadZone from "@/components/FileUploadZone";
import SimilarityResults from "@/components/SimilarityResults";
import { UploadedDocument, SimilarityResult } from "@/types/document";
import { computeSimilarity } from "@/utils/similarityService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [results, setResults] = useState<SimilarityResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCheckSimilarity = async () => {
    if (documents.length < 2) {
      toast({
        title: "Not enough documents",
        description: "Please upload at least 2 documents to compare.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResults([]);

    try {
      const similarityResults = await computeSimilarity(documents);
      setResults(similarityResults);
      toast({
        title: "Analysis complete",
        description: `Compared ${documents.length} documents successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to compute similarity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Upload Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Upload Documents</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Upload multiple documents to compare their similarity. Supports PDF, DOCX, TXT, and images (OCR).</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <FileUploadZone documents={documents} onDocumentsChange={setDocuments} />

            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={handleCheckSimilarity}
                disabled={documents.length < 2 || isProcessing}
                className="min-w-[200px] font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Check Similarity
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {documents.length === 1 && (
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Upload at least one more document to compare
              </p>
            )}
          </div>
        </section>

        {/* Results Section */}
        {results.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Similarity Results
            </h2>
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <SimilarityResults results={results} />
            </div>
          </section>
        )}

        {/* Method Info Section */}
        {results.length === 0 && !isProcessing && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Similarity Methods
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <MethodCard
                title="Statistical Methods"
                icon="📊"
                methods={["TF-IDF Cosine Similarity", "Jaccard Similarity"]}
                description="Analyze word frequency and set overlap patterns"
              />
              <MethodCard
                title="Textual Methods"
                icon="📝"
                methods={["Levenshtein Similarity", "Jaro-Winkler Similarity"]}
                description="Compare character-level text patterns"
              />
              <MethodCard
                title="Semantic Methods"
                icon="🧠"
                methods={["MiniLM", "MPNet", "Multilingual MPNet"]}
                description="Understand meaning using neural embeddings"
              />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Document Similarity Checker — Academic Research Tool</p>
        </div>
      </footer>
    </div>
  );
};

const MethodCard = ({
  title,
  icon,
  methods,
  description,
}: {
  title: string;
  icon: string;
  methods: string[];
  description: string;
}) => (
  <div className="p-5 rounded-lg border border-border bg-gradient-to-b from-card to-muted/20 hover:shadow-md transition-shadow">
    <div className="text-2xl mb-2">{icon}</div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground mb-3">{description}</p>
    <ul className="space-y-1">
      {methods.map((method) => (
        <li key={method} className="text-sm text-foreground flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-secondary" />
          {method}
        </li>
      ))}
    </ul>
  </div>
);

export default Index;
