import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  backgroundClass?: string;
}

const CANVAS_ROUTES = ['/social/analise', '/social/criacao', '/social', '/social/configuracoes', '/social/bases'];

export const Layout = ({ children, backgroundClass = "bg-background" }: LayoutProps) => {
  const location = useLocation();
  
  const isCanvasPage = CANVAS_ROUTES.some(route => 
    location.pathname === route || 
    (route !== '/social' && location.pathname.startsWith(route + '/'))
  );
  
  return (
    <div className={`min-h-screen ${backgroundClass}`}>
      {isCanvasPage ? (
        children
      ) : (
        <div className="flex">
          <main className="flex-1 transition-all duration-300 relative z-0 pt-24 p-8">
            {children}
          </main>
        </div>
      )}
    </div>
  );
};
