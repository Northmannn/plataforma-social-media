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

interface SearchResult {
  username: string;
  display_name: string | null;
  profile_picture_url: string | null;
  is_verified: boolean;
  follower_count: number | null;
  is_private: boolean | null;
}

// Os atores de busca e de perfil devolvem os mesmos dados com nomes diferentes
// (camelCase, snake_case ou aninhados em `user`), então lemos todas as variantes.
function pick(item: Record<string, any>, keys: string[]): any {
  for (const key of keys) {
    const value = item?.[key] ?? item?.user?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function mapResult(item: Record<string, any>): SearchResult | null {
  const username = pick(item, ['username', 'userName']);
  if (!username || typeof username !== 'string') return null;

  const followers = pick(item, ['followersCount', 'follower_count', 'followerCount']);

  return {
    username,
    display_name: pick(item, ['fullName', 'full_name', 'displayName']),
    profile_picture_url: pick(item, ['profilePicUrl', 'profile_pic_url', 'profilePicUrlHD', 'profilePictureUrl']),
    is_verified: Boolean(pick(item, ['verified', 'isVerified', 'is_verified'])),
    follower_count: typeof followers === 'number' ? followers : null,
    is_private: pick(item, ['private', 'isPrivate', 'is_private']),
  };
}

/** Extrai a mensagem real do corpo de erro do Apify (`{ error: { message } }`). */
function apifyErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body);
    const message = parsed?.error?.message ?? parsed?.message;
    if (message) return `${message} (HTTP ${status})`;
  } catch {
    // corpo não-JSON — usa o texto cru abaixo
  }
  const trimmed = body.trim().slice(0, 200);
  return trimmed ? `${trimmed} (HTTP ${status})` : `HTTP ${status}`;
}

async function runActor(actor: string, token: string, input: unknown): Promise<any[]> {
  const response = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}&timeout=120`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    console.error(`Apify ${actor} falhou:`, response.status, body.slice(0, 500));

    if (response.status === 401) {
      throw new Error('API Key do Apify inválida. Verifique em Configurações.');
    }
    if (response.status === 402) {
      throw new Error('Créditos do Apify esgotados. Verifique seu plano em console.apify.com.');
    }
    if (response.status === 403) {
      throw new Error(`Sua conta do Apify não tem acesso ao ator ${actor.replace('~', '/')}.`);
    }
    throw new Error(apifyErrorMessage(response.status, body));
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Estratégias de busca por nome, da melhor para a mais tolerante. Tentamos em
 * ordem para não depender de um único ator: se a conta do usuário não puder
 * rodar o ator dedicado de busca, o scraper geral cobre o mesmo caso.
 */
const SEARCH_STRATEGIES = [
  {
    actor: 'apify~instagram-search-scraper',
    input: (term: string, limit: number) => ({
      search: term,
      searchType: 'user',
      searchLimit: limit,
    }),
  },
  {
    actor: 'apify~instagram-scraper',
    input: (term: string, limit: number) => ({
      search: term,
      searchType: 'user',
      searchLimit: limit,
      resultsType: 'details',
      resultsLimit: limit,
    }),
  },
];

function dedupe(items: any[]): SearchResult[] {
  const seen = new Set<string>();
  const results: SearchResult[] = [];
  for (const item of items) {
    const mapped = mapResult(item);
    if (!mapped) continue;
    const key = mapped.username.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(mapped);
  }
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 10 } = await req.json();

    const term = typeof query === 'string' ? query.trim().replace(/^@/, '') : '';
    if (!term) {
      throw new Error('Digite um nome ou @username para buscar');
    }

    const user = await getAuthUser(req);
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const APIFY_API_KEY = await getUserApiKey(req, 'apify_api_key');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY não configurada. Configure em Configurações.');
    }

    const searchLimit = Math.min(Math.max(Number(limit) || 10, 1), 30);
    const looksLikeUsername = /^[a-zA-Z0-9._]+$/.test(term);
    const failures: string[] = [];

    console.log(`Buscando perfis para: "${term}" (limit ${searchLimit})`);

    for (const strategy of SEARCH_STRATEGIES) {
      try {
        const items = await runActor(strategy.actor, APIFY_API_KEY, strategy.input(term, searchLimit));
        const results = dedupe(items);

        if (results.length > 0) {
          console.log(`${results.length} perfis via ${strategy.actor}`);
          return new Response(JSON.stringify({ results, source: strategy.actor }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        console.log(`${strategy.actor} não retornou perfis, tentando próxima estratégia`);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.warn(`Estratégia ${strategy.actor} falhou: ${message}`);
        failures.push(`${strategy.actor.replace('~', '/')}: ${message}`);
      }
    }

    // Nenhuma busca textual funcionou. Se o termo parece um username, ainda
    // conseguimos resolvê-lo pelo ator de perfil, que o projeto já usa.
    if (looksLikeUsername) {
      console.log(`Tentando resolver "${term}" como username exato`);
      try {
        const items = await runActor('apify~instagram-profile-scraper', APIFY_API_KEY, {
          usernames: [term],
        });
        const results = dedupe(items);
        if (results.length > 0) {
          return new Response(JSON.stringify({ results, source: 'apify~instagram-profile-scraper' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.warn(`Fallback por username exato falhou: ${message}`);
        failures.push(`apify/instagram-profile-scraper: ${message}`);
      }
    }

    // Só é erro se TODAS as estratégias falharam. Se alguma rodou e voltou
    // vazia, a busca funcionou — o perfil é que não existe.
    if (failures.length >= SEARCH_STRATEGIES.length) {
      throw new Error(`Nenhuma estratégia de busca funcionou. ${failures.join(' | ')}`);
    }

    console.log(`Nenhum perfil encontrado para "${term}"`);
    return new Response(JSON.stringify({ results: [], source: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar perfis' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
