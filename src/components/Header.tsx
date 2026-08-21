import { useNavigate } from "react-router-dom";
import { LogOut, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Header = () => {
  const navigate = useNavigate();
  const { userEmail, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout. Tente novamente.");
    }
  };

  const getInitials = (email: string) => {
    if (!email) return "VD";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-4 left-0 right-0 px-6 z-40 bg-transparent">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none transition-transform duration-200 hover:scale-105">
                <Avatar className="h-10 w-10 cursor-pointer border-2 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : getInitials(userEmail)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-popover border border-border shadow-lg z-50">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userEmail ? userEmail.split("@")[0] : "Usuário"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail || "Carregando..."}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
