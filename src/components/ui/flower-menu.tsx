import { useState } from "react";
import { cn } from "@/lib/utils";
import { Workflow, X } from "lucide-react";

type MenuItem = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  label: string;
};

type FlowerMenuProps = {
  menuItems: MenuItem[];
  iconColor?: string;
  backgroundColor?: string;
  animationDuration?: number;
  togglerSize?: number;
};

const MenuToggler = ({
  isOpen,
  onChange,
  backgroundColor,
  iconColor,
  animationDuration,
  togglerSize,
  iconSize,
}: {
  isOpen: boolean;
  onChange: () => void;
  backgroundColor: string;
  iconColor: string;
  animationDuration: number;
  togglerSize: number;
  iconSize: number;
}) => {
  return (
    <>
      <input
        id="menu-toggler"
        type="checkbox"
        checked={isOpen}
        onChange={onChange}
        className="absolute inset-0 z-10 m-auto cursor-pointer opacity-0"
        style={{ width: togglerSize, height: togglerSize }}
      />
      <label
        htmlFor="menu-toggler"
        className="absolute inset-0 z-20 m-auto flex cursor-pointer items-center justify-center rounded-full transition-all shadow-lg"
        style={{
          backgroundColor,
          color: iconColor,
          transitionDuration: `${animationDuration}ms`,
          width: togglerSize,
          height: togglerSize,
          boxShadow: '0 0 30px hsl(var(--primary) / 0.4)',
        }}
      >
        {/* Ícone Workflow quando fechado */}
        <Workflow
          className={cn("absolute transition-all", {
            "opacity-100 scale-100 rotate-0": !isOpen,
            "opacity-0 scale-75 rotate-90": isOpen,
          })}
          style={{
            transitionDuration: `${animationDuration}ms`,
            width: iconSize,
            height: iconSize,
          }}
        />
        
        {/* Ícone X quando aberto */}
        <X
          className={cn("absolute transition-all", {
            "opacity-0 scale-75 -rotate-90": !isOpen,
            "opacity-100 scale-100 rotate-0": isOpen,
          })}
          style={{
            transitionDuration: `${animationDuration}ms`,
            width: iconSize,
            height: iconSize,
          }}
        />
      </label>
    </>
  );
};

const MenuItem = ({
  item,
  index,
  isOpen,
  iconColor,
  backgroundColor,
  animationDuration,
  itemCount,
  itemSize,
  iconSize,
}: {
  item: MenuItem;
  index: number;
  isOpen: boolean;
  iconColor: string;
  backgroundColor: string;
  animationDuration: number;
  itemCount: number;
  itemSize: number;
  iconSize: number;
}) => {
  const Icon = item.icon;
  return (
    <li
      className={cn(`absolute inset-0 m-auto transition-all`, { "opacity-100": isOpen, "opacity-0": !isOpen })}
      style={{
        width: itemSize,
        height: itemSize,
        transform: isOpen
          ? `rotate(${(360 / itemCount) * index}deg) translateX(-${itemSize + 30}px)`
          : "none",
        transitionDuration: `${animationDuration}ms`,
      }}
    >
      <button
        onClick={item.onClick}
        aria-label={item.label}
        className={cn(`flex h-full w-full items-center justify-center rounded-full transition-all duration-200 group hover:scale-125`, {
          "pointer-events-auto": isOpen,
          "pointer-events-none": !isOpen,
        })}
        style={{
          backgroundColor,
          color: iconColor,
          transform: `rotate(-${(360 / itemCount) * index}deg)`,
          transitionDuration: `${animationDuration}ms`,
          boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
        }}
      >
        <Icon
          className="transition-all duration-200 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_hsl(var(--accent))]"
          style={{ width: iconSize, height: iconSize }}
        />
      </button>
    </li>
  );
};

export const FlowerMenu = ({
  menuItems,
  iconColor = "hsl(var(--primary))",
  backgroundColor = "hsl(var(--card))",
  animationDuration = 400,
  togglerSize = 50,
}: FlowerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const itemCount = menuItems.length;
  const itemSize = togglerSize * 1.5;
  const iconSize = Math.max(24, Math.floor(togglerSize * 0.5));

  return (
    <nav className="relative" style={{ width: togglerSize * 4, height: togglerSize * 4 }}>
      <MenuToggler
        isOpen={isOpen}
        onChange={() => setIsOpen(!isOpen)}
        backgroundColor={backgroundColor}
        iconColor={iconColor}
        animationDuration={animationDuration}
        togglerSize={togglerSize}
        iconSize={iconSize}
      />
      <ul className="absolute inset-0 m-0 h-full w-full list-none p-0">
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            item={item}
            index={index}
            isOpen={isOpen}
            iconColor={iconColor}
            backgroundColor={backgroundColor}
            animationDuration={animationDuration}
            itemCount={itemCount}
            itemSize={itemSize}
            iconSize={iconSize}
          />
        ))}
      </ul>
    </nav>
  );
};
