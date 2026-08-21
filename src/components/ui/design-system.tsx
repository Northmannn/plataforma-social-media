import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./button";
import { LucideIcon } from "lucide-react";

/**
 * Design System Components
 * Componentes reutilizáveis baseados nos padrões do módulo Social
 */

// ============= TYPOGRAPHY =============

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTitle = ({ children, className }: PageTitleProps) => (
  <h1 className={cn("text-2xl font-light text-foreground mb-2", className)}>
    {children}
  </h1>
);

export const PageSubtitle = ({ children, className }: PageTitleProps) => (
  <p className={cn("text-muted-foreground text-sm", className)}>
    {children}
  </p>
);

export const CardTitle = ({ children, className }: PageTitleProps) => (
  <h3 className={cn("text-base font-medium text-foreground", className)}>
    {children}
  </h3>
);

export const MetricLabel = ({ children, className }: PageTitleProps) => (
  <p className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wider", className)}>
    {children}
  </p>
);

export const MetricValue = ({ children, className }: PageTitleProps) => (
  <p className={cn("text-3xl font-bold text-foreground", className)}>
    {children}
  </p>
);

// ============= CONTAINERS =============

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const GlassContainer = ({ 
  children, 
  className, 
  hover = false,
  padding = "lg"
}: GlassContainerProps) => {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6"
  };

  return (
    <div 
      className={cn(
        "rounded-2xl border backdrop-blur-xl shadow-lg",
        hover && "transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]",
        paddingClasses[padding],
        className
      )}
      style={{ 
        background: 'hsl(var(--social-glass-bg))',
        borderColor: 'hsl(var(--social-glass-border))'
      }}
    >
      {children}
    </div>
  );
};

export const CompactCard = ({ 
  children, 
  className,
  hover = false
}: GlassContainerProps) => {
  return (
    <div 
      className={cn(
        "p-4 rounded-xl border bg-background/50 backdrop-blur-sm",
        hover && "transition-all duration-300 hover:shadow-lg hover:scale-[1.01]",
        className
      )}
    >
      {children}
    </div>
  );
};

// ============= BUTTONS =============

interface PrimaryButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const PrimaryButton = ({ children, className, ...props }: PrimaryButtonProps) => (
  <Button 
    className={cn("bg-[#05e6cc] hover:bg-[#04cdb8] text-gray-900 font-medium", className)}
    {...props}
  >
    {children}
  </Button>
);

// ============= NAVIGATION =============

interface NavItemProps {
  active?: boolean;
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export const NavItem = ({ 
  active = false, 
  icon: Icon, 
  label, 
  description,
  onClick,
  className
}: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 border backdrop-blur-sm",
        active 
          ? "bg-primary/20 border-primary/50 text-foreground" 
          : "bg-background/50 border-border hover:bg-accent text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <div className={cn(
        "p-2 rounded-lg",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          "text-sm font-medium",
          active ? "text-primary" : "text-foreground"
        )}>
          {label}
        </h4>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </button>
  );
};

// ============= STATES =============

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {description}
      </p>
      {action && (
        <PrimaryButton onClick={action.onClick}>
          {action.label}
        </PrimaryButton>
      )}
    </div>
  );
};

interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingState = ({ size = "md", className }: LoadingStateProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size])} />
    </div>
  );
};

// ============= METRICS =============

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  className?: string;
}

export const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  description,
  className 
}: MetricCardProps) => {
  return (
    <GlassContainer className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      <MetricLabel className="mb-2">{label}</MetricLabel>
      <MetricValue className="mb-1">{value}</MetricValue>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </GlassContainer>
  );
};
