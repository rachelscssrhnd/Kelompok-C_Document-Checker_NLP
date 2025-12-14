import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODO: Integrate with Python backend for similarity analysis
// This is a placeholder - the actual logic will be handled by external Python service

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
    
    console.log(`Received ${documents.length} documents for analysis`);
    const names = documents.map(d => d.name);
    
    // TODO: Call Python backend here
    // Replace this placeholder with actual Python backend call
    
    return new Response(
      JSON.stringify({ 
        error: "Python backend not yet integrated. Please configure the Python service URL.",
        names,
        documentCount: documents.length
      }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze-similarity:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
