# Social Design System

Design system completo baseado nos padrões visuais do módulo Social (`/social/analise`).

## 🎨 Cores e Variáveis CSS

### Variáveis Principais
```css
--social-glass-bg: 0 0% 100% / 0.15;        /* Fundo glass (15% opacidade) */
--social-glass-bg-hover: 0 0% 100% / 0.10;  /* Fundo glass hover (10% opacidade) */
--social-glass-bg-active: 0 0% 100% / 0.20; /* Fundo glass ativo (20% opacidade) */
--social-glass-border: 0 0% 100% / 0.1;     /* Borda glass (10% opacidade) */
--social-text-primary: 0 0% 100%;           /* Texto primário */
--social-text-secondary: 0 0% 100% / 0.7;   /* Texto secundário (70% opacidade) */
--social-text-tertiary: 0 0% 100% / 0.5;    /* Texto terciário (50% opacidade) */
```

### Cores de Destaque
```css
--primary: 165 58% 65%;                     /* Turquesa principal (#7dd3c0) */
--accent: 226 100% 68%;                     /* Azul para acentos (#5c7cfa) */
```

### Cores Diretas (uso específico)
- **Primary Turquoise**: `#05e6cc` (botões principais)
- **Primary Turquoise Hover**: `#04cdb8`

---

## 📐 Tipografia

### Hierarquia de Títulos

```tsx
// Título Principal de Página
<h1 className="text-2xl font-light text-foreground mb-2">
  Título da Página
</h1>

// Subtítulo de Página
<p className="text-muted-foreground text-sm">
  Descrição ou contexto da página
</p>

// Título de Card/Seção
<h3 className="text-base font-medium text-foreground">
  Título da Seção
</h3>

// Label de Métrica
<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
  LABEL
</p>

// Valor de Métrica Grande
<p className="text-3xl font-bold text-foreground">
  12.5%
</p>
```

### Fontes
- **Sistema**: Sem fonte customizada, usa font-stack do sistema
- **Pesos**: `font-light` (300), `font-normal` (400), `font-medium` (500), `font-bold` (700)

---

## 🎴 Containers e Cards

### Glass Container Principal
```tsx
<div 
  className="p-6 rounded-2xl border backdrop-blur-xl shadow-lg"
  style={{ 
    background: 'hsl(var(--social-glass-bg))',
    borderColor: 'hsl(var(--social-glass-border))'
  }}
>
  {/* Conteúdo */}
</div>
```

### Glass Container com Hover
```tsx
<div 
  className="p-6 rounded-2xl border backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
  style={{ 
    background: 'hsl(var(--social-glass-bg))',
    borderColor: 'hsl(var(--social-glass-border))'
  }}
>
  {/* Conteúdo */}
</div>
```

### Card Compacto (Métricas)
```tsx
<div className="p-4 rounded-xl border bg-background/50 backdrop-blur-sm">
  {/* Conteúdo */}
</div>
```

---

## 🔘 Botões

### Botão Primário (Turquesa)
```tsx
<Button className="bg-[#05e6cc] hover:bg-[#04cdb8] text-gray-900 font-medium">
  Ação Principal
</Button>
```

### Botão Ghost
```tsx
<Button variant="ghost" size="sm" className="hover:bg-accent/10">
  Ação Secundária
</Button>
```

### Botão Outline
```tsx
<Button variant="outline" size="sm">
  Opção
</Button>
```

### Botão com Ícone (Icon Button)
```tsx
<Button 
  size="sm"
  variant="ghost"
  className="h-8 w-8 p-0 hover:bg-accent transition-all duration-200"
>
  <Download className="h-3.5 w-3.5" />
</Button>
```

---

## 🏷️ Badges

### Badge Padrão
```tsx
<Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-xs font-normal">
  #hashtag
</Badge>
```

### Badge com Cor Customizada
```tsx
<Badge className="bg-primary/20 text-primary border-primary/30">
  Destaque
</Badge>
```

---

## 🧭 Navegação e Estados Ativos

### Item de Navegação (Inativo)
```tsx
<button 
  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 border backdrop-blur-sm bg-background/50 border-border hover:bg-accent text-muted-foreground hover:text-foreground"
>
  <div className="p-2 rounded-lg bg-muted text-muted-foreground">
    <Icon className="w-4 h-4" />
  </div>
  <div className="flex-1 min-w-0">
    <h4 className="text-sm font-medium text-foreground">Label</h4>
    <p className="text-xs text-muted-foreground mt-1">Descrição</p>
  </div>
</button>
```

### Item de Navegação (Ativo)
```tsx
<button 
  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 border backdrop-blur-sm bg-primary/20 border-primary/50 text-foreground"
>
  <div className="p-2 rounded-lg bg-primary text-primary-foreground">
    <Icon className="w-4 h-4" />
  </div>
  <div className="flex-1 min-w-0">
    <h4 className="text-sm font-medium text-primary">Label</h4>
    <p className="text-xs text-muted-foreground mt-1">Descrição</p>
  </div>
</button>
```

---

## 📏 Layout e Espaçamento

