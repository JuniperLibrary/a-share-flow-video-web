import { useState, useRef, useCallback } from 'react';
import { Button, Message as ArcoMessage } from '@arco-design/web-react';
import { IconDownload, IconImage } from '@arco-design/web-react/icon';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import {
  SOCIAL_CARD_FORMATS,
  exportAllCards,
  exportCardPng,
  previewScale,
  type SocialCardFormat,
} from '@/lib/social-card';
import { cn } from '@/lib/utils';
import type { DailyReport } from '@/types';
import { MarketOverview } from './MarketOverview';
import { SectorFlowTable } from './SectorFlowTable';
import { TimelinePanel } from './TimelinePanel';
import { NewsBriefs } from './NewsBriefs';
import { AnalysisPanel } from './AnalysisPanel';
import { SocialKnowledgeCard } from './SocialKnowledgeCard';

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function LazyBlock({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<div className="h-40 animate-pulse rounded-xl bg-glass-subtle" />}>
      {children}
    </ErrorBoundary>
  );
}

interface ReportContentProps {
  report: DailyReport;
  parsed: NonNullable<DailyReport['_parsed']>;
  date: string;
}

function ReportContentFallback() {
  return (
    <div className="rounded-xl border border-glass bg-glass border-glass px-4 py-8 text-center text-ink-3">
      日报内容渲染异常
    </div>
  );
}

export function ReportContent({ report, parsed, date }: ReportContentProps) {
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeCard, setActiveCard] = useState(0);
  const [format, setFormat] = useState<SocialCardFormat>('xhs');
  const [showCards, setShowCards] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
  const spec = SOCIAL_CARD_FORMATS[format];
  const scale = previewScale(format);
  const previewHeight = spec.height * scale;

  const handleDownloadCurrent = useCallback(async () => {
    const el = exportRefs.current[activeCard];
    if (!el) return;
    setDownloading(true);
    try {
      await exportCardPng(el, `日报_${date}_${activeCard + 1}_${spec.label}.png`, format);
    } catch {
      ArcoMessage.error('导出失败');
    } finally {
      setDownloading(false);
    }
  }, [activeCard, date, format, spec.label]);

  const handleDownloadAll = useCallback(async () => {
    const elements = exportRefs.current.filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;
    setDownloading(true);
    try {
      await exportAllCards(elements, date, format);
      ArcoMessage.success(`已导出 ${elements.length} 张${spec.label}卡片`);
    } catch {
      ArcoMessage.error('批量导出失败');
    } finally {
      setDownloading(false);
    }
  }, [date, format, spec.label]);

  try {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`${date}-${report.session}`}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <LazyBlock>
            <MarketOverview
              netTotal={report.netTotal ?? parsed.netTotal ?? 0}
              inflowCount={report.inflowCount ?? parsed.inflowCount ?? 0}
              outflowCount={report.outflowCount ?? parsed.outflowCount ?? 0}
              superNetTotal={report.superNetTotal ?? parsed.superNetTotal ?? 0}
              bigNetTotal={report.bigNetTotal ?? parsed.bigNetTotal ?? 0}
              structureDesc={report.structureDesc ?? parsed.structureDesc ?? ''}
            />
          </LazyBlock>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_360px]">
            <LazyBlock>
              <SectorFlowTable topInflows={parsed.topInflows ?? []} topOutflows={parsed.topOutflows ?? []} />
            </LazyBlock>
            <LazyBlock>
              <TimelinePanel events={parsed.timeline ?? []} />
            </LazyBlock>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_360px]">
            <LazyBlock>
              <NewsBriefs news={parsed.newsBriefs ?? []} />
            </LazyBlock>
            <LazyBlock>
              <AnalysisPanel summary={report.summary || parsed.summary || ''} outlook={report.outlook || parsed.outlook || ''} />
            </LazyBlock>
          </div>

          {cards.length > 0 && (
            <div className="mt-4 rounded-xl border border-glass bg-glass border-glass">
              <button
                type="button"
                onClick={() => setShowCards(!showCards)}
                className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors duration-200 hover:bg-glass-sm focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
                aria-expanded={showCards}
              >
                <div className="flex items-center gap-2">
                  <IconImage className="h-4 w-4 text-ink-3" />
                  <span className="text-sm font-semibold text-ink">社交知识卡片</span>
                  <span className="rounded bg-glass-subtle px-1.5 py-0.5 text-[11px] text-ink-3">
                    {cards.length} 张
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: showCards ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-ink-3"
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {showCards && (
                  <motion.div
                    key="social-cards"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-glass"
                  >
                    <div className="px-5 py-4">
                      <div className="mb-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink-3">发布格式</span>
                          <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as SocialCardFormat)}
                            className="rounded-lg border border-glass bg-glass-md border-glass px-2 py-1 text-xs text-ink outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
                          >
                            <option value="xhs">小红书 3:4</option>
                            <option value="douyin">抖音 9:16</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="mini" onClick={handleDownloadCurrent} loading={downloading} icon={<IconDownload />}>
                            下载当前卡片
                          </Button>
                          <Button size="mini" type="outline" onClick={handleDownloadAll} loading={downloading} icon={<IconDownload />}>
                            下载全部 ({cards.length} 张)
                          </Button>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="卡片选择">
                        {cards.map((card, idx) => (
                          <button
                            key={card.index}
                            type="button"
                            role="tab"
                            aria-selected={activeCard === idx}
                            onClick={() => setActiveCard(idx)}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none',
                              activeCard === idx
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-hairline bg-glass-sm border-glass text-ink-3 hover:text-ink-2',
                            )}
                          >
                            第 {card.index} 张 · {card.tag}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col items-center">
                        <p className="mb-3 text-xs text-ink-3">预览比例 {spec.hint} · 导出为 PNG 可直接上传</p>
                        <div
                          className="overflow-hidden rounded-[20px] border border-hairline shadow-lg"
                          style={{ width: spec.width * scale, height: previewHeight }}
                        >
                          <div
                            style={{
                              width: spec.width,
                              height: spec.height,
                              transform: `scale(${scale})`,
                              transformOrigin: 'top left',
                            }}
                          >
                            <SocialKnowledgeCard card={cards[activeCard]} format={format} />
                          </div>
                        </div>
                      </div>

                      <div className="fixed left-[-9999px] top-0" aria-hidden>
                        {cards.map((card, idx) => (
                          <div
                            key={`export-${format}-${card.index}`}
                            ref={(el) => { exportRefs.current[idx] = el; }}
                          >
                            <SocialKnowledgeCard card={card} format={format} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  } catch (err) {
    console.error('ReportContent render error:', err);
    return <ReportContentFallback />;
  }
}
