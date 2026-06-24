import { Newspaper, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsBrief } from '@/types';

interface NewsBriefsProps {
  news: NewsBrief[];
}

const levelConfig = {
  A: { label: '重要', icon: AlertCircle, className: 'text-inflow bg-inflow/10 border-inflow/20' },
  B: { label: '关注', icon: AlertTriangle, className: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  C: { label: '一般', icon: Info, className: 'text-ink-2 bg-white/[0.04] border-white/[0.06]' },
} as const;

function getLevelConfig(level: string) {
  return levelConfig[level as keyof typeof levelConfig] || levelConfig.C;
}

export function NewsBriefs({ news }: NewsBriefsProps) {
  if (!news || news.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-ink-3" />
          <span className="text-sm font-semibold text-white">新闻简报</span>
        </div>
        <div className="py-6 text-center text-xs text-ink-3">暂无新闻数据</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-ink-3" />
        <span className="text-sm font-semibold text-white">新闻简报</span>
        <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-ink-3">
          {news.length} 条
        </span>
      </div>

      <div className="space-y-2">
        {news.map((item, i) => {
          const cfg = getLevelConfig(item.level);
          const Icon = cfg.icon;
          return (
            <div
              key={`${item.time}-${i}`}
              className="group rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-white/[0.06] hover:bg-white/[0.02]"
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    'mt-0.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                    cfg.className,
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {cfg.label}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-3">{item.time}</span>
                    {item.sectors && item.sectors.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.sectors.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-white/[0.04] px-1 py-0.5 text-[10px] text-ink-2"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-white">{item.title}</div>
                  {item.brief && (
                    <div className="mt-0.5 text-[11px] leading-relaxed text-ink-3">{item.brief}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