### Layout Principal (Canvas)
```tsx
<div className="fixed inset-0 top-[140px] flex flex-col">
  <div className="flex-1 flex overflow-hidden">
    {/* Sidebar */}
    <aside className="w-[340px] m-4 rounded-2xl border backdrop-blur-xl overflow-hidden shadow-2xl"
      style={{ 
        background: 'hsl(var(--social-glass-bg))',
        borderColor: 'hsl(var(--social-glass-border))'
      }}
    >
      {/* Conteúdo Sidebar */}
    </aside>
    
    {/* Área Central */}
    <main className="flex-1 overflow-y-auto px-6 py-8 mr-4">
      {/* Conteúdo */}
    </main>
  </div>
</div>
```

### Grid de Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Cards */}
</div>
```

### Espaçamento Padrão
- **Container padding**: `p-6` (24px)
- **Gap entre elementos**: `gap-4` (16px) ou `gap-6` (24px)
- **Margin bottom títulos**: `mb-2` (8px)
- **Margin top subtítulos**: `mt-2` (8px)

---

## 🎭 Animações

### Fade In
```tsx
<div className="animate-in fade-in duration-500">
  {/* Conteúdo */}
</div>
```

### Slide In
```tsx
<div className="animate-in slide-in-from-bottom-4 duration-300">
  {/* Conteúdo */}
</div>
```

### Hover Scale
```tsx
<div className="transition-all duration-300 hover:scale-[1.02]">
  {/* Conteúdo */}
</div>
```

### Loading Spinner
```tsx
<RefreshCw className="h-4 w-4 animate-spin" />
```

---

## 📝 Formulários e Inputs

### Input Padrão
```tsx
<Input 
  className="bg-background/50 border-border focus:border-primary"
  placeholder="Digite aqui..."
/>
```

### Textarea
```tsx
<Textarea 
  className="bg-background/50 border-border focus:border-primary min-h-[100px]"
  placeholder="Digite aqui..."
/>
```

### Select
```tsx
<Select>
  <SelectTrigger className="bg-background/50 border-border">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opção 1</SelectItem>
  </SelectContent>
</Select>
```

---

## 🎯 Estados Especiais

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
  <h3 className="text-lg font-medium text-foreground mb-2">
    Nenhum item encontrado
  </h3>
  <p className="text-sm text-muted-foreground mb-6">
    Descrição do estado vazio
  </p>
  <Button className="bg-[#05e6cc] hover:bg-[#04cdb8] text-gray-900">
    Ação Principal
  </Button>
</div>
```

### Loading State
```tsx
<div className="flex items-center justify-center py-8">
  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
</div>
```

---

## 📊 Componentes de Dados

### Card de Métrica
```tsx
<div className="p-6 rounded-2xl border backdrop-blur-xl shadow-lg"
  style={{ 
    background: 'hsl(var(--social-glass-bg))',
    borderColor: 'hsl(var(--social-glass-border))'
  }}
>
  <div className="flex items-center justify-between mb-4">
    <div className="p-3 rounded-xl bg-primary/20">
      <Icon className="h-5 w-5 text-primary" />
    </div>
  </div>
  
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
    MÉTRICA
  </p>
  
  <p className="text-3xl font-bold text-foreground mb-1">
    12.5%
  </p>
  
  <p className="text-xs text-muted-foreground">
    Descrição adicional
  </p>
</div>
```

### Tabela Simples
```tsx
<Table>
  <TableHeader>
    <TableRow className="border-border hover:bg-transparent">
      <TableHead className="text-xs font-medium text-muted-foreground uppercase">
        Coluna
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-border hover:bg-accent/5">
      <TableCell className="text-sm text-foreground">Valor</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 🎨 Uso Prático

### Exemplo Completo de Página
```tsx
import { PageTitle, PageSubtitle, GlassContainer, PrimaryButton } from '@/components/ui/design-system';

export const MinhaNovaPage = () => {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <PageTitle>Título da Página</PageTitle>
        <PageSubtitle>Descrição contextual da página</PageSubtitle>
      </div>
      
      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassContainer hover>
          <h3 className="text-base font-medium mb-4">Card 1</h3>
          <p className="text-sm text-muted-foreground">Conteúdo</p>
        </GlassContainer>
        
        <GlassContainer hover>
          <h3 className="text-base font-medium mb-4">Card 2</h3>
          <PrimaryButton>Ação</PrimaryButton>
        </GlassContainer>
      </div>
    </div>
  );
};
```

---

## ✅ Checklist de Implementação

Ao criar novos componentes no módulo Social, certifique-se de:

- [ ] Usar `text-2xl font-light` para títulos principais
- [ ] Usar `text-sm text-muted-foreground` para subtítulos
- [ ] Aplicar glass morphism com variáveis `--social-glass-*`
- [ ] Usar `rounded-2xl` para containers principais
- [ ] Usar `rounded-xl` para elementos internos
- [ ] Aplicar `backdrop-blur-xl` em containers glass
- [ ] Usar botões turquesa (`#05e6cc`) para ações principais
- [ ] Adicionar estados hover com `transition-all duration-300`
- [ ] Manter espaçamento consistente (`p-6`, `gap-4`)
- [ ] Usar ícones de `lucide-react` com tamanho `h-4 w-4` ou `h-5 w-5`
