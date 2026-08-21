import * as React from "react";
import { cn } from "@/lib/utils";

const SocialCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border backdrop-blur-xl shadow-lg transition-all duration-300",
      className
    )}
    style={{
      background: 'hsl(var(--social-glass-bg))',
      borderColor: 'hsl(var(--social-glass-border))'
    }}
    {...props}
  />
));
SocialCard.displayName = "SocialCard";

const SocialCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
SocialCardHeader.displayName = "SocialCardHeader";

const SocialCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
SocialCardTitle.displayName = "SocialCardTitle";

const SocialCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SocialCardDescription.displayName = "SocialCardDescription";

const SocialCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
SocialCardContent.displayName = "SocialCardContent";

const SocialCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
SocialCardFooter.displayName = "SocialCardFooter";

export { 
  SocialCard, 
  SocialCardHeader, 
  SocialCardFooter, 
  SocialCardTitle, 
  SocialCardDescription, 
  SocialCardContent 
};
