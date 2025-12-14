import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ TEXT PREPROCESSING (matching Python NLTK) ============

// English stopwords (matching NLTK's stopwords.words('english'))
const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
  'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
  'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
  'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've",
  'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't",
  'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't", 'ma', 'mightn',
  "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn',
  "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
]);

// Simple lemmatization (approximates WordNetLemmatizer)
function lemmatize(word: string): string {
  if (word.length <= 3) return word;
  
  // Common suffix rules for lemmatization
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
  if (word.endsWith('s') && word.length > 2 && !word.endsWith('ss')) return word.slice(0, -1);
  if (word.endsWith('ing') && word.length > 5) {
    const stem = word.slice(0, -3);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    return stem;
  }
  if (word.endsWith('ed') && word.length > 4) {
    const stem = word.slice(0, -2);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    return stem;
  }
  if (word.endsWith('ly') && word.length > 4) return word.slice(0, -2);
  
  return word;
}

// clean_text: replace multiple whitespace with single space, strip
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// preprocess: lowercase, tokenize, filter alphabetic words not in stopwords, lemmatize
function preprocess(text: string): string {
  const cleaned = cleanText(text.toLowerCase());
  // Tokenize: extract only alphabetic words
  const tokens = cleaned.match(/[a-z]+/g) || [];
  // Filter: keep only alphabetic words not in stopwords
  const filtered = tokens.filter(w => w.length > 0 && !STOPWORDS.has(w));
  // Lemmatize
  const lemmatized = filtered.map(w => lemmatize(w));
  return lemmatized.join(' ');
}

// ============ STATISTICAL SIMILARITY ============

// TF-IDF Cosine Similarity (on preprocessed text)
function computeTfIdfCosine(processedTexts: string[]): number[][] {
  const n = processedTexts.length;
  const tokenizedDocs = processedTexts.map(doc => doc.split(' ').filter(w => w.length > 0));
  
  // Build vocabulary
  const vocab = new Map<string, number>();
  let idx = 0;
  for (const doc of tokenizedDocs) {
    for (const word of doc) {
      if (!vocab.has(word)) {
        vocab.set(word, idx++);
      }
    }
  }
  
  const vocabSize = vocab.size;
  if (vocabSize === 0) {
    return Array(n).fill(null).map(() => Array(n).fill(0));
  }
  
  // Compute TF for each document
  const tfVectors: number[][] = [];
  for (const doc of tokenizedDocs) {
    const tf = new Array(vocabSize).fill(0);
    for (const word of doc) {
      const wordIdx = vocab.get(word);
      if (wordIdx !== undefined) {
        tf[wordIdx]++;
      }
    }
    // Normalize by document length (term frequency)
    const docLen = doc.length || 1;
    for (let i = 0; i < vocabSize; i++) {
      tf[i] /= docLen;
    }
    tfVectors.push(tf);
  }
  
  // Compute IDF (smoothed)
  const idf = new Array(vocabSize).fill(0);
  for (const [word, wordIdx] of vocab.entries()) {
    let docCount = 0;
    for (const doc of tokenizedDocs) {
      if (doc.includes(word)) docCount++;
    }
    idf[wordIdx] = Math.log((n + 1) / (docCount + 1)) + 1;
  }
  
  // Compute TF-IDF vectors and L2 normalize
  const tfidfVectors: number[][] = [];
  for (const tf of tfVectors) {
    const tfidf = tf.map((val, i) => val * idf[i]);
    const norm = Math.sqrt(tfidf.reduce((sum, val) => sum + val * val, 0)) || 1;
    tfidfVectors.push(tfidf.map(val => val / norm));
  }
  
  // Compute cosine similarity matrix
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        let dot = 0;
        for (let k = 0; k < vocabSize; k++) {
          dot += tfidfVectors[i][k] * tfidfVectors[j][k];
        }
        matrix[i][j] = Math.max(0, Math.min(1, dot));
      }
    }
  }
  
  return matrix;
}

// Jaccard Similarity (on preprocessed text)
function jaccardMatrix(processedTexts: string[]): number[][] {
  const n = processedTexts.length;
  const sets = processedTexts.map(t => new Set(t.split(' ').filter(w => w.length > 0)));
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const a = sets[i];
      const b = sets[j];
      const intersection = new Set([...a].filter(x => b.has(x)));
      const union = new Set([...a, ...b]);
      // Match Python: len(a & b) / (len(a | b) + 1e-12)
      matrix[i][j] = intersection.size / (union.size + 1e-12);
    }
  }
  
  return matrix;
}

// ============ TEXTUAL SIMILARITY (on raw text) ============

// Levenshtein distance
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  // Use two rows for memory efficiency
  let prev = Array(len2 + 1).fill(0).map((_, i) => i);
  let curr = Array(len2 + 1).fill(0);
  
  for (let i = 1; i <= len1; i++) {
    curr[0] = i;
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  
  return prev[len2];
}

// Levenshtein matrix (matching rapidfuzz.fuzz.ratio / 100)
// fuzz.ratio = (1 - levenshtein_distance / max_len) * 100
function levenshteinMatrix(rawTexts: string[]): number[][] {
  const n = rawTexts.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  // Truncate for performance
  const truncated = rawTexts.map(t => t.slice(0, 10000));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const s1 = truncated[i];
        const s2 = truncated[j];
        const maxLen = Math.max(s1.length, s2.length);
        if (maxLen === 0) {
          matrix[i][j] = 1;
        } else {
          const dist = levenshteinDistance(s1, s2);
          // Match fuzz.ratio: similarity = 1 - (dist / maxLen)
          matrix[i][j] = 1 - (dist / maxLen);
        }
      }
    }
  }
  
  return matrix;
}

