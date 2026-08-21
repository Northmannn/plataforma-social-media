import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PromptTemplate {
  prompt_key: string;
  prompt_value: string;
  is_active: boolean;
  updated_at: string;
}

export interface PromptDefinition {
  key: string;
  name: string;
  description: string;
  category: string;
  variables: string[];
  defaultValue: string;
}

// =================== DEFAULT PROMPTS ===================

const DEFAULT_PROMPT_PROFILE_ANALYSIS = `Você é um especialista em análise de conteúdo de redes sociais. Analise os dados dos últimos posts deste perfil do Instagram e forneça insights acionáveis para criação de conteúdo futuro.

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

const DEFAULT_PROMPT_CHAT_VIDEO = `Você é um especialista em criação de roteiros para vídeos de redes sociais (Instagram Reels, TikTok, YouTube Shorts).

{{profile_context}}

**Estrutura do Roteiro:**
1. **GANCHO (3-5 segundos):** Frase impactante que prende a atenção imediatamente
2. **DESENVOLVIMENTO (15-20 segundos):** Conteúdo principal, dicas, storytelling
3. **CTA (2-3 segundos):** Call-to-action claro (ex: siga, comente, salve)

**Diretrizes:**
- Use linguagem natural e conversacional
- Inclua pausas e ênfases para dramatização
- Adicione sugestões de takes visuais entre [colchetes]
- Mantenha o roteiro entre 30-60 segundos quando falado`;

const DEFAULT_PROMPT_CHAT_POST = `Você é um especialista em criação de legendas para posts de Instagram.

{{profile_context}}

**Estrutura da Legenda:**
1. **GANCHO:** Primeira linha impactante (aparece antes do "ver mais")
2. **CORPO:** Desenvolva o conteúdo, conte uma história, agregue valor
3. **CTA:** Convide para engajamento (comentar, salvar, marcar alguém)
4. **HASHTAGS:** 5-10 hashtags relevantes

**Diretrizes:**
- Use emojis estrategicamente (não exagere)
- Quebre em parágrafos curtos para melhor leitura
- Faça perguntas para estimular comentários
- Seja autêntico e humano`;

const DEFAULT_PROMPT_CHAT_IDEA = `Você é um consultor criativo especializado em estratégia de conteúdo para redes sociais.

{{profile_context}}

**Formato de Resposta:**
Para cada ideia, forneça:
- 📌 **Título/Conceito:** Descrição curta da ideia
- 🎯 **Objetivo:** O que essa ideia busca alcançar (engajamento, vendas, awareness)
- 💡 **Como executar:** Passos práticos para criar o conteúdo
- 🔥 **Por que funciona:** Explicação baseada em psicologia/tendências

Sugira **3-5 ideias** variadas e acionáveis.`;

const DEFAULT_PROMPT_CHAT_GENERIC = `Você é um assistente criativo especializado em conteúdo para redes sociais.

{{profile_context}}

Ajude o usuário a criar conteúdo de qualidade para suas redes sociais.`;

const DEFAULT_PROMPT_GEN_VIDEO = `📹 CRIAR ROTEIRO DE VÍDEO para {{platform}}:

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

const DEFAULT_PROMPT_GEN_POST = `📱 CRIAR LEGENDA PARA {{platform}}:

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

const DEFAULT_PROMPT_GEN_IDEA = `💡 CRIAR IDEIA COMPLETA DE CONTEÚDO para {{platform}}:

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

const DEFAULT_PROMPT_IMAGE_ANALYSIS = `Analise esta imagem de um post do Instagram e forneça uma análise detalhada em JSON com a seguinte estrutura:

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

const DEFAULT_PROMPT_YOUTUBE_ANALYSIS = `Você é um Analista de Conteúdo Sênior especializado em identificar insights de alto valor a partir de transcrições de vídeo. Seu objetivo é pegar a TRANSCRIÇÃO BRUTA fornecida e transformá-la em um Relatório de Conteúdo Otimizado.

