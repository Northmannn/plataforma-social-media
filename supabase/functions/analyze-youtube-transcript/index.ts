import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_YOUTUBE_ANALYSIS_PROMPT = `Você é um Analista de Conteúdo Sênior especializado em identificar insights de alto valor a partir de transcrições de vídeo. Seu objetivo é pegar a TRANSCRIÇÃO BRUTA fornecida e transformá-la em um Relatório de Conteúdo Otimizado.

Etapas de Análise:

1. Contextualização: Identifique o TEMA CENTRAL e a INTENÇÃO PRINCIPAL do vídeo (informar, educar, entreter, persuadir, etc.).

2. Highlighting: Identifique os 8 a 10 pontos mais importantes, virais ou controversos da transcrição. Esses devem ser as ideias-chave que o público provavelmente reteria.

3. Citações: Extraia as 8 a 10 frases mais impactantes e diretas que podem ser usadas como copys de manchete ou texto de postagem.

4. Estrutura Lógica: Crie um Resumo Estrutural BEM DETALHADO que descreva a progressão de ideias do vídeo, separando-o em introdução, corpo (com subtópicos detalhados) e conclusão. O resumo deve capturar nuances, transições e a lógica narrativa completa.

5. Ganchos: Sugira 10 GANCHOS (frases de 5-10 palavras) para introduzir o conteúdo em vídeos curtos ou posts.

Analise a transcrição fornecida e retorne uma análise estruturada completa.`;

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
    const { videoId } = await req.json();
    
    if (!videoId) throw new Error('videoId é obrigatório');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const userId = await getUserIdFromAuth(req);

    const { data: video, error: videoError } = await supabase
      .from('youtube_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError || !video) throw new Error('Vídeo não encontrado');
    if (!video.transcript || video.transcript.trim().length === 0) throw new Error('Vídeo não possui transcrição disponível');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

    // Get custom or default prompt
    const systemPrompt = await getUserPrompt(supabase, userId, 'prompt_youtube_analysis', DEFAULT_YOUTUBE_ANALYSIS_PROMPT);

    const userPrompt = `TRANSCRIÇÃO BRUTA A SER ANALISADA:\n\n${video.transcript}`;

    // Get model settings
    const modelSettings = await getUserModelSettings(supabase, userId, 'model_youtube_analysis', { model: 'google/gemini-2.5-flash', temperature: 0.5 });

    const toolsDef = {
      tools: [{
        type: "function",
        function: {
          name: "create_video_analysis",
          description: "Retorna a análise estruturada da transcrição do vídeo",
          parameters: {
            type: "object",
            properties: {
              titulo_sugerido: { type: "string", description: "Tema central do vídeo em até 70 caracteres" },
              tema_principal: { type: "string", description: "Descreva o tema principal" },
              intencao_do_video: { type: "string", description: "Intenção principal" },
              resumo_executivo: { type: "string", description: "Resumo conciso de 3-4 frases" },
              highlights_e_insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    ponto_chave: { type: "string" },
                    aplicacao_criativo: { type: "string" },
                    referencia_no_texto: { type: "string" }
                  },
                  required: ["id", "ponto_chave", "aplicacao_criativo"],
                  additionalProperties: false
                }
              },
              citacoes_impactantes: { type: "array", items: { type: "string" } },
              ganchos_para_criativos: { type: "array", items: { type: "string" } }
            },
            required: ["titulo_sugerido", "tema_principal", "intencao_do_video", "resumo_executivo", "highlights_e_insights", "citacoes_impactantes", "ganchos_para_criativos"],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "create_video_analysis" } }
    };

    const aiResponse = await callAI(supabase, userId, modelSettings.model, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], modelSettings.temperature, 8192, toolsDef);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      if (aiResponse.status === 429) throw new Error('Limite de requisições excedido.');
      if (aiResponse.status === 402) throw new Error('Créditos insuficientes.');
      throw new Error(`Erro ao gerar análise com IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) throw new Error('Formato de resposta inesperado da IA');

    const analysis = JSON.parse(toolCall.function.arguments);

    const { data: updatedVideo, error: updateError } = await supabase
      .from('youtube_videos')
      .update({
        ai_analysis: analysis,
        analyzed_at: new Date().toISOString(),
        title: (!video.title || video.title === 'Título não disponível') ? analysis.titulo_sugerido : video.title
      })
      .eq('id', videoId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, video: updatedVideo, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao analisar vídeo' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
