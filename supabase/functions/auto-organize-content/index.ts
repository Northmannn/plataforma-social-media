import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Usuário não autenticado');
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const userId = user.id;
    console.log('🔄 Iniciando auto-organização para usuário:', userId);

    // 1. Buscar pastas de plataforma do usuário
    const { data: folders, error: foldersError } = await supabase
      .from('content_folders')
      .select('id, platform_name')
      .eq('folder_type', 'platform')
      .eq('user_id', userId);

    if (foldersError) {
      console.error('Erro ao buscar pastas:', foldersError);
      throw foldersError;
    }

    const youtubeFolderId = folders?.find(f => f.platform_name === 'youtube')?.id;
    const instagramFolderId = folders?.find(f => f.platform_name === 'instagram_profiles')?.id;
    const contentBaseFolderId = folders?.find(f => f.platform_name === 'content_base')?.id;

    // 2. Buscar conteúdos
    const { data: youtubeVideos } = await supabase
      .from('youtube_videos')
      .select('id');

    const { data: instagramProfiles } = await supabase
      .from('instagram_profiles')
      .select('id');

    const { data: contentBases } = await supabase
      .from('profile_content_base')
      .select('id');

    // Buscar content_scripts do usuário que NÃO estão em nenhuma pasta
    const { data: allScripts } = await supabase
      .from('content_scripts')
      .select('id, type')
      .eq('user_id', userId);

    const { data: existingScriptLinks } = await supabase
      .from('folder_contents')
      .select('content_id')
      .eq('content_type', 'content_script')
      .eq('user_id', userId);

    const linkedScriptIds = new Set(existingScriptLinks?.map(l => l.content_id) || []);
    const unfiledScripts = allScripts?.filter(s => !linkedScriptIds.has(s.id)) || [];

    // 3. Preparar inserções
    interface FolderContentInsert {
      folder_id: string;
      content_type: string;
      content_id: string;
      user_id: string;
    }
    const inserts: FolderContentInsert[] = [];

    if (youtubeFolderId && youtubeVideos) {
      youtubeVideos.forEach(video => {
        inserts.push({
          folder_id: youtubeFolderId,
          content_type: 'youtube_video',
          content_id: video.id,
          user_id: userId,
        });
      });
    }

    if (instagramFolderId && instagramProfiles) {
      instagramProfiles.forEach(profile => {
        inserts.push({
          folder_id: instagramFolderId,
          content_type: 'instagram_profile',
          content_id: profile.id,
          user_id: userId,
        });
      });
    }

    if (contentBaseFolderId && contentBases) {
      contentBases.forEach(base => {
        inserts.push({
          folder_id: contentBaseFolderId,
          content_type: 'profile_content_base',
          content_id: base.id,
          user_id: userId,
        });
      });
    }

    // Auto-criar pasta "Roteiros" se houver scripts sem pasta
    if (unfiledScripts.length > 0) {
      let scriptsFolderId: string | null = null;
      
      const { data: existingScriptsFolder } = await supabase
        .from('content_folders')
        .select('id')
        .eq('platform_name', 'content_scripts')
        .eq('folder_type', 'platform')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingScriptsFolder) {
        scriptsFolderId = existingScriptsFolder.id;
      } else {
        const { data: newFolder } = await supabase
          .from('content_folders')
          .insert({
            name: 'Roteiros & Conteúdos',
            icon: 'file-text',
            color: 'emerald',
            folder_type: 'platform',
            platform_name: 'content_scripts',
            order_index: 3,
            user_id: userId,
          })
          .select('id')
          .single();
        
        scriptsFolderId = newFolder?.id || null;
      }

      if (scriptsFolderId) {
        unfiledScripts.forEach(script => {
          inserts.push({
            folder_id: scriptsFolderId!,
            content_type: 'content_script',
            content_id: script.id,
            user_id: userId,
          });
        });
      }
    }

    console.log(`📥 Preparando ${inserts.length} inserções...`);

    // 4. Inserir em lote (ignorar duplicatas)
    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('folder_contents')
        .upsert(inserts, { 
          onConflict: 'folder_id,content_type,content_id',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('Erro ao inserir conteúdos:', insertError);
        throw insertError;
      }
    }

    console.log('✅ Auto-organização concluída!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        organized: inserts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro na auto-organização:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
