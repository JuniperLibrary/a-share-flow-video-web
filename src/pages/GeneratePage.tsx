import { useState, useEffect } from 'react';
import {
  Select,
  Button,
  Space,
  Alert,
} from '@arco-design/web-react';
import { IconPlayArrow } from '@arco-design/web-react/icon';
import { api } from '../api';
import { useSSE } from '../hooks/useSSE';
import type { SSEMessage } from '../types';
import { DatePicker } from '../components/ui/date-picker';

interface GeneratePageProps {
  dates: string[];
  onDone: () => void;
}

type VideoType = 'multiday';

const videoTypeConfig = [
  {
    key: 'multiday' as VideoType,
    label: '多日 Bar Chart Race',
    desc: '动态横向排名条形竞赛图 · 多交易日资金流向对比',
    gradient: 'from-blue-500/20 to-indigo-500/5',
    border: 'hover:border-blue-500/30',
    accent: 'bg-gradient-to-r from-blue-400 to-indigo-400',
    icon: '◈',
  },
];

export function GeneratePage({ dates, onDone }: GeneratePageProps) {
  const [videoType, setVideoType] = useState<VideoType>('multiday');
  const [genDate, setGenDate] = useState('');
  const [session, setSession] = useState('full');
  const [copyMode, setCopyMode] = useState('template');
  const [format, setFormat] = useState('mobile');
  const [days, setDays] = useState(3);
  const { logs, progress, isRunning, startStream } = useSSE();
  const [statusText, setStatusText] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | ''>('');

  useEffect(() => {
    if (dates.length > 0 && !genDate) setGenDate(dates[0]);
  }, [dates]);

  async function handleGenerate() {
    if (!genDate) return;
    setStatusText('');
    setStatusType('info');
    setStatusText('正在生成视频...');

    try {
      await startStream(
        () => api.generateMultiDay(genDate, days, copyMode, format),
        (msg: SSEMessage) => {
          if (msg.type === 'done') {
            setStatusType('success');
            setStatusText(msg.text);
            onDone();
          } else if (msg.type === 'error') {
            throw new Error(msg.text);
          }
        },
      );
    } catch (e: unknown) {
      setStatusType('error');
      setStatusText(e instanceof Error ? e.message : String(e));
    }
  }

  const selectedConfig = videoTypeConfig.find(vt => vt.key === videoType)!;

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative">
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            视频生成
          </h1>
          <span className="text-sm text-gray-500">AI 自动分析 · Remotion 渲染</span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-6 shadow-2xl">
          {/* Video Type Selector */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {videoTypeConfig.map((vt) => {
              const active = videoType === vt.key;
              return (
                <button
                  key={vt.key}
                  onClick={() => setVideoType(vt.key)}
                  className={`
                    relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300
                    ${active
                      ? 'border-white/20 bg-white/[0.06] shadow-lg shadow-white/5 scale-[1.02]'
                      : 'border-white/[0.04] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] hover:scale-[1.01]'}
                  `}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <div className="absolute inset-0 opacity-10">
                      <div className={`absolute inset-0 ${vt.gradient}`} />
                    </div>
                  )}
                  {active && (
                    <div className="absolute top-0 left-0 w-1 h-full rounded-r bg-gradient-to-b from-white/40 to-white/5" />
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-base font-semibold ${active ? 'text-white' : 'text-gray-400'}`}>
                      {vt.label}
                    </span>
                    <div className={`
                      w-2.5 h-2.5 rounded-full transition-all duration-300
                      ${active ? 'shadow-lg scale-110' : 'bg-white/10'}
                    `} style={{
                      background: active
                        ? videoType === 'multiday'
                          ? 'linear-gradient(135deg, #60a5fa, #818cf8)'
                          : 'linear-gradient(135deg, #22d3ee, #2dd4bf)'
                        : undefined,
                    }} />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{vt.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Active type label */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`
              h-0.5 w-6 rounded-full
              ${videoType === 'multiday' ? 'bg-blue-400' : 'bg-cyan-400'}
            `} />
            <span className="text-xs font-medium tracking-wider text-gray-500 uppercase">
              {videoType === 'multiday' ? '多日趋势' : '日内 Tick'} 配置
            </span>
          </div>

          {/* Form controls */}
          <div className="flex flex-wrap gap-x-5 gap-y-3 mb-5">
            {/* Date */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-xs text-gray-500">
                  截止日期
                </span>
              </div>
              <DatePicker
                value={genDate}
                onChange={setGenDate}
                style={{ width: 150 }}
              />
            </div>

            {/* Days (multiday only) */}
            {videoType === 'multiday' && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="text-xs text-gray-500">对比天数</span>
                </div>
                <Select
                  value={days}
                  onChange={setDays}
                  style={{ width: 110, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  options={[
                    { label: '近3日', value: 3 },
                    { label: '近5日', value: 5 },
                    { label: '近7日', value: 7 },
                  ]}
                />
              </div>
            )}

            {/* Copy mode */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-xs text-gray-500">文案模式</span>
              </div>
              <Select
                value={copyMode}
                onChange={setCopyMode}
                style={{ width: 120, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                options={[
                  { label: '模板文案', value: 'template' },
                  { label: 'AI文案', value: 'ai' },
                ]}
              />
            </div>

            {/* Format */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-xs text-gray-500">输出格式</span>
              </div>
              <Select
                value={format}
                onChange={setFormat}
                style={{ width: 150, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                options={[
                  { label: '📱 竖屏 (9:16)', value: 'mobile' },
                  { label: '📺 横屏 (16:9)', value: 'tv' },
                ]}
              />
            </div>

            {/* Generate button */}
            <div className="flex items-end">
              <Button
                type="primary"
                loading={isRunning}
                onClick={handleGenerate}
                disabled={!genDate}
                icon={<IconPlayArrow />}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  border: 'none',
                  height: 36,
                  fontWeight: 600,
                  paddingLeft: 20,
                  paddingRight: 20,
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
                }}
              >
                生成
              </Button>
            </div>
          </div>

          {/* Status message */}
          {statusType && (
            <Alert
              type={statusType === 'success' ? 'success' : statusType === 'error' ? 'error' : 'info'}
              title={statusText}
              style={{ marginTop: 12, background: 'rgba(26, 58, 92, 0.6)', border: '1px solid rgba(42, 74, 108, 0.5)' }}
            />
          )}

          {/* Progress */}
          {progress && isRunning && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {progress}
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="mt-4 rounded-lg bg-black/30 border border-white/[0.04] p-4 max-h-48 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <span className="w-1 h-1 rounded-full bg-white/20" />
                生成日志
              </div>
              <div className="space-y-1">
                {logs.map((l, i) => (
                  <div
                    key={i}
                    className="text-xs font-mono text-gray-500 leading-relaxed hover:text-gray-300 transition-colors"
                  >
                    <span className="text-gray-600">{String(i + 1).padStart(2, '0')}</span>
                    <span className="mx-2 text-gray-700">|</span>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigate to preview */}
          {statusType === 'success' && (
            <div className="mt-5 flex items-center gap-3">
              <Button
                onClick={onDone}
                style={{
                  background: 'linear-gradient(135deg, #00d4ff, #0891b2)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)',
                }}
              >
                前往预览
              </Button>
              <span className="text-xs text-gray-600">查看生成的视频文件</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
