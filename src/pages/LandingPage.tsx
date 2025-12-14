import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Layers, Shield, Upload, BarChart3, Brain } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
                Teknologi Sains Data · FTMM UNAIR
              </p>
              <h1 className="text-lg font-bold text-foreground">Document Checker</h1>
            </div>
          </div>
          <Link to="/checker">
            <Button variant="outline" size="sm">
              Masuk ke Checker
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/20" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-sm font-semibold text-secondary tracking-wide uppercase">
                Program Studi Teknologi Sains Data · FTMM UNAIR
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Pemeriksaan Kemiripan Dokumen
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Dokumen Akademik TSD FTMM — Cek kemiripan tugas, laporan, maupun skripsi sebelum dikumpulkan ke dosen. 
                Sistem menghasilkan skor kemiripan gabungan dari pendekatan statistik, tekstual, dan semantik sebagai bahan cek mandiri.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/checker">
                  <Button size="lg" className="w-full sm:w-auto">
                    Masuk ke Document Checker
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                Maksimal 10 dokumen · Pemrosesan lokal di browser
              </p>
            </div>

            {/* Score Preview Card */}
            <div className="lg:pl-8">
              <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">Preview skor</p>
                <h3 className="text-xl font-bold text-foreground mb-6">Hybrid Similarity Score</h3>
                <p className="text-sm text-muted-foreground mb-4">Skor gabungan (contoh)</p>
                
                <div className="text-center py-6">
                  <span className="text-7xl font-bold text-warning">0.61</span>
                </div>
                
                <p className="text-center text-sm text-warning font-medium mb-8">
                  Warning jika {'>'} 0.50
                </p>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-foreground">{'< 30%'} · Umumnya aman</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-foreground">30–50% · Perlu peninjauan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-foreground">{'> 50%'} · Perlu revisi menyeluruh</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
                  <div className="text-center">
                    <BarChart3 className="w-5 h-5 mx-auto text-primary mb-2" />
                    <p className="text-xs font-semibold text-foreground">Statistik</p>
                    <p className="text-xs text-muted-foreground">Cosine TF-IDF, Jaccard</p>
                  </div>
                  <div className="text-center">
                    <FileText className="w-5 h-5 mx-auto text-secondary mb-2" />
                    <p className="text-xs font-semibold text-foreground">Tekstual</p>
                    <p className="text-xs text-muted-foreground">Levenshtein, Jaro-Winkler</p>
                  </div>
                  <div className="text-center">
                    <Brain className="w-5 h-5 mx-auto text-success mb-2" />
                    <p className="text-xs font-semibold text-foreground">Semantik</p>
                    <p className="text-xs text-muted-foreground">Embedding kalimat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-secondary tracking-wide uppercase mb-3">
              01 · Tentang
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Apa itu Document Checker?
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Document Checker membantu mahasiswa Teknologi Sains Data melakukan pemeriksaan kemiripan dokumen 
              secara mandiri sebelum dikumpulkan ke dosen. Sistem menggabungkan beberapa pendekatan: statistik, 
              tekstual, dan semantik untuk menghasilkan satu skor kemiripan gabungan.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-secondary tracking-wide uppercase mb-3">
              02 · Fitur
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              Fitur utama
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Layers className="w-6 h-6" />}
              title="Analisis Multi-Metode"
              description="Menggunakan kombinasi Cosine TF-IDF, Jaccard, Levenshtein, Jaro-Winkler, dan embedding kalimat."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Skor Gabungan"
              description="Sistem merangkum setiap metode menjadi satu skor kemiripan gabungan yang mudah dibaca."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Pemrosesan Lokal"
              description="Untuk kenyamanan pengguna, pemrosesan berjalan lokal di browser tanpa mengirim dokumen ke server eksternal."
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-secondary tracking-wide uppercase mb-3">
              03 · Alur
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              Alur penggunaan singkat
            </h3>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <WorkflowStep
                number={1}
                title="Unggah dokumen"
                description="Unggah hingga 10 dokumen yang ingin diperiksa."
              />
              <WorkflowStep
                number={2}
                title="Analisis otomatis"
                description="Sistem menjalankan analisis kemiripan multi-metode."
              />
              <WorkflowStep
                number={3}
                title="Lihat hasil"
                description="Anda mendapatkan ringkasan skor gabungan dan rekomendasi tindak lanjut."
              />
            </div>

            <div className="text-center mt-12">
              <Link to="/checker">
                <Button size="lg">
                  Mulai Periksa Dokumen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Document Checker</span>
            <span className="text-muted-foreground">— Teknologi Sains Data FTMM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Fakultas Teknologi Maju dan Multidisiplin · Universitas Airlangga
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-md transition-shadow">
    <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-primary mb-4">
      {icon}
    </div>
    <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const WorkflowStep = ({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) => (
  <div className="flex gap-4 items-start">
    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
      <span className="text-primary-foreground font-bold">{number}</span>
    </div>
    <div className="pt-1">
      <h4 className="font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default LandingPage;
