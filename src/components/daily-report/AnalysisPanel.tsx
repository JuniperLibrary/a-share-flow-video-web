import { FileText, Eye, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AnalysisPanelProps {
  summary: string;
  outlook: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function AnalysisFallback() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-glass bg-glass border-glass px-4 py-5 backdrop-blur-sm">
        <div className="py-6 text-center text-xs text-ink-3">分析加载异常</div>
      </div>
    </div>
  );
}

export function AnalysisPanel({ summary, outlook }: AnalysisPanelProps) {
  try {
    return (
      <motion.div
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:grid-cols-2"
      >
        <SummaryCard title="当日总结" text={summary} variant="inflow" />
        <SummaryCard title="后续观察" text={outlook} variant="primary" />
      </motion.div>
    );
  } catch (err) {
    console.error('AnalysisPanel render error:', err);
    return <AnalysisFallback />;
  }
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
      <motion.div
        variants={cardVariants}
        className="rounded-xl border border-glass bg-glass border-glass px-4 py-5 backdrop-blur-sm"
      >
        <div className="mb-2 flex items-center gap-2">
          {variant === 'inflow' ? (
            <FileText className="h-4 w-4 text-ink-3" />
          ) : (
            <Eye className="h-4 w-4 text-ink-3" />
          )}
          <span className="text-sm font-semibold text-ink">{title}</span>
        </div>
        <div className="py-6 text-center text-xs text-ink-3">暂无数据</div>
      </motion.div>
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
    <motion.div
      variants={cardVariants}
      className={cn(
        'rounded-xl border border-glass border-l-2 bg-glass border-glass px-4 py-5 backdrop-blur-sm transition-colors duration-200',
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
          <span className="text-sm font-semibold text-ink">{title}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-ink-3 transition-colors duration-200 hover:bg-glass-hover hover:text-ink focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-inflow" /> 已复制
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> 复制
            </>
          )}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-ink-2">{text}</p>
    </motion.div>
  );
}
