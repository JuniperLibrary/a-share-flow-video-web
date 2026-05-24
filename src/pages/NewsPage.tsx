import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Pagination } from '@arco-design/web-react';
import { IconRefresh, IconSearch, IconStop } from '@arco-design/web-react/icon';
import { api } from '../api';
import type { CLSNewsRecord, NewsStatusResponse } from '../types';

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  A: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
  B: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  C: { bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.2)', text: '#6b7280' },
};

function parseSectors(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function NewsPage() {
  const [records, setRecords] = useState<CLSNewsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQ, setSearchQ] = useState('');
  const [status, setStatus] = useState<NewsStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<CLSNewsRecord | null>(null);

  const loadNews = useCallback(async (p: number, q?: string) => {
    setLoading(true);
    try {
      const offset = (p - 1) * pageSize;
      if (q) {
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
  }, [pageSize]);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await api.getNewsStatus());
    } catch { void 0; }
  }, []);

  useEffect(() => {
    loadNews(page);
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [page, loadNews, loadStatus]);

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

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
              财联社新闻
            </h1>
            <span className="text-sm text-gray-500">实时电报监控 + 板块关联</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 backdrop-blur-xl px-3 py-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}
              />
              <span className="text-xs text-gray-400">{isRunning ? '运行中' : '已停止'}</span>
              <span className="text-xs text-gray-600 mx-1">|</span>
              <span className="text-xs text-gray-500">
                累计 <span className="text-white font-medium">{status?.total_news ?? 0}</span> 条
              </span>
              {status?.last_poll && (
                <>
                  <span className="text-xs text-gray-600 mx-1">|</span>
                  <span className="text-xs text-gray-500">
                    上次 <span className="text-gray-400">{new Date(status.last_poll).toLocaleTimeString()}</span>
                    {status.last_count > 0 && (
                      <span className="text-cyan-400 ml-1">+{status.last_count}</span>
                    )}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleToggleScheduler}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: isRunning
                  ? 'rgba(239,68,68,0.1)'
                  : 'linear-gradient(135deg, #2563eb, #0891b2)',
                color: isRunning ? '#ef4444' : '#fff',
                border: isRunning ? '1px solid rgba(239,68,68,0.2)' : 'none',
                boxShadow: isRunning ? 'none' : '0 0 16px rgba(59,130,246,0.12)',
              }}
            >
              {isRunning ? <IconStop style={{ fontSize: 13 }} /> : <IconRefresh style={{ fontSize: 13 }} />}
              {isRunning ? '停止轮询' : '启动轮询'}
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Input
            placeholder="搜索新闻标题或正文..."
            value={searchQ}
            onChange={val => setSearchQ(val)}
            onPressEnter={handleSearch}
            style={{
              width: 360,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e5e7eb',
              borderRadius: 8,
            }}
          />
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

        <div className="grid gap-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
                <IconSearch style={{ color: '#4b5563', fontSize: 20 }} />
              </div>
              <p className="text-sm text-gray-600">暂无新闻数据</p>
              <p className="text-xs text-gray-700 mt-1">
                {isRunning ? '正在轮询中，请稍候...' : '请启动新闻轮询'}
              </p>
            </div>
          ) : (
            records.map((r) => {
              const sectors = parseSectors(r.sectors);
              const lc = LEVEL_COLORS[r.level] || LEVEL_COLORS.C;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-4 shadow-2xl transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="inline-block px-2 py-0.5 text-xs font-bold rounded"
                          style={{
                            background: lc.bg,
                            border: `1px solid ${lc.border}`,
                            color: lc.text,
                          }}
                        >
                          {r.level}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {r.ctime}
                        </span>
                        {r.reading_num > 0 && (
                          <span className="text-xs text-gray-600">
                            {r.reading_num > 10000
                              ? `${(r.reading_num / 10000).toFixed(1)}w`
                              : r.reading_num}{' '}
                            阅读
                          </span>
                        )}
                      </div>
                      <div
                        onClick={() => setSelectedNews(r)}
                        className="cursor-pointer text-sm font-medium text-gray-200 hover:text-cyan-400 transition-colors line-clamp-2"
                      >
                        {r.title}
                      </div>
                      {r.brief && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.brief}</p>
                      )}
                      {sectors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {sectors.map((s) => (
                            <span
                              key={s}
                              className="inline-block px-2 py-0.5 text-xs rounded-full"
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
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedNews && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedNews(null)}
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >
            <div
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] shadow-2xl p-6"
              style={{
                background: '#0d1f3c',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.06) transparent',
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-3 pr-8">
                {(() => {
                  const lc = LEVEL_COLORS[selectedNews.level] || LEVEL_COLORS.C;
                  return (
                    <span
                      className="inline-block px-2 py-0.5 text-xs font-bold rounded"
                      style={{ background: lc.bg, border: `1px solid ${lc.border}`, color: lc.text }}
                    >
                      {selectedNews.level}
                    </span>
                  );
                })()}
                <span className="text-xs text-gray-500 font-mono">{selectedNews.ctime}</span>
                {selectedNews.reading_num > 0 && (
                  <span className="text-xs text-gray-600">
                    {selectedNews.reading_num > 10000
                      ? `${(selectedNews.reading_num / 10000).toFixed(1)}w`
                      : selectedNews.reading_num}{' '}
                    阅读
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-white mb-4 leading-relaxed">
                {selectedNews.title}
              </h2>

              {selectedNews.content && (
                <div className="text-sm text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
                  {selectedNews.content}
                </div>
              )}

              {!selectedNews.content && selectedNews.brief && (
                <div className="text-sm text-gray-400 leading-relaxed mb-4">
                  {selectedNews.brief}
                </div>
              )}

              {(() => {
                const sectors = parseSectors(selectedNews.sectors);
                return sectors.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {sectors.map(s => (
                      <span
                        key={s}
                        className="inline-block px-2.5 py-1 text-xs rounded-full"
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
                ) : null;
              })()}

              {selectedNews.shareurl && (
                <a
                  href={selectedNews.shareurl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors no-underline"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#60a5fa',
                  }}
                >
                  查看原文 ↗
                </a>
              )}
            </div>
          </div>
        )}

        {total > pageSize && (
          <div className="flex justify-center mt-4">
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
    </div>
  );
}
