import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useInstagramProfiles } from "@/hooks/useInstagramProfiles";
import { useSyncInstagramPosts } from "@/hooks/useSyncInstagramPosts";
import { invokeFunction } from "@/lib/supabase-functions";
import { toast } from "sonner";

const formSchema = z.object({
  username: z
    .string()
    .min(1, "Username é obrigatório")
    // aceita "@nike", "nike" ou com espaços em volta — normalizado no submit
    .regex(/^\s*@?[a-zA-Z0-9._]+\s*$/, "Use o @username do perfil (sem espaços ou acentos)"),
  display_name: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

interface AddProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preenche e busca automaticamente este perfil ao abrir (vindo da busca por nome). */
  initialUsername?: string;
}

interface ScrapedProfile {
  username: string;
  display_name: string | null;
  bio: string | null;
  follower_count: number | null;
  following_count: number | null;
  post_count: number | null;
  profile_picture_url: string | null;
  is_verified: boolean | null;
}

export const AddProfileDialog = ({ open, onOpenChange, initialUsername }: AddProfileDialogProps) => {
  const { addProfile } = useInstagramProfiles();
  const syncPosts = useSyncInstagramPosts();
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    bio: string | null;
    follower_count: number | null;
    following_count: number | null;
    post_count: number | null;
    profile_picture_url: string | null;
    is_verified: boolean | null;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      display_name: "",
      category: "",
      notes: "",
    },
  });

  // Guarda o último username auto-buscado para não refazer a chamada a cada render.
  const autoFetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      autoFetchedFor.current = null;
      form.reset();
      setProfileData(null);
      setFetchError(null);
      return;
    }
    if (!initialUsername || autoFetchedFor.current === initialUsername) return;

    autoFetchedFor.current = initialUsername;
    form.setValue("username", initialUsername);
    setProfileData(null);
    setFetchError(null);
    handleFetchProfile(initialUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUsername]);

  const handleFetchProfile = async (usernameOverride?: string) => {
    const username = (usernameOverride ?? form.getValues("username")).trim().replace(/^@/, "");

    if (!username) {
      toast.error("Digite um username primeiro");
      return;
    }

    setIsFetching(true);
    setFetchError(null);

    try {
      const data = await invokeFunction<ScrapedProfile>('instagram-profile-scraper', { username });

      form.setValue("display_name", data.display_name || "");
      form.setValue("username", data.username);

      setProfileData({
        bio: data.bio,
        follower_count: data.follower_count,
        following_count: data.following_count,
        post_count: data.post_count,
        profile_picture_url: data.profile_picture_url,
        is_verified: data.is_verified,
      });

      toast.success("Dados do perfil carregados com sucesso!");
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao buscar dados do perfil";
      setFetchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const username = values.username.trim().replace(/^@/, "");

    try {
      setIsSyncing(true);
      
      // 1. Adicionar perfil
      await addProfile.mutateAsync({
        username,
        display_name: values.display_name || null,
        category: values.category || null,
        notes: values.notes || null,
        bio: profileData?.bio || null,
        follower_count: profileData?.follower_count || null,
        following_count: profileData?.following_count || null,
        post_count: profileData?.post_count || null,
        profile_picture_url: profileData?.profile_picture_url || null,
        is_verified: profileData?.is_verified || null,
        tags: null,
      });

      // 2. Sincronizar posts automaticamente
      toast.loading("Sincronizando posts...", { id: "sync-posts" });
      await syncPosts.mutateAsync(username);
      toast.dismiss("sync-posts");
      
      form.reset();
      setProfileData(null);
      setFetchError(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao adicionar perfil:", error);
      toast.dismiss("sync-posts");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Perfil do Instagram</DialogTitle>
          <DialogDescription>
            Adicione um perfil para começar a analisar. Os dados serão obtidos futuramente via API.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="exemplo: @nike ou nike" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleFetchProfile()}
                      disabled={isFetching || !field.value}
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Buscar
                        </>
                      )}
                    </Button>
                  </div>
                  {fetchError && (
                    <p className="text-sm text-destructive">{fetchError}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {profileData && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profileData.profile_picture_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {form.getValues("username").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">@{form.getValues("username")}</p>
                    {profileData.is_verified && (
                      <Badge variant="secondary" className="h-5 mt-1">
                        ✓ Verificado
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Seguidores</p>
                    <p className="font-medium">
                      {profileData.follower_count?.toLocaleString('pt-BR') || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Seguindo</p>
                    <p className="font-medium">
                      {profileData.following_count?.toLocaleString('pt-BR') || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Posts</p>
                    <p className="font-medium">
                      {profileData.post_count?.toLocaleString('pt-BR') || '-'}
                    </p>
                  </div>
                </div>
                
                {profileData.bio && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Bio:</p>
                    <p className="text-sm">{profileData.bio}</p>
                  </div>
                )}
              </Card>
            )}

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Exibição</FormLabel>
                  <FormControl>
                    <Input placeholder="Nike Official" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Marca, Influencer, Concorrente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adicione observações sobre este perfil..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={addProfile.isPending || isSyncing}>
                {isSyncing ? "Sincronizando posts..." : addProfile.isPending ? "Salvando..." : "Adicionar Perfil"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