Etapas de Análise:

1. Contextualização: Identifique o TEMA CENTRAL e a INTENÇÃO PRINCIPAL do vídeo (informar, educar, entreter, persuadir, etc.).

2. Highlighting: Identifique os 8 a 10 pontos mais importantes, virais ou controversos da transcrição. Esses devem ser as ideias-chave que o público provavelmente reteria.

3. Citações: Extraia as 8 a 10 frases mais impactantes e diretas que podem ser usadas como copys de manchete ou texto de postagem.

4. Estrutura Lógica: Crie um Resumo Estrutural BEM DETALHADO que descreva a progressão de ideias do vídeo, separando-o em introdução, corpo (com subtópicos detalhados) e conclusão. O resumo deve capturar nuances, transições e a lógica narrativa completa.

5. Ganchos: Sugira 10 GANCHOS (frases de 5-10 palavras) para introduzir o conteúdo em vídeos curtos ou posts.

Analise a transcrição fornecida e retorne uma análise estruturada completa.`;

const DEFAULT_PROMPT_FORMAT_CONTENT = `Você é um formatador de conteúdo. Sua ÚNICA tarefa é reorganizar o conteúdo fornecido num formato markdown padronizado. NÃO altere o conteúdo, apenas a estrutura e formatação.

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

// =================== PROMPT DEFINITIONS ===================

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  // Análise
  {
    key: "prompt_profile_analysis",
    name: "Análise de Perfil",
    description: "Prompt principal que analisa posts do Instagram e gera a base de conhecimento",
    category: "Análise",
    variables: ["{{username}}", "{{follower_count}}", "{{post_count}}", "{{posts_data}}"],
    defaultValue: DEFAULT_PROMPT_PROFILE_ANALYSIS,
  },
  // Chat
  {
    key: "prompt_chat_video",
    name: "Roteiro de Vídeo (Chat)",
    description: "System prompt para criação de roteiros de vídeo no chat",
    category: "Chat",
    variables: ["{{profile_context}}"],
    defaultValue: DEFAULT_PROMPT_CHAT_VIDEO,
  },
  {
    key: "prompt_chat_post",
    name: "Legenda de Post (Chat)",
    description: "System prompt para criação de legendas no chat",
    category: "Chat",
    variables: ["{{profile_context}}"],
    defaultValue: DEFAULT_PROMPT_CHAT_POST,
  },
  {
    key: "prompt_chat_idea",
    name: "Geração de Ideias (Chat)",
    description: "System prompt para geração de ideias no chat",
    category: "Chat",
    variables: ["{{profile_context}}"],
    defaultValue: DEFAULT_PROMPT_CHAT_IDEA,
  },
  {
    key: "prompt_chat_generic",
    name: "Chat Genérico",
    description: "System prompt genérico quando não há tipo especificado",
    category: "Chat",
    variables: ["{{profile_context}}"],
    defaultValue: DEFAULT_PROMPT_CHAT_GENERIC,
  },
  // Geração
  {
    key: "prompt_gen_video",
    name: "Roteiro de Vídeo (Geração)",
    description: "Estrutura para roteiros de vídeo (hook, desenvolvimento, CTA)",
    category: "Geração",
    variables: ["{{username}}", "{{bio}}", "{{category}}", "{{analysis_data}}", "{{user_prompt}}", "{{platform}}"],
    defaultValue: DEFAULT_PROMPT_GEN_VIDEO,
  },
  {
    key: "prompt_gen_post",
    name: "Legenda de Post (Geração)",
    description: "Estrutura para legendas (hook, corpo, CTA, hashtags)",
    category: "Geração",
    variables: ["{{username}}", "{{bio}}", "{{category}}", "{{analysis_data}}", "{{user_prompt}}", "{{platform}}"],
    defaultValue: DEFAULT_PROMPT_GEN_POST,
  },
  {
    key: "prompt_gen_idea",
    name: "Ideia de Conteúdo (Geração)",
    description: "Estrutura para ideias completas (conceito, formato, visual)",
    category: "Geração",
    variables: ["{{username}}", "{{bio}}", "{{category}}", "{{analysis_data}}", "{{user_prompt}}", "{{platform}}"],
    defaultValue: DEFAULT_PROMPT_GEN_IDEA,
  },
  // Criativos
  {
    key: "prompt_image_analysis",
    name: "Análise de Imagem",
    description: "Prompt para análise visual de imagens (descrição, cores, estilo, elementos)",
    category: "Criativos",
    variables: [],
    defaultValue: DEFAULT_PROMPT_IMAGE_ANALYSIS,
  },
  // YouTube
  {
    key: "prompt_youtube_analysis",
    name: "Análise de YouTube",
    description: "System prompt para análise de transcrições (highlights, citações, ganchos)",
    category: "YouTube",
    variables: ["{{transcript}}"],
    defaultValue: DEFAULT_PROMPT_YOUTUBE_ANALYSIS,
  },
  // Formatação
  {
    key: "prompt_format_content",
    name: "Formatação de Conteúdo",
    description: "Prompt da etapa 2 que reformata o conteúdo gerado em markdown padronizado para PDF",
    category: "Formatação",
    variables: ["{{raw_content}}", "{{content_type}}", "{{platform}}"],
    defaultValue: DEFAULT_PROMPT_FORMAT_CONTENT,
  },
];

