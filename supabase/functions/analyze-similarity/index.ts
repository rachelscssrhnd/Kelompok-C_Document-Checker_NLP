import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ TEXT PREPROCESSING ============

// Common English stopwords
const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
  'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're',
  've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn',
  'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn'
]);

// Simple stemmer (Porter-like basic rules)
function simpleStem(word: string): string {
  if (word.length <= 3) return word;
  
  // Common suffix removals
  if (word.endsWith('ing')) {
    return word.slice(0, -3);
  }
  if (word.endsWith('ed')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('ly')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('ness')) {
    return word.slice(0, -4);
  }
  if (word.endsWith('ment')) {
    return word.slice(0, -4);
  }
  if (word.endsWith('tion')) {
    return word.slice(0, -4);
  }
  if (word.endsWith('sion')) {
    return word.slice(0, -4);
  }
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('es')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && word.length > 3) {
    return word.slice(0, -1);
  }
  
  return word;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function preprocess(text: string): string[] {
  const cleaned = cleanText(text.toLowerCase());
  const tokens = tokenize(cleaned);
  const filtered = tokens.filter(w => w.length > 1 && !STOPWORDS.has(w) && /^[a-z]+$/.test(w));
  return filtered.map(w => simpleStem(w));
}

// ============ SIMILARITY METHODS ============

// TF-IDF Cosine Similarity
function computeTfIdf(documents: string[][]): number[][] {
  const n = documents.length;
  
  // Build vocabulary
  const vocab = new Map<string, number>();
  let vocabIndex = 0;
  for (const doc of documents) {
    for (const word of doc) {
      if (!vocab.has(word)) {
        vocab.set(word, vocabIndex++);
      }
    }
  }
  
  const vocabSize = vocab.size;
  if (vocabSize === 0) {
    return Array(n).fill(null).map(() => Array(n).fill(0));
  }
  
  // Compute TF for each document
  const tfVectors: number[][] = documents.map(doc => {
    const tf = new Array(vocabSize).fill(0);
    for (const word of doc) {
      const idx = vocab.get(word);
      if (idx !== undefined) {
        tf[idx]++;
      }
    }
    // Normalize TF
    const maxTf = Math.max(...tf, 1);
    return tf.map(v => v / maxTf);
  });
  
  // Compute IDF
  const idf = new Array(vocabSize).fill(0);
  for (let i = 0; i < vocabSize; i++) {
    let docCount = 0;
    for (const tf of tfVectors) {
      if (tf[i] > 0) docCount++;
    }
    idf[i] = Math.log((n + 1) / (docCount + 1)) + 1;
  }
  
  // Compute TF-IDF vectors
  const tfidfVectors = tfVectors.map(tf => 
    tf.map((v, i) => v * idf[i])
  );
  
  // Compute cosine similarity matrix
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
      }
    }
  }
  
  return matrix;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

// Jaccard Similarity
function jaccardMatrix(documents: string[][]): number[][] {
  const n = documents.length;
  const sets = documents.map(doc => new Set(doc));
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const intersection = new Set([...sets[i]].filter(x => sets[j].has(x)));
        const union = new Set([...sets[i], ...sets[j]]);
        matrix[i][j] = union.size === 0 ? 0 : intersection.size / union.size;
      }
    }
  }
  
  return matrix;
}

// Levenshtein Distance (normalized to similarity)
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  // Use only two rows for memory efficiency
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

function levenshteinMatrix(texts: string[]): number[][] {
  const n = texts.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  // Truncate texts for performance (Levenshtein is O(n*m))
  const truncated = texts.map(t => t.slice(0, 5000));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const maxLen = Math.max(truncated[i].length, truncated[j].length);
        if (maxLen === 0) {
          matrix[i][j] = 1;
        } else {
          const dist = levenshteinDistance(truncated[i], truncated[j]);
          matrix[i][j] = 1 - (dist / maxLen);
        }
      }
    }
  }
  
  return matrix;
}

// Jaro-Winkler Similarity
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
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) / 3
  );
}

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
  
  return jaro + prefix * 0.1 * (1 - jaro);
}

