import * as React from 'react';
import { cn } from '@/lib/utils';

type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  staticOnly?: boolean;
};

interface SidebarProps {
  brand: string;
  subtitle?: string;
  items: NavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  className?: string;
}

export function Sidebar({ brand, subtitle, items, activeKey, onSelect, className }: SidebarProps) {
  const visibleItems = items.filter((item) => !item.staticOnly || true);

  return (
    <aside
      className={cn(
        'hidden md:flex w-[220px] shrink-0 flex-col border-r border-hairline bg-surface-1',
        'shadow-[2px_0_12px_rgba(0,0,0,0.3)]',
        className,
      )}
    >
      <div className="px-4 pt-5 pb-4 border-b border-hairline">
        <h1 className="text-lg font-bold tracking-tight text-ink leading-none">
          📊 {brand}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-xs text-ink-3">{subtitle}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {visibleItems.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={cn(
                'group flex w-[calc(100%-16px)] mx-2 items-center gap-2.5',
                'h-11 px-3 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary-soft text-primary font-semibold'
                  : 'text-ink-3 hover:bg-primary-softer hover:text-primary',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center [&_svg]:h-4 [&_svg]:w-4',
                  isActive ? 'text-primary' : 'text-ink-3 group-hover:text-primary',
                )}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-hairline text-[10px] font-mono text-ink-3 tracking-wide">
        v1.0 · A股情绪流
      </div>
    </aside>
  );
}