export const DEFAULT_PROMPTS: Record<string, string> = {
  prompt_profile_analysis: DEFAULT_PROMPT_PROFILE_ANALYSIS,
  prompt_chat_video: DEFAULT_PROMPT_CHAT_VIDEO,
  prompt_chat_post: DEFAULT_PROMPT_CHAT_POST,
  prompt_chat_idea: DEFAULT_PROMPT_CHAT_IDEA,
  prompt_chat_generic: DEFAULT_PROMPT_CHAT_GENERIC,
  prompt_gen_video: DEFAULT_PROMPT_GEN_VIDEO,
  prompt_gen_post: DEFAULT_PROMPT_GEN_POST,
  prompt_gen_idea: DEFAULT_PROMPT_GEN_IDEA,
  prompt_image_analysis: DEFAULT_PROMPT_IMAGE_ANALYSIS,
  prompt_youtube_analysis: DEFAULT_PROMPT_YOUTUBE_ANALYSIS,
  prompt_format_content: DEFAULT_PROMPT_FORMAT_CONTENT,
};

export const usePromptTemplates = () => {
  const queryClient = useQueryClient();

  const { data: userPrompts, isLoading } = useQuery({
    queryKey: ["prompt-templates"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await supabase.functions.invoke("manage-settings", {
        method: "GET",
        headers: { "x-settings-type": "prompts" },
      });

      if (response.error) throw response.error;
      return (response.data?.prompts || []) as PromptTemplate[];
    },
  });

  const savePrompt = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await supabase.functions.invoke("manage-settings", {
        body: { type: "prompt", key, value },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
      toast.success("Prompt salvo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar prompt: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    },
  });

  const deletePrompt = useMutation({
    mutationFn: async (key: string) => {
      const response = await supabase.functions.invoke("manage-settings", {
        body: { type: "prompt", key, action: 'delete' },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-templates"] });
      toast.success("Prompt restaurado para o padrão!");
    },
  });

  const getPromptValue = (key: string): string => {
    const userPrompt = userPrompts?.find(p => p.prompt_key === key && p.is_active);
    return userPrompt?.prompt_value || DEFAULT_PROMPTS[key] || "";
  };

  const isCustomized = (key: string): boolean => {
    return userPrompts?.some(p => p.prompt_key === key) || false;
  };

  return { userPrompts, isLoading, savePrompt, deletePrompt, getPromptValue, isCustomized };
};
