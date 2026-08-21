import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getUserApiKey(req: Request, settingKey: string): Promise<string | null> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  try {
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    
    if (user) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data } = await supabase.rpc('get_decrypted_setting', {
        p_user_id: user.id,
        p_key: settingKey,
      });
      
      if (data) {
        console.log(`Using user-encrypted ${settingKey}`);
        return data;
      }
    }
  } catch (e) {
    console.warn(`Failed to read user secret ${settingKey}:`, e);
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, videoUrl } = await req.json();

    if (!postId || !videoUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing postId or videoUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const APIFY_API_KEY = await getUserApiKey(req, 'apify_api_key');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY não configurada. Configure em Configurações.');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting Apify Video Transcriber Ultimate for:', videoUrl);

    // Run the Apify Video Transcriber Ultimate actor
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/marielise.dev~video-transcriber-ultimate/runs?token=${APIFY_API_KEY}&waitForFinish=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoUrl,
          language: 'auto',
          includeTimestamps: false,
          outputFormat: 'text',
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run error:', runResponse.status, errorText);
      throw new Error(`Erro ao iniciar transcrição Apify: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const datasetId = runData.data?.defaultDatasetId;

    if (!datasetId) {
      console.error('No dataset ID returned from Apify run');
      throw new Error('Falha ao obter resultado da transcrição');
    }

    console.log('Apify run completed, fetching dataset:', datasetId);

    // Fetch transcription results from dataset
    const itemsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
    );

    if (!itemsResponse.ok) {
      const errorText = await itemsResponse.text();
      console.error('Dataset fetch error:', itemsResponse.status, errorText);
      throw new Error(`Erro ao buscar resultado da transcrição: ${itemsResponse.status}`);
    }

    const items = await itemsResponse.json();

    if (!items || items.length === 0) {
      throw new Error('Nenhuma transcrição retornada. O vídeo pode não ter áudio ou estar indisponível.');
    }

    const result = items[0];
    const transcription = result.text || result.transcript || result.fullText || '';

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('Transcrição vazia. O vídeo pode não ter áudio falado.');
    }

    console.log('Transcription received, length:', transcription.length);

    // Save transcription to database
    const { error: updateError } = await supabase
      .from('instagram_posts')
      .update({
        ai_video_transcription: transcription,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Error updating post:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, transcription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in transcribe-video:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