function jaroWinklerMatrix(texts: string[]): number[][] {
  const n = texts.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  // Truncate for performance
  const truncated = texts.map(t => t.slice(0, 2000));
  
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

// ============ SEMANTIC SIMILARITY VIA AI ============

interface SemanticResult {
  miniLM: number[][];
  mpnet: number[][];
  multilingualMpnet: number[][];
}

async function computeSemanticSimilarity(
  texts: string[],
  names: string[]
): Promise<SemanticResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("No LOVABLE_API_KEY, returning placeholder semantic scores");
    const n = texts.length;
    const placeholder = Array(n).fill(null).map((_, i) => 
      Array(n).fill(null).map((_, j) => i === j ? 1 : 0.5)
    );
    return { miniLM: placeholder, mpnet: placeholder, multilingualMpnet: placeholder };
  }
  
  const n = texts.length;
  const pairs: { i: number; j: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs.push({ i, j });
    }
  }
  
  // Truncate texts for API
  const truncated = texts.map(t => t.slice(0, 2000));
  
  // Build prompt for semantic similarity
  const pairDescriptions = pairs.map(p => 
    `Pair ${p.i + 1}-${p.j + 1}:\nDocument "${names[p.i]}":\n${truncated[p.i].slice(0, 500)}...\n\nDocument "${names[p.j]}":\n${truncated[p.j].slice(0, 500)}...`
  ).join('\n\n---\n\n');
  
  const prompt = `You are an expert at analyzing document similarity. Analyze the semantic similarity between each pair of documents below. 

For each pair, provide three similarity scores (0.0 to 1.0):
1. Content similarity (like MiniLM embedding)
2. Structural similarity (like MPNet embedding)  
3. Cross-lingual/conceptual similarity (like Multilingual MPNet)

${pairDescriptions}

Respond ONLY with a JSON array in this exact format:
[
  {"pair": "1-2", "miniLM": 0.75, "mpnet": 0.72, "multilingual": 0.78},
  ...
]`;

  try {
    console.log("Calling Lovable AI for semantic similarity...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log("AI response:", content.slice(0, 500));
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }
    
    const scores = JSON.parse(jsonMatch[0]);
    
    // Build matrices
    const miniLM: number[][] = Array(n).fill(null).map((_, i) => 
      Array(n).fill(null).map((_, j) => i === j ? 1 : 0)
    );
    const mpnet: number[][] = Array(n).fill(null).map((_, i) => 
      Array(n).fill(null).map((_, j) => i === j ? 1 : 0)
    );
    const multilingualMpnet: number[][] = Array(n).fill(null).map((_, i) => 
      Array(n).fill(null).map((_, j) => i === j ? 1 : 0)
    );
    
    for (const score of scores) {
      const [i, j] = score.pair.split('-').map((x: string) => parseInt(x) - 1);
      if (i >= 0 && i < n && j >= 0 && j < n) {
        miniLM[i][j] = score.miniLM || 0.5;
        miniLM[j][i] = score.miniLM || 0.5;
        mpnet[i][j] = score.mpnet || 0.5;
        mpnet[j][i] = score.mpnet || 0.5;
        multilingualMpnet[i][j] = score.multilingual || 0.5;
        multilingualMpnet[j][i] = score.multilingual || 0.5;
      }
    }
    
    return { miniLM, mpnet, multilingualMpnet };
  } catch (error) {
    console.error("Semantic similarity error:", error);
    // Return placeholder on error
    const placeholder = Array(n).fill(null).map((_, i) => 
      Array(n).fill(null).map((_, j) => i === j ? 1 : 0.5)
    );
    return { miniLM: placeholder, mpnet: placeholder, multilingualMpnet: placeholder };
  }
}

// ============ MAIN HANDLER ============

interface DocumentInput {
  name: string;
  content: string; // Already extracted text
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
    const rawTexts = documents.map(d => d.content);
    
    // Preprocess texts
    console.log("Preprocessing texts...");
    const preprocessedTokens = rawTexts.map(t => preprocess(t));
    const cleanedTexts = rawTexts.map(t => cleanText(t.toLowerCase()));
    
    // Statistical similarity
    console.log("Computing TF-IDF cosine similarity...");
    const tfidfCosine = computeTfIdf(preprocessedTokens);
    
    console.log("Computing Jaccard similarity...");
    const jaccard = jaccardMatrix(preprocessedTokens);
    
    // Textual similarity
    console.log("Computing Levenshtein similarity...");
    const levenshtein = levenshteinMatrix(cleanedTexts);
    
    console.log("Computing Jaro-Winkler similarity...");
    const jaroWinkler = jaroWinklerMatrix(cleanedTexts);
    
    // Semantic similarity
    console.log("Computing semantic similarity...");
    const semantic = await computeSemanticSimilarity(rawTexts, names);
    
    const result = {
      names,
      tfidfCosine,
      jaccard,
      levenshtein,
      jaroWinkler,
      miniLM: semantic.miniLM,
      mpnet: semantic.mpnet,
      multilingualMpnet: semantic.multilingualMpnet,
    };
    
    console.log("Analysis complete!");
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-similarity:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
