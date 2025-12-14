import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight, ArrowLeft, Info, BarChart3, FileText, Brain, Cpu, Globe } from "lucide-react";
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
        title: "Dokumen tidak cukup",
        description: "Unggah minimal 2 dokumen untuk dibandingkan.",
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
        title: "Analisis selesai",
        description: `Berhasil membandingkan ${documents.length} dokumen.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghitung kemiripan. Silakan coba lagi.",
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
        {/* Back to Landing */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>

        {/* Upload Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Unggah Dokumen</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Unggah beberapa dokumen untuk membandingkan kemiripannya. Mendukung PDF, DOCX, TXT, dan gambar (OCR).</p>
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
                    Menganalisis...
                  </>
                ) : (
                  <>
                    Cek Kemiripan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {documents.length === 1 && (
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Unggah minimal satu dokumen lagi untuk membandingkan
              </p>
            )}
          </div>
        </section>

        {/* Results Section */}
        {results.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Hasil Kemiripan
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
              Metode Kemiripan
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Statistical Methods */}
              <MethodCard
                title="Cosine TF-IDF"
                icon={<BarChart3 className="w-5 h-5" />}
                category="Statistik"
                description="Mengukur kemiripan berdasarkan frekuensi kata dengan pembobotan TF-IDF"
              />
              <MethodCard
                title="Jaccard"
                icon={<BarChart3 className="w-5 h-5" />}
                category="Statistik"
                description="Menghitung rasio irisan dan gabungan himpunan kata unik"
              />
              {/* Textual Methods */}
              <MethodCard
                title="Levenshtein"
                icon={<FileText className="w-5 h-5" />}
                category="Tekstual"
                description="Mengukur jarak edit minimum antar teks"
              />
              <MethodCard
                title="Jaro-Winkler"
                icon={<FileText className="w-5 h-5" />}
                category="Tekstual"
                description="Mengukur kemiripan karakter dengan penekanan awalan"
              />
              {/* Semantic Methods - Separated */}
              <MethodCard
                title="MiniLM"
                icon={<Brain className="w-5 h-5" />}
                category="Semantik"
                description="Model embedding ringan untuk memahami makna kalimat"
              />
              <MethodCard
                title="MPNet"
                icon={<Cpu className="w-5 h-5" />}
                category="Semantik"
                description="Model embedding akurat untuk representasi semantik"
              />
              <MethodCard
                title="Multilingual MPNet"
                icon={<Globe className="w-5 h-5" />}
                category="Semantik"
                description="Model embedding multibahasa untuk dokumen berbagai bahasa"
              />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Document Similarity Checker — Teknologi Sains Data FTMM UNAIR</p>
        </div>
      </footer>
    </div>
  );
};

const MethodCard = ({
  title,
  icon,
  category,
  description,
}: {
  title: string;
  icon: React.ReactNode;
  category: string;
  description: string;
}) => (
  <div className="p-5 rounded-lg border border-border bg-gradient-to-b from-card to-muted/20 hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-primary mb-3">
      {icon}
    </div>
    <span className="text-xs font-medium text-secondary uppercase tracking-wide">{category}</span>
    <h3 className="font-semibold text-foreground mt-1 mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

export default Index;
