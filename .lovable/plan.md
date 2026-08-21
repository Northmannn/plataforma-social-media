
## Diagnóstico

Os erros "Erro ao criar base de conteúdo" e "não faz a análise do perfil" têm a mesma causa raiz: **incompatibilidade total entre o schema das tabelas no banco e o que as edge functions / frontend esperam**.

Quando consolidei as migrations no commit anterior, criei tabelas com schema **legado/antigo**, enquanto o código (frontend + edge functions) usa o schema **novo**.

### Problemas confirmados

**1. Tabela `profile_content_base` (impede salvar análise)**
- Coluna `content_type TEXT NOT NULL` — código não envia (insert falha)
- Coluna `content JSONB NOT NULL` — código não envia (insert falha)
- Coluna `analysis_summary` é `TEXT` — código envia objeto JSON e frontend lê como objeto (`.tone_and_style`, `.best_posts`...)
- Faltam: nenhuma — tem todas as colunas necessárias, só com tipos errados

**2. Tabela `instagram_posts` (0 posts salvos para 28 perfis)**

Schema atual ❌ vs. esperado ✅:
| Atual (errado) | Esperado pelo código |
|---|---|
| `shortcode` | `short_code` |
| `post_url` | `url` |
| `image_url` | `display_url` |
| `views_count` | `video_view_count` |
| `posted_at` | `timestamp` |
| (não existe) | `video_play_count` |
| (não existe) | `ai_video_transcription` |
| `ai_image_analysis` ✅ | `ai_image_analysis` ✅ |

Resultado: **todo upsert do scraper falha silenciosamente** → nenhum post é salvo → análise de perfil não tem dados para processar.

**3. Constraint UNIQUE faltante em `instagram_posts`**
O scraper usa `onConflict: 'profile_id,short_code'` mas essa constraint não existe no schema atual.

## Plano de Correção

Criar **uma migration** que alinha o schema do banco com o que o código espera. Não vou alterar o código — o schema novo é o correto e está em uso em múltiplas edge functions e componentes.

### Migration 1: Corrigir `profile_content_base`

```sql
-- Tornar colunas legadas opcionais
ALTER TABLE profile_content_base ALTER COLUMN content_type DROP NOT NULL;
ALTER TABLE profile_content_base ALTER COLUMN content DROP NOT NULL;

-- Converter analysis_summary de TEXT para JSONB
ALTER TABLE profile_content_base 
  ALTER COLUMN analysis_summary TYPE JSONB 
  USING CASE 
    WHEN analysis_summary IS NULL THEN NULL 
    WHEN analysis_summary ~ '^[{\[]' THEN analysis_summary::jsonb
    ELSE jsonb_build_object('text', analysis_summary)
  END;
```

### Migration 2: Corrigir `instagram_posts`

```sql
-- Renomear colunas para nomes esperados
ALTER TABLE instagram_posts RENAME COLUMN shortcode TO short_code;
ALTER TABLE instagram_posts RENAME COLUMN post_url TO url;
ALTER TABLE instagram_posts RENAME COLUMN image_url TO display_url;
ALTER TABLE instagram_posts RENAME COLUMN views_count TO video_view_count;
ALTER TABLE instagram_posts RENAME COLUMN posted_at TO timestamp;

-- Adicionar colunas faltantes
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS video_play_count INTEGER DEFAULT 0;
ALTER TABLE instagram_posts ADD COLUMN IF NOT EXISTS ai_video_transcription JSONB;

-- Constraint UNIQUE para o upsert funcionar
ALTER TABLE instagram_posts 
  ADD CONSTRAINT instagram_posts_profile_short_code_unique 
  UNIQUE (profile_id, short_code);
```

### Verificação adicional

Após a migration, vou:
1. Conferir se `useInstagramPostsFromDB` e demais hooks/edge functions referenciam algum nome de coluna ainda incompatível.
2. Confirmar que `analyze-profile-content` consegue ler posts e salvar análise.
3. Pedir para você re-sincronizar os posts de um perfil de teste e gerar a análise.

## Por que não alterar o código

- O schema "novo" já é usado por **6+ edge functions** (`analyze-profile-content`, `instagram-posts-scraper`, `analyze-creative`, `transcribe-video`, etc.) e por **vários hooks/componentes** do frontend.
- Renomear no banco é uma mudança atômica em 1 lugar; alterar no código exigiria editar dezenas de arquivos com risco de quebrar mais coisas.
- O schema novo é semanticamente correto (ex: `display_url` vs `image_url` cobre vídeos também).

Após a aprovação, executo as migrations e verifico que o fluxo funciona ponta a ponta.
