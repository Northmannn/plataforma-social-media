import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Sparkles } from "lucide-react";
import { useContentScripts } from "@/hooks/useContentScripts";
import { ContentGenerator } from "./ContentGenerator";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  platform: z.string().optional(),
  content: z.string().min(1, "Conteúdo é obrigatório"),
});

interface ScriptEditorProps {
  type: "video" | "post" | "idea";
  profileId?: string | null;
}

const typeLabels = {
  video: "Roteiro de Vídeo",
  post: "Legenda para Post",
  idea: "Ideia de Conteúdo",
};

export const ScriptEditor = ({ type, profileId }: ScriptEditorProps) => {
  const { addScript } = useContentScripts();
  const [isSaving, setIsSaving] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatedMetadata, setGeneratedMetadata] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      platform: "instagram",
      content: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      await addScript.mutateAsync({
        title: values.title,
        content: values.content,
        platform: values.platform || null,
        type,
        metadata: generatedMetadata || null,
      });
      form.reset();
      setGeneratedMetadata(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerated = (data: { title: string; content: string; metadata: any }) => {
    form.setValue("title", data.title);
    form.setValue("content", data.content);
    form.setValue("platform", data.metadata.platform || "instagram");
    setGeneratedMetadata(data.metadata);
  };

  const canGenerate = profileId !== null && profileId !== undefined;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Novo {typeLabels[type]}</span>
              {generatedMetadata?.generated_with_ai && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Gerado com IA
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGenerate}
              onClick={() => setGeneratorOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {canGenerate ? "Gerar com IA" : "Selecione um perfil"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generatedMetadata?.generated_with_ai && (
            <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50 mb-4">
              ✨ Gerado com base em {generatedMetadata.posts_analyzed} posts de @
              {generatedMetadata.profile_username}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Vídeo sobre produtos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plataforma</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a plataforma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          type === "video"
                            ? "Hook:\n[Primeira linha impactante]\n\nDesenvolvimento:\n[Conteúdo principal]\n\nCTA:\n[Chamada para ação]"
                            : type === "post"
                            ? "Escreva a legenda do seu post aqui..."
                            : "Descreva sua ideia de conteúdo..."
                        }
                        className="resize-none min-h-[300px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {profileId && (
        <ContentGenerator
          open={generatorOpen}
          onOpenChange={setGeneratorOpen}
          profileId={profileId}
          contentType={type}
          onGenerated={handleGenerated}
        />
      )}
    </>
  );
};
