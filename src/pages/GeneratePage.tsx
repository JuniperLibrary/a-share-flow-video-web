import { useState, useEffect } from 'react';
import {
  Button,
  Alert,
} from '@arco-design/web-react';
import { IconPlayArrow } from '@arco-design/web-react/icon';
import { api } from '../api';
import { useSSE } from '../hooks/useSSE';
import type { SSEMessage } from '../types';
import { DatePicker } from '../components/ui/date-picker';
import { Select } from '../components/ui/select';

interface GeneratePageProps {
  dates: string[];
  onDone: (date: string) => void;
}

function GeneratorCard({
  title,
  desc,
  accentBorder,
  accentBg,
  icon,
  form,
  onGenerate,
  logs,
  progress,
  isRunning,
  statusType,
  statusText,
  onPreview,
}: {
  title: string;
  desc: string;
  accentBorder: string;
  accentBg: string;
  icon: string;
  form: React.ReactNode;
  onGenerate: () => void;
  logs: string[];
  progress: string;
  isRunning: boolean;
  statusType: 'success' | 'error' | 'info' | '';
  statusText: string;
  onPreview?: () => void;
}) {
  return (
    <div className={`rounded-2xl border ${accentBorder} bg-black/30 backdrop-blur-xl p-5 shadow-2xl flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <span className="text-lg opacity-60">{icon}</span>
        <div>
          <div className="text-base font-semibold text-white/90">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
        </div>
      </div>
      <div className={`h-0.5 w-full rounded-full mt-3 mb-4 ${accentBg} opacity-30`} />

      {/* Form controls */}
      <div className="flex flex-wrap gap-x-4 gap-y-3 mb-4">
        {form}
      </div>

      {/* Generate button */}
      <div className="mb-4">
        <Button
          type="primary"
          loading={isRunning}
          onClick={onGenerate}
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

      {/* Status */}
      {statusType && (
        <Alert
          type={statusType === 'success' ? 'success' : statusType === 'error' ? 'error' : 'info'}
          title={statusText}
          style={{ marginBottom: 12, background: 'rgba(26, 58, 92, 0.6)', border: '1px solid rgba(42, 74, 108, 0.5)' }}
        />
      )}

      {/* Progress */}
      {progress && isRunning && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {progress}
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="rounded-lg bg-black/30 border border-white/[0.04] p-3 flex-1 min-h-0 max-h-48 overflow-y-auto custom-scrollbar">
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

      {/* Preview link */}
      {statusType === 'success' && onPreview && (
        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={onPreview}
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
  );
}

export function GeneratePage({ dates, onDone }: GeneratePageProps) {
  // ---- Tick state ----
  const [tickDate, setTickDate] = useState('');
  const [tickSession, setTickSession] = useState('full');
  const [tickCopyMode, setTickCopyMode] = useState('ai');
  const [tickFormat, setTickFormat] = useState('all');
  const tickSSE = useSSE();
  const [tickStatus, setTickStatus] = useState<{ type: 'success' | 'error' | 'info' | ''; text: string }>({ type: '', text: '' });

  // ---- Multiday state ----
  const [mdDate, setMdDate] = useState('');
  const [mdDays, setMdDays] = useState(3);
  const [mdCopyMode, setMdCopyMode] = useState('ai');
  const mdSSE = useSSE();
  const [mdStatus, setMdStatus] = useState<{ type: 'success' | 'error' | 'info' | ''; text: string }>({ type: '', text: '' });

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setTickDate(today);
  }, []);

  useEffect(() => {
    if (dates.length > 0) setMdDate(dates[0]);
  }, [dates]);

  async function handleGenerateTick() {
    if (!tickDate) return;
    setTickStatus({ type: 'info', text: '正在生成 Tick 视频...' });
    try {
      await tickSSE.startStream(
        () => api.generateTick(tickDate, tickSession, tickCopyMode, tickFormat),
        (msg: SSEMessage) => {
          if (msg.type === 'done') {
            setTickStatus({ type: 'success', text: msg.text });
            onDone(tickDate);
          } else if (msg.type === 'error') {
            throw new Error(msg.text);
          }
        },
      );
    } catch (e: unknown) {
      setTickStatus({ type: 'error', text: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleGenerateMultiDay() {
    if (!mdDate) return;
    setMdStatus({ type: 'info', text: '正在生成多日视频...' });
    try {
      await mdSSE.startStream(
        () => api.generateMultiDay(mdDate, mdDays, mdCopyMode),
        (msg: SSEMessage) => {
          if (msg.type === 'done') {
            setMdStatus({ type: 'success', text: msg.text });
            onDone(mdDate);
          } else if (msg.type === 'error') {
            throw new Error(msg.text);
          }
        },
      );
    } catch (e: unknown) {
      setMdStatus({ type: 'error', text: e instanceof Error ? e.message : String(e) });
    }
  }

  const tickForm = (
    <>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-xs text-gray-500">采集日期</span>
        </div>
        <DatePicker value={tickDate} onChange={setTickDate} style={{ width: 150 }} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-xs text-gray-500">时段</span>
        </div>
        <Select
          value={tickSession}
          onChange={v => setTickSession(v as string)}
          style={{ width: 110 }}
          options={[
            { label: '全天', value: 'full' },
            { label: '早盘', value: 'morning' },
          ]}
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-xs text-gray-500">文案模式</span>
        </div>
        <Select
          value={tickCopyMode}
          onChange={v => setTickCopyMode(v as string)}
          style={{ width: 120 }}
          options={[
            { label: '模板文案', value: 'template' },
            { label: 'AI文案', value: 'ai' },
          ]}
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-xs text-gray-500">视频格式</span>
        </div>
        <Select
          value={tickFormat}
          onChange={v => setTickFormat(v as string)}
          style={{ width: 120 }}
          options={[
            { label: '全部', value: 'all' },
            { label: '横版 16:9', value: 'tv' },
            { label: '竖版 9:16', value: 'mobile' },
          ]}
        />
      </div>
    </>
  );

  const mdForm = (
    <>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-xs text-gray-500">截止日期</span>
        </div>
        <DatePicker value={mdDate} onChange={setMdDate} style={{ width: 150 }} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-xs text-gray-500">对比天数</span>
        </div>
        <Select
          value={mdDays}
          onChange={v => setMdDays(v as number)}
          style={{ width: 110 }}
          options={[
            { label: '近3日', value: 3 },
            { label: '近5日', value: 5 },
            { label: '近7日', value: 7 },
          ]}
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span className="text-xs text-gray-500">文案模式</span>
        </div>
        <Select
          value={mdCopyMode}
          onChange={v => setMdCopyMode(v as string)}
          style={{ width: 120 }}
          options={[
            { label: '模板文案', value: 'template' },
            { label: 'AI文案', value: 'ai' },
          ]}
        />
      </div>
    </>
  );

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Tick Card */}
          <GeneratorCard
            title="Tick 曲线视频"
            desc="日内资金流动曲线渲染"
            accentBorder="border-cyan-500/20"
            accentBg="bg-gradient-to-r from-cyan-400 to-teal-400"
            icon="◈"
            form={tickForm}
            onGenerate={handleGenerateTick}
            logs={tickSSE.logs}
            progress={tickSSE.progress}
            isRunning={tickSSE.isRunning}
            statusType={tickStatus.type}
            statusText={tickStatus.text}
            onPreview={tickStatus.type === 'success' ? () => onDone(tickDate) : undefined}
          />

          {/* Multiday Card */}
          <GeneratorCard
            title="多日 Bar Chart Race"
            desc="多交易日资金流向排名竞赛"
            accentBorder="border-blue-500/20"
            accentBg="bg-gradient-to-r from-blue-400 to-indigo-400"
            icon="◈"
            form={mdForm}
            onGenerate={handleGenerateMultiDay}
            logs={mdSSE.logs}
            progress={mdSSE.progress}
            isRunning={mdSSE.isRunning}
            statusType={mdStatus.type}
            statusText={mdStatus.text}
            onPreview={mdStatus.type === 'success' ? () => onDone(mdDate) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
