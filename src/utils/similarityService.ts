import { SimilarityResult, UploadedDocument } from "@/types/document";
 

// TODO: This service will call the Python backend for similarity analysis
// The actual algorithm is implemented in python/document_checker.py

interface AnalysisResponse {
  tfidf_cosine: number[][];
  jaccard: number[][];
  levenshtein: number[][];
  jaro_winkler: number[][];
  embedding: {
    MiniLM?: number[][];
    MPNet?: number[][];
    Multi_MPNet?: number[][];
    [key: string]: number[][] | undefined;
  };
}

export const computeSimilarity = async (
  documents: UploadedDocument[]
): Promise<SimilarityResult[]> => {
  // Extract text from all documents
  console.log("Extracting text from documents...");
  
  console.log("Sending to analysis function...");
  
  // TODO: Replace with call to Python backend
  // The edge function will forward to your Python service
  const apiBaseUrl = (import.meta as any).env?.VITE_PY_API_URL || "http://127.0.0.1:8000";
  const formData = new FormData();
  for (const doc of documents) {
    formData.append("files", doc.file, doc.name);
  }

  const response = await fetch(`${apiBaseUrl}/api/check-similarity`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail: any = null;
    try {
      detail = await response.json();
    } catch {
      detail = null;
    }
    const message = typeof detail?.detail === "string" ? detail.detail : `HTTP ${response.status}`;
    throw new Error(message);
  }

  const data = (await response.json()) as AnalysisResponse;
  
  console.log("Analysis complete, formatting results...");
  
  // Convert matrix results to pair results
  const results: SimilarityResult[] = [];
  const names = documents.map((d) => d.name);
  const n = names.length;
  const miniLM = data.embedding?.MiniLM;
  const mpnet = data.embedding?.MPNet;
  const multilingualMpnet = data.embedding?.Multi_MPNet;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      results.push({
        doc1: names[i],
        doc2: names[j],
        scores: {
          tfidfCosine: data.tfidf_cosine[i][j],
          jaccard: data.jaccard[i][j],
          levenshtein: data.levenshtein[i][j],
          jaroWinkler: data.jaro_winkler[i][j],
          miniLM: miniLM?.[i]?.[j] ?? 0,
          mpnet: mpnet?.[i]?.[j] ?? 0,
          multilingualMpnet: multilingualMpnet?.[i]?.[j] ?? 0,
        },
      });
    }
  }
  
  return results;
};
