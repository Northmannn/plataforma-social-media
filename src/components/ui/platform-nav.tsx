import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";
import { Users, LayoutDashboard, FileText, Library, Settings, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const SUB_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, path: "/social", label: "Dashboard" },
  { id: "analise", icon: Users, path: "/social/analise", label: "Análise" },
  { id: "criacao", icon: FileText, path: "/social/criacao", label: "Criação" },
  { id: "bases", icon: Library, path: "/social/bases", label: "Bases" },
  { id: "config", icon: Settings, path: "/social/configuracoes", label: "Configurações" },
] as const;

const getActiveIndex = (pathname: string): number => {
  if (pathname === "/social") return 0;
  if (pathname.startsWith("/social/analise")) return 1;
  if (pathname.startsWith("/social/criacao")) return 2;
  if (pathname.startsWith("/social/bases")) return 3;
  if (pathname.startsWith("/social/configuracoes")) return 4;
  return 0;
};

export const PlatformNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, isLoading } = useAuth();
  const activeIndex = getActiveIndex(location.pathname);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slider, setSlider] = useState({ x: 0, width: 0 });
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [ripple, setRipple] = useState<number | null>(null);

  const sliderTarget = hovered !== null ? hovered : activeIndex;
  const isHoverMode = hovered !== null && hovered !== activeIndex;

  const updateSlider = useCallback(() => {
    const el = itemRefs.current[sliderTarget];
    const container = containerRef.current;
    if (!el || !container) return;
    setSlider({
      x: el.offsetLeft,
      width: el.offsetWidth,
    });
    setReady(true);
  }, [sliderTarget]);

  useEffect(() => {
    updateSlider();
  }, [updateSlider]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => updateSlider());
    ro.observe(container);
    return () => ro.disconnect();
  }, [updateSlider]);

  const handleClick = (i: number, path: string) => {
    setRipple(i);
    navigate(path);
  };

  const getInitials = (email: string) => {
    if (!email) return "..";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return email.slice(0, 2).toUpperCase();
  };

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

  return (
    <>
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[49] pointer-events-none motion-reduce:hidden"
        style={{
          width: 500,
          height: 120,
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* VIVER DE IA watermark */}
      <span
        className="fixed top-5 right-6 z-50 text-[11px] uppercase tracking-[0.2em] font-medium text-white/20 hover:text-white/40 transition-colors duration-300 cursor-default select-none"
      >
        Viver de IA
      </span>

      <nav
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        aria-label="Navegação principal"
      >
        <div
          ref={containerRef}
          className="relative flex items-center rounded-2xl"
          style={{
            padding: '4px 5px',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* User avatar dropdown */}
          <div className="flex items-center gap-0 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center ml-1 cursor-pointer hover:bg-emerald-500/25 transition-colors focus:outline-none">
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-400 select-none">{getInitials(userEmail)}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={12} className="w-52 bg-black/80 backdrop-blur-xl border-white/10 z-50">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail ? userEmail.split("@")[0] : "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userEmail || "Carregando..."}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-px h-5 bg-white/[0.08] mx-2.5" />
          </div>

          {/* Slider */}
          {ready && (
            <div
              className="absolute pointer-events-none"
              style={{
                height: 'calc(100% - 8px)',
                top: 4,
                left: 0,
                width: slider.width,
                background: isHoverMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                boxShadow: isHoverMode ? 'none' : '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                borderRadius: 13,
                transform: `translateX(${slider.x}px)`,
                transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.1, 1), width 0.35s cubic-bezier(0.4, 0, 0.1, 1), background 0.2s ease, box-shadow 0.2s ease',
              }}
            />
          )}

          {SUB_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeIndex === i;

            return (
              <button
                key={item.id}
                ref={(el) => { itemRefs.current[i] = el; }}
                onClick={() => handleClick(i, item.path)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex items-center rounded-[13px] px-4 py-[9px] cursor-pointer z-[1]"
                style={{ gap: 7 }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  size={15}
                  className="transition-all duration-200"
                  style={{
                    opacity: isActive ? 1 : 0.7,
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
                <span
                  className={cn(
                    "text-[13px] tracking-[-0.01em] transition-colors duration-200",
                    isActive && "font-medium"
                  )}
                  style={{
                    color: isActive
                      ? 'rgba(255,255,255,0.95)'
                      : hovered === i
                        ? 'rgba(255,255,255,0.7)'
                        : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {item.label}
                </span>

                {/* Dot emerald */}
                {isActive && (
                  <div
                    className="absolute bottom-[3px] left-1/2 w-[3px] h-[3px] rounded-full bg-emerald-500"
                    style={{
                      boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
                      animation: 'dot-bounce-in 0.3s ease-out forwards',
                    }}
                  />
                )}

                {/* Ripple */}
                {ripple === i && (
                  <div
                    className="absolute inset-0 rounded-[13px] pointer-events-none"
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      animation: 'nav-ripple 0.6s ease-out forwards',
                    }}
                    onAnimationEnd={() => setRipple(null)}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
