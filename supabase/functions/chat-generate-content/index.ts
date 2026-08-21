import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== DEFAULT PROMPTS ==========

const CONVERSATIONAL_INSTRUCTION = `
REGRA FUNDAMENTAL DE COMPORTAMENTO:
Você é um assistente CONVERSACIONAL. Seu papel é CONVERSAR com o usuário, entender o que ele precisa, fazer perguntas, dar sugestões e orientar.

- Quando o usuário fizer uma pergunta, responda naturalmente como numa conversa.
- Quando o usuário pedir ajuda, orientação ou dicas, responda de forma conversacional.
- Quando o usuário der um briefing vago, faça perguntas para entender melhor antes de criar.
- SOMENTE quando o usuário pedir EXPLICITAMENTE para criar/gerar o conteúdo final OU quando você tiver informações suficientes e o contexto claramente indicar que é hora de entregar, produza o conteúdo.

Quando você produzir o conteúdo FINAL (roteiro, legenda, ideia, etc.), envolva-o EXATAMENTE assim:

===CONTEUDO_FINAL===
[conteúdo completo aqui]
===FIM_CONTEUDO===

Tudo que estiver FORA dessas marcações será exibido como mensagem de chat normal.
Tudo que estiver DENTRO será formatado como um "documento" entregável.

Você pode incluir texto conversacional ANTES das marcações (ex: "Aqui está o roteiro que preparei:") e o conteúdo final DENTRO delas.

Se o usuário mandar uma mensagem curta como "Roteiro de vídeo" ou "Legenda para post", NÃO gere imediatamente. Pergunte sobre o tema, público, tom, objetivo, etc.
Se o usuário já fornecer detalhes suficientes (tema + contexto + pedido claro), aí sim gere o conteúdo final.
`;

const DEFAULT_CHAT_VIDEO = `Você é um especialista em criação de roteiros para vídeos de redes sociais (Instagram Reels, TikTok, YouTube Shorts).

{{profile_context}}

**Quando for criar o conteúdo final, use esta estrutura:**
1. **GANCHO (3-5 segundos):** Frase impactante que prende a atenção imediatamente
2. **DESENVOLVIMENTO (15-20 segundos):** Conteúdo principal, dicas, storytelling
3. **CTA (2-3 segundos):** Call-to-action claro (ex: siga, comente, salve)

**Diretrizes para o conteúdo final:**
- Use linguagem natural e conversacional
- Inclua pausas e ênfases para dramatização
- Adicione sugestões de takes visuais entre [colchetes]
- Mantenha o roteiro entre 30-60 segundos quando falado`;

const DEFAULT_CHAT_POST = `Você é um especialista em criação de legendas para posts de Instagram.

{{profile_context}}

**Quando for criar o conteúdo final, use esta estrutura:**
1. **GANCHO:** Primeira linha impactante (aparece antes do "ver mais")
2. **CORPO:** Desenvolva o conteúdo, conte uma história, agregue valor
3. **CTA:** Convide para engajamento (comentar, salvar, marcar alguém)
4. **HASHTAGS:** 5-10 hashtags relevantes

**Diretrizes para o conteúdo final:**
- Use emojis estrategicamente (não exagere)
- Quebre em parágrafos curtos para melhor leitura
- Faça perguntas para estimular comentários
- Seja autêntico e humano`;

const DEFAULT_CHAT_IDEA = `Você é um consultor criativo especializado em estratégia de conteúdo para redes sociais.

{{profile_context}}

**Quando for criar o conteúdo final, use este formato:**
Para cada ideia, forneça:
- 📌 **Título/Conceito:** Descrição curta da ideia
- 🎯 **Objetivo:** O que essa ideia busca alcançar (engajamento, vendas, awareness)
- 💡 **Como executar:** Passos práticos para criar o conteúdo
- 🔥 **Por que funciona:** Explicação baseada em psicologia/tendências

Sugira **3-5 ideias** variadas e acionáveis.`;

