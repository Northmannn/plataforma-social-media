import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAuthUser(req: Request): Promise<{ id: string } | null> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
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
    const { username, limit = 12, saveToDatabase = false } = await req.json();
    
    if (!username) {
      throw new Error('Username é obrigatório');
    }

    const user = await getAuthUser(req);
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const APIFY_API_KEY = await getUserApiKey(req, 'apify_api_key');

    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY não configurada. Configure em Configurações.');
    }

    console.log(`Buscando posts do perfil: ${username}`);

    const apifyResponse = await fetch(
      'https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items?token=' + APIFY_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: [username], resultsLimit: limit }),
      }
    );

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('Erro da API Apify:', apifyResponse.status, errorText);
      throw new Error(`Erro ao buscar posts: ${apifyResponse.status}`);
    }

    const data = await apifyResponse.json();
    
    console.log('Posts encontrados:', data.length);
    
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ posts: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    const posts = data.map((post: any) => ({
      id: post.id,
      shortCode: post.shortCode,
      type: post.type,
      caption: post.caption || '',
      url: post.url,
      displayUrl: post.displayUrl,
      videoUrl: post.videoUrl || null,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      videoViewCount: post.videoViewCount || 0,
      videoPlayCount: post.videoPlayCount || 0,
      timestamp: post.timestamp,
      hashtags: post.hashtags || [],
      mentions: post.mentions || [],
    }));

    let savedCount = 0;
    let updatedCount = 0;

    if (saveToDatabase) {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: profile, error: profileError } = await supabase
        .from('instagram_profiles')
        .select('id')
        .eq('username', username)
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil não encontrado no banco de dados');
      }

      for (const post of posts) {
        const { error: upsertError } = await supabase
          .from('instagram_posts')
          .upsert({
            profile_id: profile.id,
            short_code: post.shortCode,
            post_type: post.type,
            caption: post.caption,
            url: post.url,
            display_url: post.displayUrl,
            video_url: post.videoUrl,
            likes_count: post.likesCount,
            comments_count: post.commentsCount,
            video_view_count: post.videoViewCount,
            video_play_count: post.videoPlayCount,
            timestamp: post.timestamp,
            hashtags: post.hashtags,
            mentions: post.mentions,
            user_id: user.id,
          }, { onConflict: 'profile_id,short_code', ignoreDuplicates: false });

        if (upsertError) {
          console.error('Erro ao salvar post:', upsertError);
          updatedCount++;
        } else {
          savedCount++;
        }
      }

      await supabase
        .from('instagram_profiles')
        .update({ posts_last_synced_at: new Date().toISOString() })
        .eq('id', profile.id);
    }

    return new Response(
      JSON.stringify({ posts, saved: saveToDatabase, savedCount, updatedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar posts' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
