import { FileText, Eye, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AnalysisPanelProps {
  summary: string;
  outlook: string;
}

export function AnalysisPanel({ summary, outlook }: AnalysisPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SummaryCard title="当日总结" text={summary} variant="inflow" />
      <SummaryCard title="后续观察" text={outlook} variant="primary" />
    </div>
  );
}

function SummaryCard({
  title,
  text,
  variant,
}: {
  title: string;
  text: string;
  variant: 'inflow' | 'primary';
}) {
  const [copied, setCopied] = useState(false);

  if (!text) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-5 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          {variant === 'inflow' ? (
            <FileText className="h-4 w-4 text-ink-3" />
          ) : (
            <Eye className="h-4 w-4 text-ink-3" />
          )}
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <div className="py-6 text-center text-xs text-ink-3">暂无数据</div>
      </div>
    );
  }

  const borderColor =
    variant === 'inflow' ? 'border-l-inflow/40' : 'border-l-primary/40';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] border-l-2 bg-black/30 px-4 py-5 backdrop-blur-sm',
        borderColor,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {variant === 'inflow' ? (
            <FileText className="h-4 w-4 text-ink-3" />
          ) : (
            <Eye className="h-4 w-4 text-ink-3" />
          )}
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-ink-3 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-outflow" /> 已复制
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> 复制
            </>
          )}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-ink-2">{text}</p>
    </div>
  );
}