const DEFAULT_CHAT_GENERIC = `Você é um assistente criativo especializado em conteúdo para redes sociais.

{{profile_context}}

Ajude o usuário a criar conteúdo de qualidade para suas redes sociais.`;

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

  // OpenRouter route
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
    // Get user's custom format prompt or default
    const formatPromptTemplate = await getUserPrompt(supabase, userId, 'prompt_format_content', DEFAULT_FORMAT_CONTENT);
    
    const formatPrompt = formatPromptTemplate
      .replace(/\{\{raw_content\}\}/g, rawContent)
      .replace(/\{\{content_type\}\}/g, contentType || 'genérico')
      .replace(/\{\{platform\}\}/g, platform || 'Instagram');

    // Use a fast, cheap model for formatting
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
    return rawContent; // Fallback: return raw content
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, userMessage, profileId, knowledgeSources, contentType } = await req.json();

    // Create supabase client
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user ID
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch { userId = null; }

    // Backward compat: convert profileId to knowledgeSources format
    let sources: { type: string; id: string }[] = knowledgeSources || [];
    if (sources.length === 0 && profileId) {
      sources = [{ type: 'instagram_profile', id: profileId }];
    }

    // Load conversation history
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20);
      if (msgs) {
        conversationHistory = msgs.map((m: any) => ({ role: m.role, content: m.content }));
      }
    }

    // 2. Build knowledge context from all sources
    let knowledgeContextParts: string[] = [];
    
    for (const source of sources) {
      if (source.type === 'instagram_profile') {
        const { data: profile } = await supabase
          .from('instagram_profiles')
          .select('username, display_name, bio')
          .eq('id', source.id)
          .single();

        const { data: contentBase } = await supabase
          .from('profile_content_base')
          .select('analysis_summary, posts_analyzed_count, total_engagement')
          .eq('profile_id', source.id)
          .order('analysis_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (profile && contentBase) {
          knowledgeContextParts.push(`--- Instagram: @${profile.username} ---
${profile.display_name ? `Nome: ${profile.display_name}` : ''}
${profile.bio ? `Bio: ${profile.bio}` : ''}
Posts analisados: ${contentBase.posts_analyzed_count} | Engajamento total: ${contentBase.total_engagement?.toLocaleString()}
Análise de Conteúdo:
${JSON.stringify(contentBase.analysis_summary, null, 2)}`);
        }
      } else if (source.type === 'youtube_video') {
        const { data: video } = await supabase
          .from('youtube_videos')
          .select('title, channel_name, ai_analysis, transcript')
          .eq('id', source.id)
          .single();

        if (video) {
          let ytContext = `--- YouTube: "${video.title || 'Sem título'}" ---
${video.channel_name ? `Canal: ${video.channel_name}` : ''}`;
          if (video.ai_analysis) {
            ytContext += `\nAnálise IA:\n${JSON.stringify(video.ai_analysis, null, 2)}`;
          }
          if (video.transcript) {
            // Send only first 2000 chars of transcript to avoid token overflow
            ytContext += `\nTranscrição (resumo):\n${video.transcript.substring(0, 2000)}`;
          }
          knowledgeContextParts.push(ytContext);
        }
      } else if (source.type === 'content_script') {
        const { data: script } = await supabase
          .from('content_scripts')
          .select('title, type, content, platform')
          .eq('id', source.id)
          .single();

        if (script) {
          const scriptContext = `--- Conteúdo Salvo: "${script.title || 'Sem título'}" ---
Tipo: ${script.type || 'genérico'}
Plataforma: ${script.platform || 'não especificada'}
Conteúdo:
${script.content?.substring(0, 3000) || ''}`;
          knowledgeContextParts.push(scriptContext);
        }
      }
    }

    const knowledgeBlock = knowledgeContextParts.length > 0
      ? `=== BASES DE CONHECIMENTO ===\n\n${knowledgeContextParts.join('\n\n')}\n\n=== FIM DAS BASES ===`
      : '';

    // 3. Select and load the right prompt
    const promptKeyMap: Record<string, { key: string; defaultVal: string }> = {
      video: { key: 'prompt_chat_video', defaultVal: DEFAULT_CHAT_VIDEO },
      post: { key: 'prompt_chat_post', defaultVal: DEFAULT_CHAT_POST },
      idea: { key: 'prompt_chat_idea', defaultVal: DEFAULT_CHAT_IDEA },
    };

    const selected = promptKeyMap[contentType] || { key: 'prompt_chat_generic', defaultVal: DEFAULT_CHAT_GENERIC };
    const promptTemplate = await getUserPrompt(supabase, userId, selected.key, selected.defaultVal);

    const profileContextBlock = knowledgeBlock
      ? `Use como referência as seguintes bases de conhecimento:\n${knowledgeBlock}`
      : (contentType === 'video' ? 'Crie um roteiro envolvente e criativo.' :
         contentType === 'post' ? 'Crie uma legenda envolvente.' :
         contentType === 'idea' ? 'Sugira ideias criativas e engajadoras.' :
         'Seja criativo e engajador.');

    const systemPrompt = CONVERSATIONAL_INSTRUCTION + '\n\n' + promptTemplate.replace(/\{\{profile_context\}\}/g, profileContextBlock);

    const startTime = Date.now();
    const modelSettings = await getUserModelSettings(supabase, userId, 'model_chat_generation', { model: 'google/gemini-2.5-flash', temperature: 0.7 });

    const response = await callAI(supabase, userId, modelSettings.model, [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userMessage }
    ], modelSettings.temperature, 2000);

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'Erro ao gerar resposta com IA' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const generationTime = Date.now() - startTime;
    const rawContent = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    if (!rawContent) {
      return new Response(JSON.stringify({ error: 'Resposta da IA vazia' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== Parse deliverable markers =====
    const deliverableRegex = /===CONTEUDO_FINAL===([\s\S]*?)===FIM_CONTEUDO===/;
    const match = rawContent.match(deliverableRegex);
    const isDeliverable = !!match;

    let chatMessage = rawContent;
    let deliverableContent: string | null = null;
    let formattedContent = rawContent;

    if (isDeliverable && match) {
      // Extract chat message (everything outside the markers)
      chatMessage = rawContent.replace(deliverableRegex, '').trim();
      deliverableContent = match[1].trim();

      // Format only the deliverable content
      const formatted = await formatContent(supabase, userId, deliverableContent, (contentType as string) || 'genérico', 'Instagram');
      formattedContent = formatted;
    }

    return new Response(
      JSON.stringify({
        content: formattedContent,
        raw_content: rawContent,
        chat_message: chatMessage || null,
        deliverable_content: deliverableContent,
        is_deliverable: isDeliverable,
        model: modelSettings.model,
        tokens_used: tokensUsed,
        generation_time_ms: generationTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-generate-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
