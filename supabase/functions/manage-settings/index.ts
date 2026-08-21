import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-settings-type',
};

const ALLOWED_SECRET_KEYS = ['apify_api_key', 'openai_api_key', 'openrouter_api_key'];
const ALLOWED_SETTING_KEYS = [
  'model_profile_analysis', 'temp_profile_analysis',
  'model_chat_generation', 'temp_chat_generation',
  'model_content_generation', 'temp_content_generation',
  'model_creative_analysis', 'temp_creative_analysis',
  'model_youtube_analysis', 'temp_youtube_analysis',
];
const ALLOWED_PROMPT_KEYS = [
  'prompt_profile_analysis',
  'prompt_chat_video', 'prompt_chat_post', 'prompt_chat_idea', 'prompt_chat_generic',
  'prompt_gen_video', 'prompt_gen_post', 'prompt_gen_idea',
  'prompt_image_analysis',
  'prompt_youtube_analysis',
  'prompt_format_content',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const settingsType = req.headers.get('x-settings-type');

    // ========== GET ==========
    if (req.method === 'GET') {
      if (settingsType === 'prompts') {
        const { data: prompts, error } = await supabase
          .from('prompt_templates')
          .select('prompt_key, prompt_value, is_active, updated_at')
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ prompts: prompts || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get secrets (encrypted API keys)
      const { data: encryptedSettings, error: encError } = await supabase
        .rpc('list_encrypted_settings', { p_user_id: user.id });

      if (encError) {
        console.error('Encrypted settings error:', encError);
      }

      // Get non-secret settings (model/temp configs)
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('setting_key, setting_value, updated_at')
        .eq('user_id', user.id)
        .is('encrypted_value', null);

      if (settingsError) throw settingsError;

      const allSettings = [
        ...(encryptedSettings || []).map((s: any) => ({
          key: s.key,
          configured: true,
          masked_value: s.masked_value,
          updated_at: s.updated_at,
        })),
        ...(settings || []).map((s: any) => ({
          key: s.setting_key,
          configured: true,
          masked_value: s.setting_value,
          updated_at: s.updated_at,
        })),
      ];

      return new Response(JSON.stringify({ settings: allSettings }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== POST ==========
    if (req.method === 'POST') {
      const body = await req.json();

      // Handle delete via POST with action: 'delete'
      if (body.action === 'delete') {
        const { key } = body;
        if (!key) {
          return new Response(JSON.stringify({ error: 'key é obrigatório' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (body.type === 'prompt') {
          const { error } = await supabase
            .from('prompt_templates')
            .delete()
            .eq('user_id', user.id)
            .eq('prompt_key', key);
          if (error) throw error;
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Delete API key or setting
        const { error } = await supabase
          .from('user_settings')
          .delete()
          .eq('user_id', user.id)
          .eq('setting_key', key);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }


      if (body.type === 'prompt') {
        const { key, value } = body;
        if (!key || !value) {
          return new Response(JSON.stringify({ error: 'key e value são obrigatórios' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!ALLOWED_PROMPT_KEYS.includes(key)) {
          return new Response(JSON.stringify({ error: 'Prompt key não permitida' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('prompt_templates')
          .upsert({
            user_id: user.id,
            prompt_key: key,
            prompt_value: value,
            is_active: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,prompt_key' });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { key, value } = body;
      if (!key || !value) {
        return new Response(JSON.stringify({ error: 'key e value são obrigatórios' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // API keys go to encrypted storage (pgcrypto)
      if (ALLOWED_SECRET_KEYS.includes(key)) {
        if (value.length < 10 || value.length > 500) {
          return new Response(JSON.stringify({ error: 'Valor inválido' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase.rpc('store_encrypted_setting', {
          p_user_id: user.id,
          p_key: key,
          p_value: value,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Non-secret settings (model/temp) go to user_settings
      if (ALLOWED_SETTING_KEYS.includes(key)) {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,setting_key' });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Chave não permitida' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== DELETE ==========
    if (req.method === 'DELETE') {
      const body = await req.json();

      if (body.type === 'prompt') {
        const { key } = body;
        if (!key) {
          return new Response(JSON.stringify({ error: 'key é obrigatório' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('prompt_templates')
          .delete()
          .eq('user_id', user.id)
          .eq('prompt_key', key);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { key } = body;
      if (!key) {
        return new Response(JSON.stringify({ error: 'key é obrigatório' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // API keys: delete (just delete from user_settings, encrypted_value goes with it)
      if (ALLOWED_SECRET_KEYS.includes(key)) {
        const { error } = await supabase
          .from('user_settings')
          .delete()
          .eq('user_id', user.id)
          .eq('setting_key', key);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Non-secret settings
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('setting_key', key);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Método não suportado' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
