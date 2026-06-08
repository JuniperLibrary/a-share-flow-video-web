import * as React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  title = '暂无数据',
  description,
  icon,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-16',
        'text-ink-3',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          'bg-white/[0.03] border border-hairline text-ink-3',
          compact ? 'h-10 w-10 mb-3' : 'h-14 w-14 mb-4',
        )}
      >
        {icon ?? <Inbox className={compact ? 'h-5 w-5' : 'h-6 w-6'} />}
      </div>
      {title && (
        <p className={cn('text-sm font-medium text-ink-2', compact ? '' : 'text-base')}>
          {title}
        </p>
      )}
      {description && (
        <p className="mt-1 text-xs text-ink-3 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
