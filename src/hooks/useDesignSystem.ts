/**
 * Design System Hook
 * Fornece acesso programático a tokens de design do módulo Social
 */

export const useDesignSystem = () => {
  return {
    // ============= CORES =============
    colors: {
      primary: {
        main: '#05e6cc',
        hover: '#04cdb8',
        hsl: '165 58% 65%',
      },
      accent: {
        main: '#5c7cfa',
        hsl: '226 100% 68%',
      },
      glass: {
        bg: 'hsl(var(--social-glass-bg))',
        bgHover: 'hsl(var(--social-glass-bg-hover))',
        bgActive: 'hsl(var(--social-glass-bg-active))',
        border: 'hsl(var(--social-glass-border))',
      },
      text: {
        primary: 'hsl(var(--social-text-primary))',
        secondary: 'hsl(var(--social-text-secondary))',
        tertiary: 'hsl(var(--social-text-tertiary))',
      },
    },

    // ============= ESPAÇAMENTO =============
    spacing: {
      layout: {
        topOffset: 'top-[140px]',
        sidebarWidth: 'w-[340px]',
        sidebarMargin: 'm-4',
        contentPadding: 'px-6 py-8',
        contentMarginRight: 'mr-4',
      },
      container: {
        none: '',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
      },
      gap: {
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
      },
      margin: {
        titleBottom: 'mb-2',
        subtitleTop: 'mt-2',
      },
    },

    // ============= TIPOGRAFIA =============
    typography: {
      pageTitle: 'text-2xl font-light text-foreground mb-2',
      pageSubtitle: 'text-muted-foreground text-sm',
      cardTitle: 'text-base font-medium text-foreground',
      metricLabel: 'text-xs font-medium text-muted-foreground uppercase tracking-wider',
      metricValue: 'text-3xl font-bold text-foreground',
      body: 'text-sm text-foreground',
      caption: 'text-xs text-muted-foreground',
    },

    // ============= BORDAS E RAIOS =============
    borders: {
      radius: {
        container: 'rounded-2xl',
        card: 'rounded-xl',
        button: 'rounded-lg',
        badge: 'rounded-md',
      },
      width: {
        default: 'border',
        thick: 'border-2',
      },
    },

    // ============= SOMBRAS =============
    shadows: {
      glass: 'shadow-lg',
      glassHover: 'shadow-2xl',
      elevated: 'shadow-xl',
    },

    // ============= EFEITOS =============
    effects: {
      blur: {
        glass: 'backdrop-blur-xl',
        medium: 'backdrop-blur-md',
        light: 'backdrop-blur-sm',
      },
      opacity: {
        glassBg: 'bg-background/50',
        overlay: 'bg-background/80',
      },
    },

    // ============= ANIMAÇÕES =============
    animations: {
      transition: {
        default: 'transition-all duration-300',
        fast: 'transition-all duration-200',
        slow: 'transition-all duration-500',
      },
      fadeIn: 'animate-in fade-in duration-500',
      slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
      hoverScale: 'hover:scale-[1.02]',
      hoverScaleSmall: 'hover:scale-[1.01]',
      spin: 'animate-spin',
    },

    // ============= ESTADOS =============
    states: {
      hover: {
        glass: 'hover:shadow-2xl hover:scale-[1.02]',
        button: 'hover:bg-accent',
        nav: 'hover:bg-accent hover:text-foreground',
      },
      active: {
        nav: 'bg-primary/20 border-primary/50 text-foreground',
        button: 'bg-primary text-primary-foreground',
      },
      disabled: {
        opacity: 'opacity-50',
        cursor: 'cursor-not-allowed',
      },
    },

    // ============= ÍCONES =============
    icons: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
    },

    // ============= GRID E LAYOUT =============
    grid: {
      cols: {
        auto: 'grid-cols-1 md:grid-cols-2',
        triple: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        quadruple: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      },
    },
  };
};

// ============= HELPERS =============

/**
 * Retorna classes Tailwind para um container glass
 */
export const getGlassContainerClasses = (hover = false) => {
  const ds = useDesignSystem();
  return `${ds.borders.radius.container} border ${ds.effects.blur.glass} ${ds.shadows.glass} ${
    hover ? ds.animations.transition.default + ' ' + ds.states.hover.glass : ''
  }`;
};

/**
 * Retorna objeto de estilo inline para glass morphism
 */
export const getGlassContainerStyle = () => {
  const ds = useDesignSystem();
  return {
    background: ds.colors.glass.bg,
    borderColor: ds.colors.glass.border,
  };
};

/**
 * Retorna classes Tailwind para um botão primário turquesa
 */
export const getPrimaryButtonClasses = () => {
  return 'bg-[#05e6cc] hover:bg-[#04cdb8] text-gray-900 font-medium';
};

/**
 * Retorna classes Tailwind para um item de navegação
 */
export const getNavItemClasses = (active = false) => {
  const ds = useDesignSystem();
  return active
    ? `${ds.borders.radius.card} border ${ds.effects.blur.light} ${ds.states.active.nav}`
    : `${ds.borders.radius.card} border ${ds.effects.blur.light} ${ds.effects.opacity.glassBg} border-border ${ds.states.hover.nav}`;
};
