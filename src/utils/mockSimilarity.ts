import { SimilarityResult, UploadedDocument } from "@/types/document";

// Simulated similarity computation
// In production, this would connect to a backend service
export const computeSimilarity = async (
  documents: UploadedDocument[]
): Promise<SimilarityResult[]> => {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const results: SimilarityResult[] = [];

  // Generate pairs
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const doc1 = documents[i];
      const doc2 = documents[j];

      // Generate realistic-looking mock scores
      // Scores are correlated (semantic methods tend to agree)
      const baseScore = 0.3 + Math.random() * 0.5;
      const variance = () => (Math.random() - 0.5) * 0.2;

      results.push({
        doc1: doc1.name,
        doc2: doc2.name,
        scores: {
          tfidfCosine: Math.max(0, Math.min(1, baseScore + variance())),
          jaccard: Math.max(0, Math.min(1, baseScore * 0.8 + variance())),
          levenshtein: Math.max(0, Math.min(1, baseScore * 0.6 + variance())),
          jaroWinkler: Math.max(0, Math.min(1, baseScore * 0.7 + variance())),
          miniLM: Math.max(0, Math.min(1, baseScore + variance())),
          mpnet: Math.max(0, Math.min(1, baseScore + variance() * 0.8)),
          multilingualMpnet: Math.max(0, Math.min(1, baseScore + variance() * 0.9)),
        },
      });
    }
  }

  return results;
};
