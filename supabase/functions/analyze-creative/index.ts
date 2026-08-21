import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_IMAGE_ANALYSIS_PROMPT = `Analise esta imagem de um post do Instagram e forneça uma análise detalhada em JSON com a seguinte estrutura:

{
  "description": "Descrição visual completa e detalhada do que você vê",
  "colors": ["array com códigos hex das cores dominantes"],
  "style": "estilo visual (ex: minimalista, vibrante, profissional, casual)",
  "elements": ["array com elementos identificados: pessoas, objetos, produtos, logos, textos"],
  "emotion": "emoção ou vibe que a imagem transmite",
  "composition": "descrição da composição e foco principal",
  "quality": "avaliação da qualidade técnica (iluminação, foco, resolução)",
  "suggestions": ["array com sugestões práticas de como melhorar o impacto visual"]
}

Seja detalhado mas conciso. Use português brasileiro. Retorne APENAS o JSON válido, sem texto adicional.`;

async function getUserPrompt(supabase: any, userId: string | null, promptKey: string, defaultPrompt: string): Promise<string> {
  if (!userId) return defaultPrompt;
  try {
    const { data } = await supabase
      .from('prompt_templates')
      .select('prompt_value')
      .eq('user_id', userId)
      .eq('prompt_key', promptKey)
      .eq('is_active', true)
      .maybeSingle();
    return data?.prompt_value || defaultPrompt;
  } catch {
    return defaultPrompt;
  }
}

async function getUserModelSettings(supabase: any, userId: string | null, settingKey: string, defaults: { model: string; temperature: number }): Promise<{ model: string; temperature: number }> {
  if (!userId) return defaults;
  try {
    const { data } = await supabase
      .from('user_settings')
      .select('setting_key, setting_value')
      .eq('user_id', userId)
      .in('setting_key', [settingKey, settingKey.replace('model_', 'temp_')]);
    if (!data || data.length === 0) return defaults;
    const result = { ...defaults };
    for (const row of data) {
      if (row.setting_key === settingKey) result.model = row.setting_value;
      if (row.setting_key.startsWith('temp_')) result.temperature = parseFloat(row.setting_value) || defaults.temperature;
    }
    return result;
  } catch {
    return defaults;
  }
}

function isLovableModel(model: string): boolean {
  return model.startsWith('google/') || model.startsWith('openai/');
}

async function callAI(supabase: any, userId: string | null, model: string, messages: any[], temperature: number, maxTokens: number, extraBody?: any): Promise<Response> {
  if (isLovableModel(model)) {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');
    return fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, ...extraBody }),
    });
  }
  if (!userId) throw new Error('Configure sua API key do OpenRouter nas configurações.');
  const { data: secretValue } = await supabase.rpc('get_decrypted_setting', { p_user_id: userId, p_key: 'openrouter_api_key' });
  if (!secretValue) throw new Error('Configure sua API key do OpenRouter em Configurações > Integrações para usar este modelo.');
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${secretValue}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, ...extraBody }),
  });
}

async function getUserIdFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await client.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, imageUrl } = await req.json();

    if (!postId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing postId or imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userId = await getUserIdFromAuth(req);

    // Fetch image via proxy
    const proxyUrl = `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    const imageResponse = await fetch(proxyUrl);
    
    if (!imageResponse.ok) throw new Error(`Failed to fetch image via proxy: ${imageResponse.status}`);

    const imageBuffer = await imageResponse.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Image = btoa(binary);
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Get custom or default prompt
    const analysisPrompt = await getUserPrompt(supabase, userId, 'prompt_image_analysis', DEFAULT_IMAGE_ANALYSIS_PROMPT);

    const modelSettings = await getUserModelSettings(supabase, userId, 'model_creative_analysis', { model: 'google/gemini-2.5-flash', temperature: 0.5 });

    const aiResponse = await callAI(supabase, userId, modelSettings.model, [{
      role: 'user',
      content: [
        { type: 'text', text: analysisPrompt },
        { type: 'image_url', image_url: { url: `data:${contentType};base64,${base64Image}` } }
      ]
    }], modelSettings.temperature, 4096);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit excedido.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    if (!aiContent) throw new Error('No content returned from AI');

    let analysis;
    try {
      const cleanContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch {
      analysis = {
        description: aiContent, colors: [], style: 'não detectado', elements: [],
        emotion: 'não detectado', composition: 'não analisado', quality: 'não avaliado', suggestions: []
      };
    }

    const { error: updateError } = await supabase
      .from('instagram_posts')
      .update({ ai_image_analysis: analysis, analyzed_at: new Date().toISOString() })
      .eq('id', postId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-creative:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
