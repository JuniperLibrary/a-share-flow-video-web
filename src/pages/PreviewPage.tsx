import { useState, useEffect } from 'react';
import { IconCopy, IconCheck, IconPlayArrow, IconCalendar } from '@arco-design/web-react/icon';
import { api } from '../api';
import { DatePicker } from '../components/ui/date-picker';
import { PageHeader } from '../components/ui/page-header';
import { EmptyState } from '../components/ui/empty-state';
import { cn } from '../lib/utils';
import { apiUrl } from '../utils';

interface FilesResponse {
  videos: Record<string, string>;
  文案: {
    template: Record<string, string>;
    ai: Record<string, string>;
  };
}

const sessionLabels: Record<string, string> = {
  morning: '早盘',
  full: '全天',
  afternoon: '午盘',
};

function VideoCard({
  name,
  isActive,
  onPlay,
}: {
  name: string;
  isActive: boolean;
  onPlay: () => void;
}) {
  const lower = name.toLowerCase();
  const isTV = lower.includes('_tv') || (lower.includes('_tick') && !lower.includes('_mobile'));
  const isTickVideo = lower.includes('_tick');
  const ratioLabel = isTV ? '横屏 16:9' : '竖屏 9:16';
  let displayName = name;
  if (isTickVideo) {
    const cleaned = name
      .replace(/_tick_mobile$/, '')
      .replace(/_tick_tv$/, '')
      .replace(/_tick$/, '');
    displayName = (sessionLabels[cleaned] || cleaned) + ' Tick';
  } else {
    const cleaned = name.replace(/_tv$/, '');
    displayName = sessionLabels[cleaned] || cleaned;
  }
  const kind = isTickVideo ? '曲线' : '流向';

  return (
    <button
      onClick={onPlay}
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all duration-300 text-left w-full',
        isActive
          ? 'border-primary/40 bg-primary-softer shadow-glow-primary scale-[1.02]'
          : 'border-hairline bg-surface-1 hover:border-hairline-active hover:bg-surface-2 hover:scale-[1.01]',
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
            <IconPlayArrow className="text-primary" style={{ fontSize: 18 }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{displayName}</p>
            <p className="text-[11px] text-ink-3 mt-0.5">{ratioLabel} · {kind}</p>
          </div>
          {isActive && (
            <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow-primary shrink-0" />
          )}
        </div>
      </div>
    </button>
  );
}

export function PreviewPage({ previewDate: propPreviewDate }: { previewDate?: string }) {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [data, setData] = useState<FilesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyTab, setCopyTab] = useState<'template' | 'ai'>('template');

  const copyData = data?.['文案'] || { template: {}, ai: {} };
  useEffect(() => {
    if (Object.keys(copyData.ai ?? {}).length > 0) {
      setCopyTab('ai');
    }
  }, [copyData]);

  useEffect(() => {
    api.getSectorsAllDates().then(r => {
      const sorted = (r.dates || []).sort();
      setDates(sorted);
      if (propPreviewDate && sorted.includes(propPreviewDate)) {
        setSelectedDate(propPreviewDate);
      } else if (sorted.length > 0) {
        setSelectedDate(sorted[sorted.length - 1]);
      }
    }).catch(() => void 0);
  }, [propPreviewDate]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setActiveVideo(null);
    api.getFiles(selectedDate).then(r => {
      setData(r as unknown as FilesResponse);
    }).catch(() => {
      setData(null);
    }).finally(() => setLoading(false));
  }, [selectedDate]);

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => void 0);
  }

  const videos = data?.videos || {};
  const activeCopy = copyData[copyTab] || {};
  const hasData = Object.keys(videos).length > 0
    || Object.keys(copyData.template).length > 0
    || Object.keys(copyData.ai).length > 0;

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] bg-dashboard-grid bg-grid-lg" />

      <div className="relative">
        <PageHeader
          title="视频预览"
          meta={<span>查看已生成的视频与文案</span>}
        />

        <div className="rounded-2xl border border-hairline bg-surface-1 backdrop-blur-xl p-4 shadow-2xl mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
              <IconCalendar className="text-primary" style={{ fontSize: 16 }} />
            </div>
            <span className="text-sm text-ink-2">选择日期</span>
            <div className="w-40">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-hairline bg-surface-1 backdrop-blur-xl shadow-2xl">
            <EmptyState title="加载中..." />
          </div>
        )}

        {!loading && selectedDate && !hasData && (
          <div className="rounded-2xl border border-hairline bg-surface-1 backdrop-blur-xl p-10 shadow-2xl">
            <EmptyState
              title="该日期暂无视频或文案数据"
              description="请先在「视频生成」页面生成视频"
              icon={<IconPlayArrow className="h-6 w-6" />}
            />
          </div>
        )}

        {!loading && data && hasData && (
          <div className="space-y-4">
            {Object.keys(videos).length > 0 && (
              <div className="rounded-2xl border border-hairline bg-surface-1 backdrop-blur-xl p-6 shadow-2xl">
                <h2 className="flex items-center gap-2 text-base font-semibold text-ink mb-5">
                  <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
                    <IconPlayArrow className="text-primary" style={{ fontSize: 16 }} />
                  </div>
                  视频文件
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {Object.entries(videos).map(([name, filename]) => (
                    <VideoCard
                      key={name}
                      name={name}
                      isActive={activeVideo === name}
                      onPlay={() => setActiveVideo(activeVideo === name ? null : name)}
                    />
                  ))}
                </div>

                {activeVideo && (
                  <div className="rounded-xl overflow-hidden border border-hairline bg-glass-lg border-glass">
                    <video
                      controls
                      autoPlay
                      key={activeVideo}
                      className={cn(
                        'w-full max-h-[560px] mx-auto',
                        (() => {
                          const lower = activeVideo.toLowerCase();
                          const isTV = lower.includes('_tv') || (lower.includes('_tick') && !lower.includes('_mobile'));
                          const isBarChart = !lower.includes('_tick') && !lower.includes('tick');
                          if (isTV || isBarChart) return 'aspect-video';
                          return 'aspect-[9/16] max-w-[320px]';
                        })(),
                      )}
                      src={apiUrl(`/output/${selectedDate}/${videos[activeVideo]}`)}
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                )}
              </div>
            )}

            {(Object.keys(copyData.template).length > 0 || Object.keys(copyData.ai).length > 0) && (
              <div className="rounded-2xl border border-hairline bg-surface-1 backdrop-blur-xl p-6 shadow-2xl">
                <h2 className="flex items-center gap-2 text-base font-semibold text-ink mb-5">
                  <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
                    <IconCopy className="text-primary" style={{ fontSize: 16 }} />
                  </div>
                  视频文案
                </h2>

                <div className="flex gap-1.5 mb-5 p-1 rounded-xl bg-surface-2 border border-hairline w-fit">
                  <button
                    onClick={() => setCopyTab('template')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      copyTab === 'template'
                        ? 'bg-primary-soft text-primary shadow-sm'
                        : 'text-ink-3 hover:text-ink-2',
                    )}
                  >
                    模板文案
                  </button>
                  <button
                    onClick={() => setCopyTab('ai')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      copyTab === 'ai'
                        ? 'bg-primary-soft text-primary shadow-sm'
                        : 'text-ink-3 hover:text-ink-2',
                    )}
                  >
                    AI 文案
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(activeCopy).length === 0 ? (
                    <p className="text-sm text-ink-3 py-8 text-center">
                      暂无{copyTab === 'template' ? '模板' : 'AI'}文案
                    </p>
                  ) : (
                    Object.entries(activeCopy).map(([session, text]) => (
                      <div
                        key={session}
                        className="rounded-xl border border-hairline bg-surface-2 p-5 transition-colors hover:border-hairline-active"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                copyTab === 'ai' ? 'bg-primary' : 'bg-warning',
                              )}
                            />
                            <span className="text-xs font-medium text-ink-3 uppercase tracking-wider">
                              {sessionLabels[session] || session}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(text, `${copyTab}-${session}`)}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200',
                              copiedKey === `${copyTab}-${session}`
                                ? 'text-inflow bg-inflow-softer'
                                : 'text-ink-3 hover:text-ink-2 hover:bg-surface-3',
                            )}
                          >
                            {copiedKey === `${copyTab}-${session}` ? (
                              <>
                                <IconCheck style={{ fontSize: 13 }} /> 已复制
                              </>
                            ) : (
                              <>
                                <IconCopy style={{ fontSize: 13 }} /> 复制
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">
                          {text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
