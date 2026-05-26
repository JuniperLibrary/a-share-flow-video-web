import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Input, Pagination } from '@arco-design/web-react';
import { IconRefresh, IconSearch, IconStop } from '@arco-design/web-react/icon';
import { api } from '../api';
import type { CLSNewsRecord, NewsStatusResponse } from '../types';
import { DatePicker } from '../components/ui/date-picker';

const LEVEL_STYLES: Record<string, { bar: string; glow: string; badgeBg: string; badgeText: string; ring: string }> = {
  A: {
    bar: 'bg-rose-500',
    glow: 'rgba(239,68,68,0.06)',
    badgeBg: 'rgba(239,68,68,0.15)',
    badgeText: '#ef4444',
    ring: 'rgba(239,68,68,0.2)',
  },
  B: {
    bar: 'bg-amber-400',
    glow: 'rgba(251,191,36,0.05)',
    badgeBg: 'rgba(251,191,36,0.12)',
    badgeText: '#fbbf24',
    ring: 'rgba(251,191,36,0.15)',
  },
  C: {
    bar: 'bg-gray-500',
    glow: 'transparent',
    badgeBg: 'rgba(107,114,128,0.12)',
    badgeText: '#6b7280',
    ring: 'rgba(107,114,128,0.1)',
  },
};

