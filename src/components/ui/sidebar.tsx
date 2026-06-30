import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';

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

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Sidebar({ brand, subtitle, items, activeKey, onSelect, className }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
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

      <div className="px-4 py-3 border-t border-hairline">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-ink-3 tracking-wide">
            v1.0 · A股情绪流
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              'text-ink-3 hover:text-primary hover:bg-primary-softer',
            )}
            title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