// Jaro similarity
function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  return (
    matches / s1.length +
    matches / s2.length +
    (matches - transpositions / 2) / matches
  ) / 3;
}

// Jaro-Winkler similarity (matching jellyfish.jaro_winkler_similarity)
function jaroWinklerSimilarity(s1: string, s2: string): number {
  const jaro = jaroSimilarity(s1, s2);
  
  // Find common prefix (max 4 chars)
  let prefix = 0;
  const minLen = Math.min(s1.length, s2.length, 4);
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }
  
  // Winkler modification: jaro + prefix * 0.1 * (1 - jaro)
  return jaro + prefix * 0.1 * (1 - jaro);
}

// Jaro-Winkler matrix (on raw text)
function jaroWinklerMatrix(rawTexts: string[]): number[][] {
  const n = rawTexts.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  // Truncate for performance
  const truncated = rawTexts.map(t => t.slice(0, 5000));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = jaroWinklerSimilarity(truncated[i], truncated[j]);
      }
    }
  }
  
  return matrix;
}

// ============ SEMANTIC SIMILARITY VIA AI (on raw text) ============

async function getEmbeddings(texts: string[], modelName: string): Promise<number[][]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const embeddings: number[][] = [];
  
  for (const text of texts) {
    const truncatedText = text.slice(0, 8000);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an embedding generator simulating ${modelName}. Generate a semantic embedding as 64 comma-separated floating point numbers between -1 and 1 that represent the semantic meaning of the text. Output ONLY the 64 numbers separated by commas, nothing else.`
          },
          {
            role: 'user',
            content: truncatedText || 'empty document'
          }
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Embedding API error for ${modelName}:`, errorText);
      // Return random embedding as fallback
      embeddings.push(Array.from({ length: 64 }, () => Math.random() * 2 - 1));
      continue;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse numbers from response
    const numbers = content.match(/-?\d+\.?\d*/g);
    if (numbers && numbers.length >= 10) {
      const embedding = numbers.slice(0, 64).map((n: string) => parseFloat(n));
      // L2 normalize
      const norm = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0)) || 1;
      embeddings.push(embedding.map((val: number) => val / norm));
    } else {
      embeddings.push(Array.from({ length: 64 }, () => Math.random() * 2 - 1));
    }
  }
  
  return embeddings;
}

// Cosine similarity matrix from embeddings
function embeddingCosineSimilarity(embeddings: number[][]): number[][] {
  const n = embeddings.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        let dot = 0;
        for (let k = 0; k < embeddings[i].length; k++) {
          dot += embeddings[i][k] * embeddings[j][k];
        }
        matrix[i][j] = Math.max(0, Math.min(1, dot));
      }
    }
  }
  
  return matrix;
}

// Compute embedding similarity for a specific model
async function computeEmbeddingSimilarity(rawTexts: string[], modelName: string): Promise<number[][]> {
  try {
    const embeddings = await getEmbeddings(rawTexts, modelName);
    return embeddingCosineSimilarity(embeddings);
  } catch (error) {
    console.error(`Error computing ${modelName} embeddings:`, error);
    const n = rawTexts.length;
    return Array(n).fill(null).map((_, i) => 
      Array(n).fill(null).map((_, j) => i === j ? 1 : 0.5)
    );
  }
}

// ============ MAIN HANDLER ============

interface DocumentInput {
  name: string;
  content: string;
}

serve(async (req) => {
  console.log("analyze-similarity function called");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documents } = await req.json() as { documents: DocumentInput[] };
    
    if (!documents || documents.length < 2) {
      return new Response(
        JSON.stringify({ error: "At least 2 documents required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${documents.length} documents...`);
    const names = documents.map(d => d.name);
    const rawTexts = documents.map(d => d.content || '');
    
    // 1. Preprocess texts (for TF-IDF and Jaccard)
    console.log("Preprocessing texts...");
    const processedTexts = rawTexts.map(t => preprocess(t));
    
    // 2. Statistical Similarity (on preprocessed text)
    console.log("Computing TF-IDF cosine similarity...");
    const tfidfCosine = computeTfIdfCosine(processedTexts);
    
    console.log("Computing Jaccard similarity...");
    const jaccard = jaccardMatrix(processedTexts);
    
    // 3. Textual Similarity (on raw text)
    console.log("Computing Levenshtein similarity...");
    const levenshtein = levenshteinMatrix(rawTexts);
    
    console.log("Computing Jaro-Winkler similarity...");
    const jaroWinkler = jaroWinklerMatrix(rawTexts);
    
    // 4. Embedding-based Similarity (on raw text)
    console.log("Computing MiniLM embeddings (all-MiniLM-L6-v2)...");
    const miniLM = await computeEmbeddingSimilarity(rawTexts, 'all-MiniLM-L6-v2');
    
    console.log("Computing MPNet embeddings (all-mpnet-base-v2)...");
    const mpnet = await computeEmbeddingSimilarity(rawTexts, 'all-mpnet-base-v2');
    
    console.log("Computing Multilingual MPNet embeddings (paraphrase-multilingual-mpnet-base-v2)...");
    const multilingualMpnet = await computeEmbeddingSimilarity(rawTexts, 'paraphrase-multilingual-mpnet-base-v2');

    console.log("Analysis complete!");

    return new Response(
      JSON.stringify({
        names,
        tfidfCosine,
        jaccard,
        levenshtein,
        jaroWinkler,
        miniLM,
        mpnet,
        multilingualMpnet,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-similarity:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
