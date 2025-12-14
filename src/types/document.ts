export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'image';
  size: number;
  file: File;
}

export interface SimilarityResult {
  doc1: string;
  doc2: string;
  scores: {
    // Statistical
    tfidfCosine: number;
    jaccard: number;
    // Textual
    levenshtein: number;
    jaroWinkler: number;
    // Semantic
    miniLM: number;
    mpnet: number;
    multilingualMpnet: number;
  };
}

export type SimilarityMethod = 
  | 'tfidfCosine' 
  | 'jaccard' 
  | 'levenshtein' 
  | 'jaroWinkler' 
  | 'miniLM' 
  | 'mpnet' 
  | 'multilingualMpnet';

export interface MethodInfo {
  key: SimilarityMethod;
  label: string;
  category: 'statistical' | 'textual' | 'semantic';
  description: string;
}

export const SIMILARITY_METHODS: MethodInfo[] = [
  // Statistical
  { key: 'tfidfCosine', label: 'TF-IDF Cosine', category: 'statistical', description: 'Term frequency-inverse document frequency with cosine similarity' },
  { key: 'jaccard', label: 'Jaccard', category: 'statistical', description: 'Intersection over union of word sets' },
  // Textual
  { key: 'levenshtein', label: 'Levenshtein', category: 'textual', description: 'Edit distance normalized to similarity score' },
  { key: 'jaroWinkler', label: 'Jaro-Winkler', category: 'textual', description: 'String similarity favoring common prefixes' },
  // Semantic
  { key: 'miniLM', label: 'MiniLM', category: 'semantic', description: 'Lightweight transformer embeddings' },
  { key: 'mpnet', label: 'MPNet', category: 'semantic', description: 'Masked and permuted pre-training embeddings' },
  { key: 'multilingualMpnet', label: 'Multilingual MPNet', category: 'semantic', description: 'Cross-lingual semantic embeddings' },
];
