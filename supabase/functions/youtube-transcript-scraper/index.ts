import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAuthUser(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  try {
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

async function getUserApiKey(req: Request, settingKey: string): Promise<string | null> {
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

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchYouTubeTranscriptViaApify(videoUrl: string, apifyKey: string) {
  console.log(`🚀 Iniciando extração via Apify para: ${videoUrl}`);
  
  try {
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/faVsWy9VTSNVIhWpR/runs?token=${apifyKey}&waitForFinish=120`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      }
    );

    if (!runResponse.ok) {
      const text = await runResponse.text();
      console.error(`❌ Erro ao iniciar Actor Apify: ${runResponse.status}`, text);
      throw new Error(`Falha ao iniciar Actor Apify: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const datasetId = runData.data?.defaultDatasetId || runData.defaultDatasetId;
    if (!datasetId) {
      return { title: 'Erro ao processar vídeo', channelName: 'Canal não disponível', transcript: '', duration: null };
    }

    const itemsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyKey}`
    );

    if (!itemsResponse.ok) {
      throw new Error(`Falha ao buscar items do dataset: ${itemsResponse.status}`);
    }

    const items = await itemsResponse.json();

    if (!items || items.length === 0) {
      return { title: 'Vídeo não disponível', channelName: 'Canal não disponível', transcript: '', duration: null };
    }

    const videoData: any = items[0];
    
    let transcript = '';
    if (Array.isArray(videoData.data)) {
      transcript = videoData.data.map((s: any) => s?.text || '').filter(Boolean).join(' ');
    } else {
      transcript = videoData.transcript || videoData.text || videoData.fullText || '';
    }
    
    let duration = videoData.duration || null;
    if (!duration && Array.isArray(videoData.data) && videoData.data.length > 0) {
      const first = videoData.data[0];
      const last = videoData.data[videoData.data.length - 1];
      const start = parseFloat(first.start || '0');
      const end = parseFloat(last.start || '0') + parseFloat(last.dur || '0');
      if (!isNaN(start) && !isNaN(end) && end > start) {
        duration = `${Math.round(end - start)}s`;
      }
    }

    return {
      title: videoData.title || 'Título não disponível',
      channelName: videoData.channelName || videoData.channel || videoData.channelTitle || 'Canal não disponível',
      transcript,
      duration,
    };
  } catch (error: any) {
    console.error(`❌ Erro ao processar vídeo via Apify:`, error);
    return { title: 'Erro ao processar vídeo', channelName: 'Canal não disponível', transcript: '', duration: null };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    
    if (!videoUrl) {
      throw new Error('URL do vídeo é obrigatória');
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('URL do YouTube inválida');
    }

    const user = await getAuthUser(req);
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const APIFY_API_KEY = await getUserApiKey(req, 'apify_api_key');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY não configurada. Configure em Configurações.');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check existing video for THIS user
    const { data: existingVideo } = await supabase
      .from('youtube_videos')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVideo) {
      return new Response(
        JSON.stringify({ success: true, data: existingVideo, message: 'Vídeo já transcrito anteriormente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const transcriptData = await fetchYouTubeTranscriptViaApify(videoUrl, APIFY_API_KEY);
    const hasTranscript = transcriptData.transcript && transcriptData.transcript.trim().length > 0;

    const { data: savedVideo, error: saveError } = await supabase
      .from('youtube_videos')
      .insert({
        url: videoUrl,
        video_id: videoId,
        title: transcriptData.title || null,
        channel_name: transcriptData.channelName || null,
        transcript: transcriptData.transcript || '',
        duration: transcriptData.duration || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({
        success: true,
        data: savedVideo,
        message: hasTranscript ? 'Transcrição extraída com sucesso' : 'Vídeo salvo, mas não possui transcrição disponível',
        warning: hasTranscript ? null : 'Este vídeo não possui legendas/transcrição disponível'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro na função:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido ao processar vídeo' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
