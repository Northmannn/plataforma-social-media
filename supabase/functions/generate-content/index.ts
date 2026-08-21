import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== DEFAULT PROMPTS ==========

const DEFAULT_GEN_VIDEO = `📹 CRIAR ROTEIRO DE VÍDEO para {{platform}}:

Estrutura obrigatória:
1. HOOK (primeiros 3 segundos):
   - Frase de impacto que prende atenção imediatamente
   - Curiosidade ou problema relevante
   
2. DESENVOLVIMENTO (corpo principal):
   - Conteúdo de valor dividido em 2-3 pontos principais
   - Mantenha o ritmo dinâmico
   - Use transições naturais
   
3. CTA (chamada para ação):
   - Ação clara e específica
   - Engajamento (comentar, salvar, compartilhar)

TEMPO TOTAL: Máximo 90 segundos
FORMATO: Escreva como um roteiro prático (não use markdown headers)`;

const DEFAULT_GEN_POST = `📱 CRIAR LEGENDA PARA {{platform}}:

Estrutura obrigatória:
1. PRIMEIRA LINHA (hook):
   - Frase impactante que faz querer ler mais
   - Não use emoji no início se não for característico do perfil
   
2. CORPO DA MENSAGEM:
   - História, valor ou ensinamento
   - Quebras de linha estratégicas para legibilidade
   - Linguagem do perfil (informal/formal conforme análise)
   
3. CTA (chamada para ação):
   - Pergunta ou convite ao engajamento
   
4. HASHTAGS:
   - 5-10 hashtags relevantes ao conteúdo e perfil
   - Mix de hashtags grandes e de nicho

LIMITE: 2200 caracteres
FORMATO: Legenda pronta para copiar e colar`;

const DEFAULT_GEN_IDEA = `💡 CRIAR IDEIA COMPLETA DE CONTEÚDO para {{platform}}:

Forneça:
1. TÍTULO/CONCEITO:
   - Nome chamativo para a ideia
   
2. FORMATO:
   - Tipo de conteúdo (Reel, carrossel, vídeo, story, etc.)
   - Duração/quantidade de slides
   
3. ESTRUTURA/ROTEIRO BÁSICO:
   - Outline do conteúdo passo a passo
   - Pontos principais a abordar
   
4. ELEMENTOS VISUAIS SUGERIDOS:
   - Estilo visual, cores, textos na tela
   - Música/audio sugerido (se aplicável)
   
5. POR QUE VAI FUNCIONAR:
   - Baseado na análise, explique por que essa ideia se alinha com o que funciona para este perfil

FORMATO: Documento estruturado e acionável`;

const DEFAULT_FORMAT_CONTENT = `Você é um formatador de conteúdo. Sua ÚNICA tarefa é reorganizar o conteúdo fornecido num formato markdown padronizado. NÃO altere o conteúdo, apenas a estrutura e formatação.

REGRAS:
- Comece com um título # (uma linha)
- Use > para metadados (tipo, plataforma, perfil) na segunda linha
- Use --- como separador entre seções
- Use headers ## para seções principais
- Use **negrito** para destaques importantes
- Use listas com - para itens
- Adapte a estrutura ao tipo de conteúdo:
  - Vídeo/Roteiro: ## GANCHO, ## DESENVOLVIMENTO, ## CTA
  - Post/Legenda: ## HOOK, ## CORPO, ## CTA, ## HASHTAGS
  - Ideia: ## CONCEITO, ## FORMATO, ## ESTRUTURA, ## VISUAL, ## JUSTIFICATIVA
  - Carrossel: ## Slide 1 - Capa, ## Slide 2, ... ## Slide N - CTA (com **Título:**, **Texto:**, **Visual:** em cada)
  - Genérico: Use ## para dividir em seções lógicas
- Mantenha o tom e linguagem originais
- Preserve emojis existentes
- NÃO adicione conteúdo novo, apenas reorganize

CONTEÚDO ORIGINAL:
{{raw_content}}

TIPO: {{content_type}}
PLATAFORMA: {{platform}}`;

// ========== HELPERS ==========

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

// ========== FORMAT CONTENT (Stage 2) ==========

