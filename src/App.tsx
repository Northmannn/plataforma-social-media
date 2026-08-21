import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// import RemixOverlay from "@/components/RemixOverlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/contexts/AuthContext";
import { PlatformNav } from "@/components/ui/platform-nav";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Social from "./pages/Social";
import SocialAnalise from "./pages/social/SocialAnalise";
import SocialAnaliseDetalhada from "./pages/social/SocialAnaliseDetalhada";
import SocialCriacao from "./pages/social/SocialCriacao";
import SocialBases from "./pages/social/SocialBases";
import SocialConfiguracoes from "./pages/social/SocialConfiguracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  return (
    <>
      {!isAuthPage && <PlatformNav />}
      
      <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/social" replace />} />
            <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
            <Route path="/social/analise" element={<ProtectedRoute><SocialAnalise /></ProtectedRoute>} />
            <Route path="/social/analise/:username" element={<ProtectedRoute><SocialAnaliseDetalhada /></ProtectedRoute>} />
            <Route path="/social/criacao" element={<ProtectedRoute><SocialCriacao /></ProtectedRoute>} />
            <Route path="/social/bases" element={<ProtectedRoute><SocialBases /></ProtectedRoute>} />
            <Route path="/social/configuracoes" element={<ProtectedRoute><SocialConfiguracoes /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["dark"]}
      forcedTheme="dark"
    >
      <TooltipProvider>
        {/* <RemixOverlay /> */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
