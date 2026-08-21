import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PROMPT = `Você é um especialista em análise de conteúdo de redes sociais. Analise os dados dos últimos posts deste perfil do Instagram e forneça insights acionáveis para criação de conteúdo futuro.

DADOS DO PERFIL:
- Username: {{username}}
- Seguidores: {{follower_count}}
- Posts totais: {{post_count}}

DADOS DOS POSTS:
{{posts_data}}

ANÁLISE SOLICITADA:
Forneça uma análise detalhada em formato JSON com a seguinte estrutura:

{
  "best_posts": [
    {
      "post_id": "id do post",
      "reason": "por que este post performou bem (seja específico sobre conteúdo, visual, timing)",
      "engagement_rate": taxa de engajamento,
      "key_factors": ["fator 1", "fator 2", "fator 3"]
    }
  ],
  "content_themes": ["tema 1", "tema 2", "tema 3"],
  "visual_patterns": ["padrão 1", "padrão 2"],
  "engagement_insights": "Análise detalhada do que gera mais engajamento e por quê",
  "posting_patterns": "Padrões de frequência, horários e consistência",
  "content_recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3", "Recomendação 4", "Recomendação 5"],
  "tone_and_style": "Descrição do tom, voz e estilo do criador",
  "key_success_factors": ["fator-chave 1", "fator-chave 2", "fator-chave 3"]
}

IMPORTANTE:
- Seja específico e acionável nas recomendações
- Identifique padrões reais baseados nos dados fornecidos
- Considere tanto métricas quantitativas quanto qualitativas
- Foque em insights que podem ser usados para criar novos conteúdos`;

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
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data, error } = await supabaseUser.auth.getUser(token);
    if (error || !data?.user) {
      console.error('Auth error:', error?.message);
      return null;
    }
    return data.user.id;
  } catch (e) {
    console.error('getUserIdFromAuth error:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();

    if (!username) {
      throw new Error('Username é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID for custom prompts
    const userId = await getUserIdFromAuth(req);

    console.log('Buscando perfil:', username, 'userId:', userId);

    // 1. Buscar perfil (filtrar por user_id para isolamento de dados)
    let profileQuery = supabase
      .from('instagram_profiles')
      .select('*')
      .eq('username', username);

    if (userId) {
      profileQuery = profileQuery.eq('user_id', userId);
    }

    const { data: profile, error: profileError } = await profileQuery.single();

    if (profileError || !profile) {
      throw new Error('Perfil não encontrado');
    }

    // 2. Buscar últimos 30 posts
    const { data: posts, error: postsError } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('profile_id', profile.id)
      .order('timestamp', { ascending: false })
      .limit(30);

    if (postsError) {
      throw new Error('Erro ao buscar posts: ' + postsError.message);
    }

    // 3. Análises individuais
    const analysisPromises = [];
    
    for (const post of posts || []) {
      if ((post.post_type === 'GraphImage' || post.post_type === 'GraphSidecar') && 
          !post.ai_image_analysis && post.display_url) {
        analysisPromises.push(
          supabase.functions.invoke('analyze-creative', {
            body: { postId: post.id, imageUrl: post.display_url }
          }).catch(err => { console.error('Erro ao analisar imagem:', err); return null; })
        );
      }
      
      if (post.post_type === 'GraphVideo' && !post.ai_video_transcription && post.video_url) {
        analysisPromises.push(
          supabase.functions.invoke('transcribe-video', {
            body: { postId: post.id, videoUrl: post.video_url }
          }).catch(err => { console.error('Erro ao transcrever vídeo:', err); return null; })
        );
      }
    }

    if (analysisPromises.length > 0) {
      await Promise.all(analysisPromises);
      const { data: updatedPosts } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('profile_id', profile.id)
        .order('timestamp', { ascending: false })
        .limit(30);
      if (updatedPosts) {
        posts.splice(0, posts.length, ...updatedPosts);
      }
    }

    // 4. Preparar dados
    const totalEngagement = posts.reduce((sum, post) => 
      sum + (post.likes_count || 0) + (post.comments_count || 0) + (post.video_view_count || 0), 0
    );

    const postsForAnalysis = posts.map(post => ({
      id: post.id, type: post.post_type, timestamp: post.timestamp,
      caption: post.caption, hashtags: post.hashtags, mentions: post.mentions,
      likes: post.likes_count, comments: post.comments_count, views: post.video_view_count,
      engagement: (post.likes_count || 0) + (post.comments_count || 0) + (post.video_view_count || 0),
      image_analysis: post.ai_image_analysis, video_transcription: post.ai_video_transcription,
    }));

    // 5. Get custom or default prompt
    const promptTemplate = await getUserPrompt(supabase, userId, 'prompt_profile_analysis', DEFAULT_PROMPT);
    
    const prompt = promptTemplate
      .replace('{{username}}', profile.username)
      .replace('{{follower_count}}', String(profile.follower_count || 0))
      .replace('{{post_count}}', String(profile.post_count || 0))
      .replace('{{posts_data}}', JSON.stringify(postsForAnalysis, null, 2));

    const modelSettings = await getUserModelSettings(supabase, userId, 'model_profile_analysis', { model: 'google/gemini-2.5-pro', temperature: 0.7 });

    const aiResponse = await callAI(supabase, userId, modelSettings.model, [{ role: 'user', content: prompt }], modelSettings.temperature, 8192);

    const responseText = await aiResponse.text();

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      if (aiResponse.status === 402) throw new Error('Créditos insuficientes. Adicione créditos no workspace do Lovable.');
      console.error('AI error response:', responseText);
      throw new Error('Erro ao processar análise com IA');
    }

    if (!responseText || responseText.trim() === '') {
      throw new Error('Resposta vazia da IA. Tente novamente.');
    }

    let aiData: any;
    try {
      aiData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', responseText.substring(0, 500));
      throw new Error('Resposta da IA inválida. Tente novamente.');
    }

    const aiContent = aiData.choices?.[0]?.message?.content;
    if (!aiContent) throw new Error('Resposta vazia da IA');

    let analysisSummary;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisSummary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Formato JSON não encontrado');
      }
    } catch {
      analysisSummary = {
        best_posts: [], content_themes: [], visual_patterns: [],
        engagement_insights: aiContent.substring(0, 500),
        posting_patterns: 'Análise em progresso',
        content_recommendations: [],
        tone_and_style: 'Análise em progresso',
        key_success_factors: []
      };
    }

    const { data: savedAnalysis, error: saveError } = await supabase
      .from('profile_content_base')
      .insert({
        profile_id: profile.id,
        analysis_date: new Date().toISOString(),
        posts_analyzed_count: posts.length,
        total_engagement: totalEngagement,
        analysis_summary: analysisSummary,
        user_id: userId,
      })
      .select()
      .single();

    if (saveError) throw new Error('Erro ao salvar análise: ' + saveError.message);

    return new Response(
      JSON.stringify({ success: true, analysis: savedAnalysis, message: `Análise completa de ${posts.length} posts concluída!` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em analyze-profile-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
