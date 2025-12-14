import { SimilarityResult, UploadedDocument } from "@/types/document";
import { extractTextFromFile } from "./textExtraction";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResponse {
  names: string[];
  tfidfCosine: number[][];
  jaccard: number[][];
  levenshtein: number[][];
  jaroWinkler: number[][];
  miniLM: number[][];
  mpnet: number[][];
  multilingualMpnet: number[][];
}

export const computeSimilarity = async (
  documents: UploadedDocument[]
): Promise<SimilarityResult[]> => {
  // Extract text from all documents
  console.log("Extracting text from documents...");
  const extractedTexts = await Promise.all(
    documents.map(async (doc) => ({
      name: doc.name,
      content: await extractTextFromFile(doc),
    }))
  );
  
  console.log("Sending to analysis function...");
  
  // Call the edge function
  const { data, error } = await supabase.functions.invoke<AnalysisResponse>('analyze-similarity', {
    body: { documents: extractedTexts },
  });
  
  if (error) {
    console.error("Edge function error:", error);
    throw new Error(error.message || "Failed to analyze documents");
  }
  
  if (!data) {
    throw new Error("No data returned from analysis");
  }
  
  console.log("Analysis complete, formatting results...");
  
  // Convert matrix results to pair results
  const results: SimilarityResult[] = [];
  const n = data.names.length;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      results.push({
        doc1: data.names[i],
        doc2: data.names[j],
        scores: {
          tfidfCosine: data.tfidfCosine[i][j],
          jaccard: data.jaccard[i][j],
          levenshtein: data.levenshtein[i][j],
          jaroWinkler: data.jaroWinkler[i][j],
          miniLM: data.miniLM[i][j],
          mpnet: data.mpnet[i][j],
          multilingualMpnet: data.multilingualMpnet[i][j],
        },
      });
    }
  }
  
  return results;
};