function parseSectors(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatReadingNum(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

function NewsRow({
  record,
  onSelect,
  index,
}: {
  record: CLSNewsRecord;
  onSelect: (r: CLSNewsRecord) => void;
  index: number;
}) {
  const sectors = parseSectors(record.sectors);
  const style = LEVEL_STYLES[record.level] || LEVEL_STYLES.C;

  return (
    <div
      className="group relative flex items-stretch transition-colors duration-200 cursor-pointer animate-fade-in"
      style={{ animation: `fade-in 0.35s ease-out both`, animationDelay: `${index * 30}ms` }}
      onClick={() => onSelect(record)}
    >
      <div
        className={`w-0.5 shrink-0 self-stretch ${record.level !== 'C' ? style.bar : 'bg-transparent'}`}
      />

      <div className="flex-1 min-w-0 py-3 pl-3 pr-1 transition-colors duration-150 hover:bg-white/[0.02]">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs text-gray-500 font-mono tabular-nums shrink-0 w-16 text-right">
            {record.ctime}
          </span>
          <span
            className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none rounded shrink-0"
            style={{ background: style.badgeBg, color: style.badgeText }}
          >
            {record.level}
          </span>
          <span className="text-sm text-gray-200 leading-snug group-hover:text-white transition-colors">
            {record.title}
          </span>
        </div>

        {record.brief && (
          <p className="text-xs text-gray-500 leading-relaxed ml-[5.25rem]">
            {record.brief}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-1 ml-[5.25rem]">
          {sectors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sectors.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full"
                  style={{
                    background: 'rgba(34,211,238,0.06)',
                    border: '1px solid rgba(34,211,238,0.12)',
                    color: '#22d3ee',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {record.reading_num > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-600 ml-auto">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {formatReadingNum(record.reading_num)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Detail modal ───── */
function NewsModal({
  record,
  onClose,
}: {
  record: CLSNewsRecord;
  onClose: () => void;
}) {
  const sectors = parseSectors(record.sectors);
  const style = LEVEL_STYLES[record.level] || LEVEL_STYLES.C;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] shadow-2xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.06) transparent',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/[0.08] hover:text-gray-300"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 mb-4 pr-8">
          <span
            className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold leading-none rounded"
            style={{ background: style.badgeBg, color: style.badgeText }}
          >
            {record.level}
          </span>
          <span className="text-xs text-gray-500 font-mono">{record.ctime}</span>
          {record.reading_num > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {record.reading_num > 10000
                ? `${(record.reading_num / 10000).toFixed(1)}w`
                : record.reading_num}{' '}
              阅读
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold text-white mb-4 leading-relaxed tracking-wide">
          {record.title}
        </h2>

        {record.content ? (
          <div className="text-sm text-gray-300 leading-[1.75] mb-5 whitespace-pre-wrap">
            {record.content}
          </div>
        ) : record.brief ? (
          <div className="text-sm text-gray-400 leading-relaxed mb-5">
            {record.brief}
          </div>
        ) : null}

        {sectors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {sectors.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2.5 py-1 text-xs rounded-full"
                style={{
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  color: '#22d3ee',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {record.shareurl && (
          <a
            href={record.shareurl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all no-underline"
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: '#60a5fa',
            }}
          >
            查看原文
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

/* ───── Main page ───── */
export function NewsPage() {
  const [mode, setMode] = useState<'live' | 'history'>('live');
  const [records, setRecords] = useState<CLSNewsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQ, setSearchQ] = useState('');
  const [status, setStatus] = useState<NewsStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [selectedNews, setSelectedNews] = useState<CLSNewsRecord | null>(null);
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const replayingRef = useRef(false);

  const loadNews = useCallback(async (p: number, q?: string) => {
    setLoading(true);
    try {
      const offset = (p - 1) * pageSize;
      if (mode === 'history') {
        const res = await api.getNewsByDate(historyDate, pageSize, offset);
        setRecords(res.records);
        setTotal(res.total);
      } else if (q) {
        const res = await api.searchNews(q, pageSize, offset);
        setRecords(res.records);
        setTotal(res.total);
      } else {
        const res = await api.getNews(pageSize, offset);
        setRecords(res.records);
        setTotal(res.total);
      }
    } catch { void 0; } finally {
      setLoading(false);
    }
  }, [pageSize, mode, historyDate]);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await api.getNewsStatus());
    } catch { void 0; }
  }, []);

  useEffect(() => {
    loadNews(page);
  }, [page, loadNews]);

  useEffect(() => {
    if (mode === 'live') {
      loadStatus();
    }
  }, [mode, loadStatus]);

  const handleSearch = () => {
    setPage(1);
    loadNews(1, searchQ.trim() || undefined);
  };

  const handleToggleScheduler = async () => {
    if (status?.status === 'running') {
      await api.stopNews();
    } else {
      await api.startNews();
    }
    loadStatus();
  };

  const isRunning = status?.status === 'running';

  const handleReplay = async () => {
    if (replayingRef.current) return;
    replayingRef.current = true;
    setReplaying(true);
    try {
      await api.replayNews();
      loadStatus();
      loadNews(page);
    } catch { void 0; } finally {
      setReplaying(false);
      replayingRef.current = false;
    }
  };

  const handleModeSwitch = (m: 'live' | 'history') => {
    setMode(m);
    setPage(1);
    setSearchQ('');
  };

  const handleDateChange = (date: string) => {
    if (date) {
      setHistoryDate(date);
      setPage(1);
    }
  };

  const ModeTab = ({ value, label }: { value: 'live' | 'history'; label: string }) => (
    <button
      onClick={() => handleModeSwitch(value)}
      className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
      style={{
        background: mode === value
          ? 'linear-gradient(135deg, #2563eb, #0891b2)'
          : 'rgba(255,255,255,0.04)',
        color: mode === value ? '#fff' : '#6b7280',
        border: mode === value ? 'none' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: mode === value ? '0 0 12px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="relative min-h-screen p-5 lg:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              财联社新闻
            </h1>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-black/20 p-0.5">
              <ModeTab value="live" label="实时" />
              <ModeTab value="history" label="历史" />
            </div>
          </div>

          {mode === 'live' && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 backdrop-blur-xl px-3 py-1.5">
                {isRunning ? (
                  <>
                    <LiveDot />
                    <span className="text-xs text-emerald-400">监控中</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-xs text-gray-500">已停止</span>
                  </>
                )}
                <span className="text-xs text-gray-600 mx-0.5">|</span>
                <span className="text-xs text-gray-500">
                  <span className="text-white font-medium">{status?.total_news ?? 0}</span>
                </span>
                {status?.last_poll && (
                  <>
                    <span className="text-xs text-gray-600 mx-0.5">|</span>
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-400">{new Date(status.last_poll).toLocaleTimeString()}</span>
                      {status.last_count > 0 && (
                        <span className="text-cyan-400 ml-1">+{status.last_count}</span>
                      )}
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={handleReplay}
                disabled={replaying}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 0 16px rgba(59,130,246,0.12)',
                }}
              >
                <IconRefresh style={{ fontSize: 13 }} className={replaying ? 'animate-spin' : ''} />
                {replaying ? '回放中...' : '回放'}
              </button>

              <button
                onClick={handleToggleScheduler}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all"
                style={{
                  background: isRunning ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #2563eb, #0891b2)',
                  color: isRunning ? '#ef4444' : '#fff',
                  border: isRunning ? '1px solid rgba(239,68,68,0.2)' : 'none',
                  boxShadow: isRunning ? 'none' : '0 0 16px rgba(59,130,246,0.12)',
                }}
              >
                {isRunning ? <IconStop style={{ fontSize: 13 }} /> : <IconRefresh style={{ fontSize: 13 }} />}
                {isRunning ? '停止轮询' : '启动轮询'}
              </button>
            </div>
          )}
        </div>

        {/* ── Search + Date (conditionally) ── */}
        <div className="flex items-center gap-3">
          {mode === 'history' && (
            <div className="flex items-center gap-2">
              <DatePicker value={historyDate} onChange={handleDateChange} />
              <span className="text-xs text-gray-500 font-mono">{historyDate} 历史数据</span>
            </div>
          )}
          <div className="relative flex-1" style={{ maxWidth: 360 }}>
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <Input
              placeholder={mode === 'history' ? '搜索该日新闻...' : '搜索新闻标题或正文...'}
              value={searchQ}
              onChange={val => setSearchQ(val)}
              onPressEnter={handleSearch}
              style={{
                width: '100%',
                paddingLeft: 36,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e5e7eb',
                borderRadius: 8,
              }}
            />
          </div>
          <Button
            type="primary"
            icon={<IconSearch />}
            onClick={handleSearch}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #0891b2)',
              border: 'none',
              borderRadius: 8,
            }}
          >
            搜索
          </Button>
        </div>

        {/* ── News list ── */}
        <div className="divide-y divide-white/[0.04]">
          {loading ? (
            <div className="space-y-0 py-12">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-stretch py-3 animate-pulse">
                  <div className="w-0.5 shrink-0 bg-white/5" />
                  <div className="flex-1 pl-3 pr-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className="h-3 w-16 rounded bg-white/5 shrink-0" />
                      <div className="h-3 w-6 rounded bg-white/5 shrink-0" />
                      <div className="h-4 w-3/4 rounded bg-white/5" />
                    </div>
                    <div className="h-3 w-1/2 rounded bg-white/5 ml-[5.25rem]" />
                  </div>
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                {mode === 'history' ? `暂无 ${historyDate} 的新闻数据` : '暂无新闻数据'}
              </p>
              <p className="text-xs text-gray-700 mt-1.5">
                {mode === 'history' ? '请选择其他日期' : (isRunning ? '正在轮询中，请稍候...' : '请启动新闻轮询')}
              </p>
            </div>
          ) : (
            records.map((r, i) => (
              <NewsRow
                key={r.id}
                record={r}
                onSelect={setSelectedNews}
                index={i}
              />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {total > pageSize && (
          <div className="flex justify-center pt-2">
            <Pagination
              current={page}
              total={total}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
              hideOnSinglePage
              size="small"
            />
          </div>
        )}
      </div>

      {selectedNews && (
        <NewsModal
          record={selectedNews}
          onClose={() => setSelectedNews(null)}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
