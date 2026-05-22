import { useState, useEffect } from 'react';
import { IconCopy, IconCheck, IconPlayArrow, IconCalendar } from '@arco-design/web-react/icon';
import { api } from '../api';
import { DatePicker } from '../components/ui/date-picker';
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
  const displayName = name.replace(/_tv$/, '');
  const label = sessionLabels[displayName] || displayName;

  return (
    <button
      onClick={onPlay}
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300 text-left w-full
        ${isActive
          ? 'border-cyan-500/40 bg-white/[0.06] shadow-lg shadow-cyan-500/10 scale-[1.02]'
          : 'border-white/[0.06] bg-black/30 hover:border-white/[0.12] hover:bg-white/[0.04] hover:scale-[1.01]'
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
            <IconPlayArrow style={{ color: '#a78bfa', fontSize: 18 }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">横屏 16:9</p>
          </div>
          {isActive && (
            <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50 shrink-0" />
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
  const copyData = data?.['文案'] || { template: {}, ai: {} };
  const activeCopy = copyData[copyTab] || {};
  const hasData = Object.keys(videos).length > 0
    || Object.keys(copyData.template).length > 0
    || Object.keys(copyData.ai).length > 0;

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
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            视频预览
          </h1>
          <span className="text-sm text-gray-500">查看已生成的视频与文案</span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-4 shadow-2xl mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
              <IconCalendar style={{ color: '#22d3ee', fontSize: 16 }} />
            </div>
            <span className="text-sm text-gray-300">选择日期</span>
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
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              加载中...
            </div>
          </div>
        )}

        {!loading && selectedDate && !hasData && (
          <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-10 shadow-2xl">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                <IconPlayArrow style={{ fontSize: 28, color: '#4b5563' }} />
              </div>
              <p className="text-sm text-gray-500">该日期暂无视频或文案数据</p>
              <p className="text-xs text-gray-700 mt-1">请先在「视频生成」页面生成视频</p>
            </div>
          </div>
        )}

        {!loading && data && hasData && (
          <div className="space-y-4">
            {Object.keys(videos).length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-6 shadow-2xl">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                    <IconPlayArrow style={{ color: '#22d3ee', fontSize: 16 }} />
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
                  <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black/50">
                    <video
                      controls
                      autoPlay
                      key={activeVideo}
                      className="w-full max-h-[560px]"
                      src={apiUrl(`/output/${selectedDate}/${videos[activeVideo]}`)}
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                )}
              </div>
            )}

            {(Object.keys(copyData.template).length > 0 || Object.keys(copyData.ai).length > 0) && (
              <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-6 shadow-2xl">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                    <IconCopy style={{ color: '#a78bfa', fontSize: 16 }} />
                  </div>
                  视频文案
                </h2>

                <div className="flex gap-1.5 mb-5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04] w-fit">
                  <button
                    onClick={() => setCopyTab('template')}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${copyTab === 'template'
                        ? 'bg-white/[0.08] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-300'
                      }
                    `}
                  >
                    模板文案
                  </button>
                  <button
                    onClick={() => setCopyTab('ai')}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${copyTab === 'ai'
                        ? 'bg-white/[0.08] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-300'
                      }
                    `}
                  >
                    AI 文案
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(activeCopy).length === 0 ? (
                    <p className="text-sm text-gray-600 py-8 text-center">
                      暂无{copyTab === 'template' ? '模板' : 'AI'}文案
                    </p>
                  ) : (
                    Object.entries(activeCopy).map(([session, text]) => (
                      <div
                        key={session}
                        className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.08]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background:
                                  copyTab === 'ai'
                                    ? 'linear-gradient(135deg, #a78bfa, #22d3ee)'
                                    : 'linear-gradient(135deg, #fbbf24, #f472b6)',
                              }}
                            />
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                              {sessionLabels[session] || session}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(text, `${copyTab}-${session}`)}
                            className={`
                              flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200
                              ${copiedKey === `${copyTab}-${session}`
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]'
                              }
                            `}
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
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
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
