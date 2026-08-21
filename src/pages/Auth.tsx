import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsWithSlider, TabsContent, TabsListWithSlider, TabsTriggerWithSlider } from "@/components/ui/tabs-with-slider";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/social/criacao`,
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email já está cadastrado. Faça login.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Conta criada com sucesso! Você já pode fazer login.");
      }
    } catch {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Login realizado com sucesso!");
        navigate('/');
      }
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <div className="space-y-4 text-center flex flex-col items-center">
            <img src="/logo-viver-de-ia.png" alt="Viver de IA" className="h-14 w-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Faça login ou crie sua conta para começar
            </p>
          </div>

          <TabsWithSlider defaultValue="login" className="w-full">
            <TabsListWithSlider className="grid w-full grid-cols-2">
              <TabsTriggerWithSlider value="login">Login</TabsTriggerWithSlider>
              <TabsTriggerWithSlider value="signup">Criar Conta</TabsTriggerWithSlider>
            </TabsListWithSlider>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="flex justify-center pt-4">
                  <Button type="submit" className="px-12 py-2.5 min-w-[200px]" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                </div>
                <div className="flex justify-center pt-4">
                  <Button type="submit" className="px-12 py-2.5 min-w-[200px]" disabled={isLoading}>
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </TabsWithSlider>
        </div>
      </div>
    </div>
  );
}
