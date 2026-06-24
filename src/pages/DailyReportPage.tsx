import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button, DatePicker, Message as ArcoMessage } from '@arco-design/web-react';
import { IconRefresh, IconDownload, IconImage } from '@arco-design/web-react/icon';
import { Loader2 } from 'lucide-react';
import { api } from '../api';
import { EmptyState } from '../components/ui/empty-state';
import { SocialKnowledgeCard } from '../components/daily-report/SocialKnowledgeCard';
import { BloombergHeader } from '../components/daily-report/BloombergHeader';
import { MarketOverview } from '../components/daily-report/MarketOverview';
import { SectorFlowTable } from '../components/daily-report/SectorFlowTable';
import { TimelinePanel } from '../components/daily-report/TimelinePanel';
import { NewsBriefs } from '../components/daily-report/NewsBriefs';
import { AnalysisPanel } from '../components/daily-report/AnalysisPanel';
import {
  SOCIAL_CARD_FORMATS,
  exportAllCards,
  exportCardPng,
  previewScale,
  type SocialCardFormat,
} from '../lib/social-card';
import { cn } from '../lib/utils';
import type { DailyReport } from '../types';

export function DailyReportPage() {
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [format, setFormat] = useState<SocialCardFormat>('xhs');
  const [showCards, setShowCards] = useState(false);

  const parsed = useMemo(() => {
    if (!report?.report) return null;
    try {
      const obj = JSON.parse(report.report);
      report._parsed = obj;
      return obj as NonNullable<DailyReport['_parsed']>;
    } catch {
      return null;
    }
  }, [report]);

  const cards = parsed?.cards ?? [];
  const spec = SOCIAL_CARD_FORMATS[format];
  const scale = previewScale(format);
  const previewHeight = spec.height * scale;

  const selectedIdx = useMemo(() => {
    if (!selectedDate || dates.length === 0) return -1;
    return dates.indexOf(selectedDate);
  }, [selectedDate, dates]);

  const handlePrevDate = useCallback(() => {
    if (selectedIdx > 0) {
      setSelectedDate(dates[selectedIdx - 1]);
    }
  }, [selectedIdx, dates]);

  const handleNextDate = useCallback(() => {
    if (selectedIdx < dates.length - 1) {
      setSelectedDate(dates[selectedIdx + 1]);
    }
  }, [selectedIdx, dates]);

  useEffect(() => {
    loadDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadReport(selectedDate);
    } else {
      setReport(null);
    }
  }, [selectedDate]);

  useEffect(() => {
    setActiveCard(0);
    exportRefs.current = [];
  }, [report?.date, cards.length, format]);

  async function loadDates() {
    try {
      const data = await api.getDailyReportDates();
      setDates(data.dates || []);
      if (data.dates?.length > 0) {
        setSelectedDate(data.dates[0]);
      }
    } catch {}
    setLoading(false);
  }

  async function loadReport(date: string) {
    try {
      const data = await api.getDailyReport(date);
      setReport(data);
    } catch {
      setReport(null);
    }
  }

  async function handleGenerate() {
    const date = selectedDate || new Date().toISOString().slice(0, 10);
    if (!selectedDate) setSelectedDate(date);
    setGenerating(true);
    try {
      const data = await api.generateDailyReport(date);
      if (data.report) {
        try {
          data._parsed = JSON.parse(data.report);
        } catch {} 
      }
      setReport(data);
      if (!dates.includes(date)) {
        setDates((prev) => [date, ...prev]);
      }
    } catch {
      ArcoMessage.error('生成日报失败，请确认当日已有板块数据');
    }
    setGenerating(false);
  }

  async function handleDownloadCurrent() {
    const el = exportRefs.current[activeCard];
    if (!el || !report) return;
    setDownloading(true);
    try {
      await exportCardPng(
        el,
        `日报_${report.date || selectedDate}_${activeCard + 1}_${spec.label}.png`,
        format,
      );
    } catch (err) {
      ArcoMessage.error('导出失败');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadAll() {
    if (!report) return;
    const elements = exportRefs.current.filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;
    setDownloading(true);
    try {
      await exportAllCards(elements, report.date || selectedDate, format);
      ArcoMessage.success(`已导出 ${elements.length} 张${spec.label}卡片`);
    } catch (err) {
      ArcoMessage.error('批量导出失败');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-3" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BloombergHeader
        date={selectedDate}
        session={report?.session || 'full'}
        generated={report?.generated}
        loading={generating}
        onGenerate={handleGenerate}
        onPrevDate={selectedIdx > 0 ? handlePrevDate : undefined}
        onNextDate={selectedIdx >= 0 && selectedIdx < dates.length - 1 ? handleNextDate : undefined}
        hasPrev={selectedIdx > 0}
        hasNext={selectedIdx >= 0 && selectedIdx < dates.length - 1}
      />

      <div className="flex items-center gap-3">
        <DatePicker
          style={{ width: 160 }}
          value={selectedDate}
          onChange={(v) => setSelectedDate(v || '')}
          placeholder="选择日期"
        />
        <Button
          type="primary"
          loading={generating}
          onClick={handleGenerate}
          icon={<IconRefresh />}
          className="!bg-primary !border-primary !text-primary-ink !font-semibold border-0"
          size="small"
        >
          {generating ? '生成中…' : '生成日报'}
        </Button>
      </div>

      {!report ? (
        <EmptyState
          title="暂无日报"
          description={
            selectedDate
              ? '该日期还没有日报，点击「生成日报」创建'
              : '选择一个日期或点击生成按钮'
          }
        />
      ) : (
        <>
          <MarketOverview
            netTotal={report.netTotal ?? parsed?.netTotal ?? 0}
            inflowCount={report.inflowCount ?? parsed?.inflowCount ?? 0}
            outflowCount={report.outflowCount ?? parsed?.outflowCount ?? 0}
            superNetTotal={report.superNetTotal ?? parsed?.superNetTotal ?? 0}
            bigNetTotal={report.bigNetTotal ?? parsed?.bigNetTotal ?? 0}
            structureDesc={report.structureDesc ?? parsed?.structureDesc ?? ''}
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <SectorFlowTable
              topInflows={parsed?.topInflows ?? []}
              topOutflows={parsed?.topOutflows ?? []}
            />
            <TimelinePanel events={parsed?.timeline ?? []} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <NewsBriefs news={parsed?.newsBriefs ?? []} />
            <AnalysisPanel
              summary={report.summary || parsed?.summary || ''}
              outlook={report.outlook || parsed?.outlook || ''}
            />
          </div>

          {cards.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setShowCards(!showCards)}
                className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-2">
                  <IconImage className="h-4 w-4 text-ink-3" />
                  <span className="text-sm font-semibold text-white">社交知识卡片</span>
                  <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-ink-3">
                    {cards.length} 张
                  </span>
                </div>
                <span className={cn('text-xs text-ink-3 transition-transform', showCards && 'rotate-180')}>
                  ▼
                </span>
              </button>

              {showCards && (
                <div className="border-t border-white/[0.06] px-5 py-4">
                  <div className="mb-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-3">发布格式</span>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as SocialCardFormat)}
                        className="rounded-lg border border-white/[0.06] bg-black/40 px-2 py-1 text-xs text-white outline-none"
                      >
                        <option value="xhs">小红书 3:4</option>
                        <option value="douyin">抖音 9:16</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="mini"
                        onClick={handleDownloadCurrent}
                        loading={downloading}
                        icon={<IconDownload />}
                      >
                        下载当前卡片
                      </Button>
                      <Button
                        size="mini"
                        type="outline"
                        onClick={handleDownloadAll}
                        loading={downloading}
                        icon={<IconDownload />}
                      >
                        下载全部 ({cards.length} 张)
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {cards.map((card, idx) => (
                      <button
                        key={card.index}
                        type="button"
                        onClick={() => setActiveCard(idx)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition-colors',
                          activeCard === idx
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-hairline bg-black/20 text-ink-3 hover:text-ink-2',
                        )}
                      >
                        第 {card.index} 张 · {card.tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col items-center">
                    <p className="mb-3 text-xs text-ink-3">
                      预览比例 {spec.hint} · 导出为 PNG 可直接上传
                    </p>
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
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
