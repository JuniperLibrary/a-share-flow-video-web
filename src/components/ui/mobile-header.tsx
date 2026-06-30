import { useTheme } from '@/lib/theme-context';
import { cn } from '@/lib/utils';

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

interface MobileHeaderProps {
  title?: string;
  className?: string;
}

export function MobileHeader({ title = 'A股情绪流', className }: MobileHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={cn(
        'md:hidden flex items-center justify-between px-4 py-3',
        'border-b border-hairline bg-surface-1/80 backdrop-blur-md',
        'sticky top-0 z-50',
        className,
      )}
    >
      <h1 className="text-lg font-bold tracking-tight text-ink">
        📊 {title}
      </h1>
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
          'text-ink-3 hover:text-primary hover:bg-primary-softer',
        )}
        title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
      >
        {theme === 'dark' ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </button>
    </header>
  );
}
