import React from 'react';
import { ContentPreviewData } from "./content-preview";

export interface GlassIconsItem {
  icon: React.ReactElement;
  color: string;
  label: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  customClass?: string;
  previewData?: ContentPreviewData;
}

export interface GlassIconsProps {
  items: GlassIconsItem[];
  className?: string;
  size?: 'default' | 'small';
}

const gradientMapping: Record<string, string> = {
  blue: 'linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))',
  purple: 'linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))',
  red: 'linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))',
  indigo: 'linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))',
  orange: 'linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))',
  green: 'linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))',
  
  // Tons de cinza para conteúdos
  gray: 'linear-gradient(hsl(215, 15%, 50%), hsl(215, 10%, 40%))',
  slate: 'linear-gradient(hsl(220, 10%, 45%), hsl(220, 8%, 35%))',
  
  // Cores pastel para subpastas
  'blue-light': 'linear-gradient(hsl(223, 60%, 70%), hsl(208, 60%, 60%))',
  'purple-light': 'linear-gradient(hsl(283, 60%, 70%), hsl(268, 60%, 60%))',
  'red-light': 'linear-gradient(hsl(3, 60%, 70%), hsl(348, 60%, 60%))',
  'indigo-light': 'linear-gradient(hsl(253, 60%, 70%), hsl(238, 60%, 60%))',
  'orange-light': 'linear-gradient(hsl(43, 60%, 70%), hsl(28, 60%, 60%))',
  'green-light': 'linear-gradient(hsl(123, 50%, 65%), hsl(108, 50%, 55%))'
};

const GlassIcons: React.FC<GlassIconsProps> = ({ items, className, size = 'default' }) => {
  const getBackgroundStyle = (color: string): React.CSSProperties => {
    if (gradientMapping[color]) {
      return { background: gradientMapping[color] };
    }
    return { background: color };
  };

  const iconSize = size === 'small' ? 'w-[5em] h-[5em]' : 'w-[8em] h-[8em]';
  const innerIconSize = size === 'small' ? 'w-[1.8em] h-[1.8em]' : 'w-[2.5em] h-[2.5em]';
  const gridGap = size === 'small' ? 'gap-[0.75em]' : 'gap-[3em]';

  return (
    <div className={`grid ${gridGap} grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mx-auto py-[2em] overflow-visible ${className || ''}`}>
      {items.map((item, index) => {
        const iconButton = (
          <button
            key={index}
            type="button"
            aria-label={item.label}
            onClick={item.onClick}
            onContextMenu={item.onContextMenu}
            className={`relative bg-transparent outline-none ${iconSize} [perspective:24em] [transform-style:preserve-3d] [-webkit-tap-highlight-color:transparent] group ${
              item.customClass || ''
            }`}
          >
            <span
              className="absolute top-0 left-0 w-full h-full rounded-[1.5em] block transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] origin-[100%_100%] rotate-[15deg] group-hover:[transform:rotate(25deg)_translate3d(-0.5em,-0.5em,0.5em)]"
              style={{
                ...getBackgroundStyle(item.color),
                boxShadow: '0.5em -0.5em 0.75em hsla(223, 10%, 10%, 0.15)'
              }}
            ></span>

            <span
              className="absolute top-0 left-0 w-full h-full rounded-[1.5em] bg-[hsla(0,0%,100%,0.15)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] origin-[80%_50%] flex backdrop-blur-[0.75em] [-webkit-backdrop-filter:blur(0.75em)] transform group-hover:[transform:translateZ(2em)]"
              style={{
                boxShadow: '0 0 0 0.1em hsla(0, 0%, 100%, 0.3) inset'
              }}
            >
              <span className={`m-auto ${innerIconSize} flex items-center justify-center`} aria-hidden="true">
                {item.icon}
              </span>
            </span>

            <span className="absolute top-full left-0 right-0 text-center whitespace-nowrap leading-[1.8] text-sm pt-1 opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] translate-y-0 group-hover:opacity-100 group-hover:[transform:translateY(20%)]">
              {item.label}
            </span>
          </button>
        );

        return iconButton;
      })}
    </div>
  );
};

export default GlassIcons;
