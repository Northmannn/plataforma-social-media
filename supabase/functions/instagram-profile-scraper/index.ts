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

// Re-export for use by other functions
export { getUserApiKey, corsHeaders };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    
    if (!username) {
      throw new Error('Username é obrigatório');
    }

    const APIFY_API_KEY = await getUserApiKey(req, 'apify_api_key');

    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY não configurada. Configure em Configurações.');
    }

    console.log(`Buscando dados do perfil: ${username}`);

    const apifyResponse = await fetch(
      'https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=' + APIFY_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] }),
      }
    );

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('Erro da API Apify:', apifyResponse.status, errorText);
      throw new Error(`Erro ao buscar dados do perfil: ${apifyResponse.status}`);
    }

    const data = await apifyResponse.json();
    
    if (!data || data.length === 0) {
      throw new Error('Perfil não encontrado ou dados indisponíveis');
    }

    const profileData = data[0];
    
    const mappedData = {
      username: profileData.username || username,
      display_name: profileData.fullName || null,
      bio: profileData.biography || null,
      follower_count: profileData.followersCount || null,
      following_count: profileData.followsCount || null,
      post_count: profileData.postsCount || null,
      profile_picture_url: profileData.profilePicUrl || null,
      is_verified: profileData.isVerified || false,
    };

    return new Response(JSON.stringify(mappedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar perfil' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
