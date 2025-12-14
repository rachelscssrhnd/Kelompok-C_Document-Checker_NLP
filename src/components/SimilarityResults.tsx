import { useMemo, useState } from "react";
import { SimilarityResult, SIMILARITY_METHODS, MethodInfo } from "@/types/document";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BarChart3, Type, Brain, Trophy } from "lucide-react";

interface SimilarityResultsProps {
  results: SimilarityResult[];
}

const getCategoryIcon = (category: MethodInfo['category']) => {
  switch (category) {
    case 'statistical':
      return <BarChart3 className="w-4 h-4" />;
    case 'textual':
      return <Type className="w-4 h-4" />;
    case 'semantic':
      return <Brain className="w-4 h-4" />;
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 0.8) return "bg-success/20 text-success border-success/30";
  if (score >= 0.6) return "bg-secondary/20 text-secondary border-secondary/30";
  if (score >= 0.4) return "bg-warning/20 text-warning border-warning/30";
  return "bg-muted text-muted-foreground border-muted";
};

const getHeatmapColor = (score: number): string => {
  if (score >= 0.9) return "bg-primary text-primary-foreground";
  if (score >= 0.8) return "bg-primary/80 text-primary-foreground";
  if (score >= 0.7) return "bg-secondary text-secondary-foreground";
  if (score >= 0.6) return "bg-secondary/70 text-secondary-foreground";
  if (score >= 0.5) return "bg-accent text-accent-foreground";
  if (score >= 0.4) return "bg-accent/70 text-accent-foreground";
  if (score >= 0.3) return "bg-muted text-muted-foreground";
  return "bg-muted/50 text-muted-foreground";
};

const SimilarityResults = ({ results }: SimilarityResultsProps) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'statistical' | 'textual' | 'semantic'>('all');

  const filteredMethods = useMemo(() => {
    if (activeCategory === 'all') return SIMILARITY_METHODS;
    return SIMILARITY_METHODS.filter((m) => m.category === activeCategory);
  }, [activeCategory]);

  const highestSimilarity = useMemo(() => {
    let highest = { pair: '', method: '', score: 0 };
    
    results.forEach((result) => {
      Object.entries(result.scores).forEach(([method, score]) => {
        if (score > highest.score) {
          highest = {
            pair: `${result.doc1} — ${result.doc2}`,
            method: SIMILARITY_METHODS.find((m) => m.key === method)?.label || method,
            score,
          };
        }
      });
    });
    
    return highest;
  }, [results]);

  if (results.length === 0) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Highest Similarity Banner */}
      <div className="p-4 rounded-lg border border-success/30 bg-success/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-success/20">
            <Trophy className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Highest Similarity Detected</h3>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{highestSimilarity.pair}</span>
              {" "} — {highestSimilarity.method}: {" "}
              <span className="font-semibold text-success">
                {(highestSimilarity.score * 100).toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all" className="text-sm">All Methods</TabsTrigger>
          <TabsTrigger value="statistical" className="text-sm">
            <BarChart3 className="w-3 h-3 mr-1.5" /> Statistical
          </TabsTrigger>
          <TabsTrigger value="textual" className="text-sm">
            <Type className="w-3 h-3 mr-1.5" /> Textual
          </TabsTrigger>
          <TabsTrigger value="semantic" className="text-sm">
            <Brain className="w-3 h-3 mr-1.5" /> Semantic
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-0">
          {/* Results Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    Document Pair
                  </th>
                  {filteredMethods.map((method) => (
                    <th
                      key={method.key}
                      className="px-3 py-3 text-center font-medium text-muted-foreground whitespace-nowrap"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{method.label}</span>
                        <Badge variant="outline" className="text-xs font-normal py-0">
                          {getCategoryIcon(method.category)}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={`${result.doc1}-${result.doc2}`}
                    className={cn(
                      "border-t border-border transition-colors",
                      index % 2 === 0 ? "bg-card" : "bg-muted/20"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {result.doc1} — {result.doc2}
                    </td>
                    {filteredMethods.map((method) => {
                      const score = result.scores[method.key];
                      const isHighest = 
                        score === highestSimilarity.score && 
                        `${result.doc1} — ${result.doc2}` === highestSimilarity.pair;
                      
                      return (
                        <td key={method.key} className="px-3 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded border text-xs font-medium transition-all",
                              getScoreColor(score),
                              isHighest && "ring-2 ring-success ring-offset-1"
                            )}
                          >
                            {(score * 100).toFixed(1)}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Heatmap Matrix */}
      <div className="space-y-3">
        <h3 className="font-medium text-foreground">Similarity Heatmap (TF-IDF Cosine)</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <HeatmapMatrix results={results} />
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-3 rounded-sm bg-muted/50" />
            <div className="w-4 h-3 rounded-sm bg-muted" />
            <div className="w-4 h-3 rounded-sm bg-accent/70" />
            <div className="w-4 h-3 rounded-sm bg-accent" />
            <div className="w-4 h-3 rounded-sm bg-secondary/70" />
            <div className="w-4 h-3 rounded-sm bg-secondary" />
            <div className="w-4 h-3 rounded-sm bg-primary/80" />
            <div className="w-4 h-3 rounded-sm bg-primary" />
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
};

const HeatmapMatrix = ({ results }: { results: SimilarityResult[] }) => {
  const documents = useMemo(() => {
    const docs = new Set<string>();
    results.forEach((r) => {
      docs.add(r.doc1);
      docs.add(r.doc2);
    });
    return Array.from(docs);
  }, [results]);

  const getScore = (doc1: string, doc2: string): number => {
    if (doc1 === doc2) return 1;
    const result = results.find(
      (r) => (r.doc1 === doc1 && r.doc2 === doc2) || (r.doc1 === doc2 && r.doc2 === doc1)
    );
    return result?.scores.tfidfCosine ?? 0;
  };

  return (
    <div className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(${documents.length}, 1fr)` }}>
      {/* Empty corner */}
      <div />
      {/* Column headers */}
      {documents.map((doc) => (
        <div key={`col-${doc}`} className="px-2 py-1 text-xs font-medium text-muted-foreground text-center truncate max-w-[100px]">
          {doc}
        </div>
      ))}
      {/* Rows */}
      {documents.map((rowDoc) => (
        <>
          <div key={`row-${rowDoc}`} className="px-2 py-1 text-xs font-medium text-muted-foreground truncate max-w-[100px]">
            {rowDoc}
          </div>
          {documents.map((colDoc) => {
            const score = getScore(rowDoc, colDoc);
            return (
              <div
                key={`${rowDoc}-${colDoc}`}
                className={cn(
                  "flex items-center justify-center h-10 rounded text-xs font-medium transition-all hover:ring-2 hover:ring-ring",
                  getHeatmapColor(score)
                )}
                title={`${rowDoc} — ${colDoc}: ${(score * 100).toFixed(1)}%`}
              >
                {(score * 100).toFixed(0)}%
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
};

export default SimilarityResults;
