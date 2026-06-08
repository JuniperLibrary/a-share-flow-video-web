import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, badge, meta, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-none">
            {title}
          </h1>
          {badge}
        </div>
        {meta && <div className="flex items-center gap-3 text-sm text-ink-3">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}