async function formatContent(supabase: any, userId: string | null, rawContent: string, contentType: string, platform: string): Promise<string> {
  try {
    const formatPromptTemplate = await getUserPrompt(supabase, userId, 'prompt_format_content', DEFAULT_FORMAT_CONTENT);
    
    const formatPrompt = formatPromptTemplate
      .replace(/\{\{raw_content\}\}/g, rawContent)
      .replace(/\{\{content_type\}\}/g, contentType || 'genérico')
      .replace(/\{\{platform\}\}/g, platform || 'Instagram');

    const formatResponse = await callAI(supabase, userId, 'google/gemini-2.5-flash-lite', [
      { role: 'user', content: formatPrompt }
    ], 0.3, 4000);

    if (!formatResponse.ok) {
      console.error('Format stage failed, returning raw content');
      return rawContent;
    }

    const formatData = await formatResponse.json();
    const formatted = formatData.choices?.[0]?.message?.content;
    
    return formatted || rawContent;
  } catch (error) {
    console.error('Error in format stage:', error);
    return rawContent;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, knowledgeSources, contentType, prompt, platform } = await req.json();
    
    // Backward compat
    let sources: { type: string; id: string }[] = knowledgeSources || [];
    if (sources.length === 0 && profileId) {
      sources = [{ type: 'instagram_profile', id: profileId }];
    }

    if (!contentType || !prompt) {
      throw new Error('Missing required fields: contentType or prompt');
    }
    if (sources.length === 0) {
      throw new Error('At least one knowledge source (or profileId) is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const userId = await getUserIdFromAuth(req);

    // Build combined context from all sources
    let contextPrompt = `Você é um especialista em criação de conteúdo para redes sociais.\n\n`;
    let primaryProfileUsername = '';

    for (const source of sources) {
      if (source.type === 'instagram_profile') {
        const { data: contentBase } = await supabase
          .from('profile_content_base')
          .select('*')
          .eq('profile_id', source.id)
          .order('analysis_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: profile } = await supabase
          .from('instagram_profiles')
          .select('username, display_name, bio, category')
          .eq('id', source.id)
          .single();

        if (profile) {
          if (!primaryProfileUsername) primaryProfileUsername = profile.username;
          
          contextPrompt += `--- Instagram: @${profile.username} ---\n`;
          contextPrompt += `${profile.display_name ? `Nome: ${profile.display_name}\n` : ''}`;
          contextPrompt += `${profile.bio ? `Bio: ${profile.bio}\n` : ''}`;
          contextPrompt += `${profile.category ? `Categoria: ${profile.category}\n` : ''}`;

          if (contentBase) {
            const analysis = contentBase.analysis_summary;
            contextPrompt += `ANÁLISE DE ${contentBase.posts_analyzed_count} POSTS (${contentBase.total_engagement?.toLocaleString()} engajamentos):\n`;
            if (analysis.tone_and_style) contextPrompt += `🎭 TOM E ESTILO:\n${analysis.tone_and_style}\n`;
            if (analysis.content_themes?.length > 0) contextPrompt += `📚 TEMAS:\n${analysis.content_themes.map((t: string) => `• ${t}`).join('\n')}\n`;
            if (analysis.key_success_factors?.length > 0) contextPrompt += `🔑 FATORES DE SUCESSO:\n${analysis.key_success_factors.map((f: string) => `• ${f}`).join('\n')}\n`;
            if (analysis.engagement_insights) contextPrompt += `📊 INSIGHTS:\n${analysis.engagement_insights}\n`;
          }
          contextPrompt += '\n';
        }
      } else if (source.type === 'youtube_video') {
        const { data: video } = await supabase
          .from('youtube_videos')
          .select('title, channel_name, ai_analysis, transcript')
          .eq('id', source.id)
          .single();

        if (video) {
          contextPrompt += `--- YouTube: "${video.title || 'Sem título'}" ---\n`;
          if (video.channel_name) contextPrompt += `Canal: ${video.channel_name}\n`;
          if (video.ai_analysis) {
            contextPrompt += `Análise IA:\n${JSON.stringify(video.ai_analysis, null, 2)}\n`;
          }
          if (video.transcript) {
            contextPrompt += `Transcrição (resumo):\n${video.transcript.substring(0, 2000)}\n`;
          }
          contextPrompt += '\n';
        }
      }
    }

    // Get custom or default structure prompt
    const promptKeyMap: Record<string, { key: string; defaultVal: string }> = {
      video: { key: 'prompt_gen_video', defaultVal: DEFAULT_GEN_VIDEO },
      post: { key: 'prompt_gen_post', defaultVal: DEFAULT_GEN_POST },
      idea: { key: 'prompt_gen_idea', defaultVal: DEFAULT_GEN_IDEA },
    };

    const selected = promptKeyMap[contentType] || promptKeyMap.video;
    const structureTemplate = await getUserPrompt(supabase, userId, selected.key, selected.defaultVal);
    const structurePrompt = structureTemplate.replace(/\{\{platform\}\}/g, platform || 'Instagram');

    contextPrompt += '\n' + structurePrompt;
    contextPrompt += `\n\n🎯 SOLICITAÇÃO DO USUÁRIO:\n"${prompt}"

IMPORTANTE:
- Mantenha FIELMENTE o tom, estilo e voz identificados nas bases
- Use os temas e padrões que comprovadamente funcionam
- Incorpore os fatores-chave de sucesso
- Seja específico, prático e acionável
- NÃO invente informações sobre os perfis
- Crie algo que pareça ter sido criado pelo próprio criador

Agora crie o conteúdo:`;

    const modelSettings = await getUserModelSettings(supabase, userId, 'model_content_generation', { model: 'google/gemini-2.5-pro', temperature: 0.8 });

    const aiResponse = await callAI(supabase, userId, modelSettings.model, [{ role: 'user', content: contextPrompt }], modelSettings.temperature, 8192);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      if (aiResponse.status === 429) throw new Error('Limite de requisições excedido.');
      if (aiResponse.status === 402) throw new Error('Créditos insuficientes.');
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices[0].message.content;

    // ===== STAGE 2: Format content =====
    const formattedContent = await formatContent(supabase, userId, rawContent, contentType, platform || 'Instagram');

    const titleSuggestion = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;

    return new Response(
      JSON.stringify({
        title: titleSuggestion,
        content: formattedContent,
        raw_content: rawContent,
        metadata: {
          generated_with_ai: true, profile_username: primaryProfileUsername || 'multi-source',
          content_type: contentType, platform, original_prompt: prompt,
          sources_count: sources.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar conteúdo' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
