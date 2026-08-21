import { Link, useLocation } from "react-router-dom";
import { BarChart3, PenTool, Library } from "lucide-react";
import { cn } from "@/lib/utils";

export const SocialSubNav = () => {
  const location = useLocation();
  
  // Detecta qual modo está ativo baseado na rota
  const isAnaliseMode = location.pathname.startsWith('/social/analise');
  const isCriacaoMode = location.pathname.startsWith('/social/criacao');
  const isBasesMode = location.pathname.startsWith('/social/bases');
  
  return (
    <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-40">
      <div 
        className="backdrop-blur-xl rounded-full shadow-2xl px-2 py-2"
        style={{ background: 'hsl(var(--social-glass-bg))' }}
      >
        <div className="flex gap-1">
          {/* Análise de Perfis */}
          <Link
            to="/social/analise"
            className={cn(
              "px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 transform-gpu",
              "hover:scale-105 hover:bg-white/10 flex items-center gap-2",
              isAnaliseMode 
                ? "bg-white/20 text-white shadow-lg" 
                : "text-white/70 hover:text-white"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Análise de Perfis
          </Link>
          
          {/* Criação de Conteúdo */}
          <Link
            to="/social/criacao"
            className={cn(
              "px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 transform-gpu",
              "hover:scale-105 hover:bg-white/10 flex items-center gap-2",
              isCriacaoMode 
                ? "bg-white/20 text-white shadow-lg" 
                : "text-white/70 hover:text-white"
            )}
          >
            <PenTool className="h-4 w-4" />
            Criação de Conteúdo
          </Link>
          
          {/* Bases de Conteúdo */}
          <Link
            to="/social/bases"
            className={cn(
              "px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 transform-gpu",
              "hover:scale-105 hover:bg-white/10 flex items-center gap-2",
              isBasesMode 
                ? "bg-white/20 text-white shadow-lg" 
                : "text-white/70 hover:text-white"
            )}
          >
            <Library className="h-4 w-4" />
            Bases de Conteúdo
          </Link>
        </div>
      </div>
    </div>
  );
};
