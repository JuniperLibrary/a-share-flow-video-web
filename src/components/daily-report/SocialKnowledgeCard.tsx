import { cn } from '@/lib/utils';
import {
  SOCIAL_CARD_FORMATS,
  splitTitleLines,
  type SocialCardFormat,
} from '@/lib/social-card';
import type { ReportBullet, ReportCard, ReportHighlight, ReportMetric } from '@/types';

function toneText(tone?: string) {
  if (tone === 'up') return '#f53f3f';
  if (tone === 'down') return '#00b42a';
  return '#b0b8c4';
}

function toneBg(tone?: string) {
  if (tone === 'up') return 'rgba(245,63,63,0.12)';
  if (tone === 'down') return 'rgba(0,180,42,0.12)';
  return 'rgba(255,255,255,0.05)';
}

function toneBorder(tone?: string) {
  if (tone === 'up') return 'rgba(245,63,63,0.28)';
  if (tone === 'down') return 'rgba(0,180,42,0.28)';
  return 'rgba(255,255,255,0.08)';
}

interface SocialKnowledgeCardProps {
  card: ReportCard;
  format: SocialCardFormat;
  className?: string;
}

export function SocialKnowledgeCard({ card, format, className }: SocialKnowledgeCardProps) {
  const spec = SOCIAL_CARD_FORMATS[format];
  const [titleMain, titleAccent] = splitTitleLines(card.title);
  const isTall = format === 'douyin';

  const metrics = (card.metrics ?? []).slice(0, 3);
  const highlights = (card.highlights ?? []).slice(0, isTall ? 6 : 4);
  const bullets = (card.bullets ?? []).slice(0, isTall ? 5 : 4);

  const sectionTitle =
    card.index === 1 ? '盘面数据' : card.index === 2 ? '资讯联动' : '结构拆解';

  return (
    <article
      className={cn('relative overflow-hidden', className)}
      style={{
        width: spec.width,
        height: spec.height,
        fontFamily:
          '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
        background: 'linear-gradient(180deg, #121f38 0%, #0a1224 48%, #070d18 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 0%, rgba(0,212,255,0.14), transparent 40%), radial-gradient(circle at 82% 100%, rgba(245,63,63,0.1), transparent 36%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div
        className="relative flex h-full flex-col"
        style={{
          paddingTop: spec.safeTop,
          paddingBottom: spec.safeBottom,
          paddingLeft: spec.safeX,
          paddingRight: spec.safeX,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <span
            className="inline-flex max-w-[70%] items-center rounded-full border px-5 py-2 text-[28px] font-semibold leading-none"
            style={{
              color: '#f53f3f',
              borderColor: 'rgba(245,63,63,0.35)',
              background: 'rgba(245,63,63,0.12)',
            }}
          >
            {card.tag}
          </span>
          <span className="pt-1 text-[26px] font-mono tabular-nums" style={{ color: '#86909c' }}>
            {card.index}/{card.total}
          </span>
        </div>

        <div className="mt-10 space-y-4">
          <h1
            className="font-bold leading-[1.15] tracking-tight"
            style={{ fontSize: isTall ? 64 : 58, color: '#ffffff' }}
          >
            {titleMain}
            {titleAccent && (
              <span className="block mt-2" style={{ color: '#f53f3f' }}>
                {titleAccent}
              </span>
            )}
          </h1>
          <p
            className="leading-relaxed"
            style={{ fontSize: 30, color: '#b0b8c4', lineHeight: 1.45 }}
          >
            {card.subtitle}
          </p>
        </div>

        {metrics.length > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-4">
            {metrics.map((metric: ReportMetric) => (
              <div
                key={`${card.index}-${metric.label}`}
                className="rounded-[24px] border px-4 py-5"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.22)',
                }}
              >
                <div
                  className="truncate text-[24px] font-medium"
                  style={{ color: '#86909c' }}
                >
                  {metric.label}
                </div>
                <div
                  className="mt-2 font-bold font-mono tabular-nums"
                  style={{ fontSize: 40, color: toneText(metric.tone) }}
                >
                  {metric.value}
                </div>
                {metric.note && (
                  <div
                    className="mt-1 font-mono tabular-nums"
                    style={{ fontSize: 24, color: toneText(metric.tone) }}
                  >
                    {metric.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {highlights.length > 0 && (
          <div className="mt-10 flex-1 min-h-0">
            <div
              className="mb-4 text-center text-[30px] font-bold tracking-wide"
              style={{ color: '#f0ab00' }}
            >
              {card.index === 1 ? '核心板块 / 个股' : sectionTitle}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {highlights.map((item: ReportHighlight, idx: number) => (
                <div
                  key={`${card.index}-hl-${idx}`}
                  className="rounded-[22px] border px-4 py-4"
                  style={{
                    background: toneBg(item.tone),
                    borderColor: toneBorder(item.tone),
                  }}
                >
                  <div
                    className="truncate text-[30px] font-bold"
                    style={{ color: toneText(item.tone) }}
                  >
                    {item.title}
                  </div>
                  <div
                    className="mt-2 text-[24px] leading-snug line-clamp-2"
                    style={{ color: '#86909c' }}
                  >
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bullets.length > 0 && (
          <div className={cn('min-h-0', highlights.length === 0 ? 'mt-10 flex-1' : 'mt-8')}>
            <div
              className="mb-4 text-center text-[30px] font-bold tracking-wide"
              style={{ color: '#f0ab00' }}
            >
              {sectionTitle}
            </div>
            <div className="space-y-3">
              {bullets.map((bullet: ReportBullet, idx: number) => (
                <div
                  key={`${card.index}-b-${idx}`}
                  className="rounded-[22px] border px-5 py-4"
                  style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[24px] font-bold"
                      style={{
                        color: '#00d4ff',
                        background: 'rgba(0,212,255,0.12)',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[28px] font-bold leading-snug"
                        style={{ color: '#f53f3f' }}
                      >
                        {bullet.title}
                      </div>
                      {bullet.detail && (
                        <div
                          className="mt-2 text-[24px] leading-relaxed line-clamp-3"
                          style={{ color: '#b0b8c4' }}
                        >
                          {bullet.detail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 space-y-4">
          {card.footer && (
            <div
              className="rounded-full border px-6 py-4 text-center text-[26px] leading-relaxed"
              style={{
                color: '#00d4ff',
                borderColor: 'rgba(0,212,255,0.25)',
                background: 'rgba(0,212,255,0.1)',
              }}
            >
              {card.footer}
            </div>
          )}
          <div className="flex items-center justify-between gap-4 text-[22px]" style={{ color: '#86909c' }}>
            <span>A股情绪流 · 收盘复盘</span>
            <span>市场有风险，投资需谨慎</span>
          </div>
        </div>
      </div>
    </article>
  );
}
