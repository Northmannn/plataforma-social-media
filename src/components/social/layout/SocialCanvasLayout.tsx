import { ReactNode } from "react";

interface SocialCanvasLayoutProps {
  mode: 'analise' | 'criacao';
  sidebarContent: ReactNode;
  centralContent: ReactNode;
  rightSidebarContent?: ReactNode | null;
  bottomBarContent?: ReactNode | null;
}

export const SocialCanvasLayout = ({
  sidebarContent,
  centralContent,
  rightSidebarContent,
  bottomBarContent
}: SocialCanvasLayoutProps) => {
  return (
    <div className="fixed inset-0 top-[80px] flex flex-col">
      {/* Layout tipo Canvas */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* NÍVEL 3a: Sidebar Esquerda */}
        <aside 
          className="w-[340px] m-4 rounded-2xl border backdrop-blur-md overflow-hidden shadow-2xl"
          style={{
            background: 'hsl(var(--social-glass-bg))',
            borderColor: 'hsl(var(--social-glass-border))'
          }}
        >
          {sidebarContent}
        </aside>
        
        {/* NÍVEL 3c: Área Central */}
        <main className="flex-1 flex flex-col p-4 mr-0 overflow-hidden">
          {centralContent}
        </main>

        {/* NÍVEL 3d: Sidebar Direita (opcional) */}
        {rightSidebarContent && (
          <aside 
            className="w-[340px] m-4 ml-0 rounded-2xl border backdrop-blur-md overflow-hidden shadow-2xl"
            style={{
              background: 'hsl(var(--social-glass-bg))',
              borderColor: 'hsl(var(--social-glass-border))'
            }}
          >
            {rightSidebarContent}
          </aside>
        )}
      </div>
      
      {/* Menu flutuante renderizado diretamente na página */}
    </div>
  );
};
