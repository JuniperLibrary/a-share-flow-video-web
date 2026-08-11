import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  Alert,
  Space,
} from '@arco-design/web-react';
import { IconPlayArrow, IconStop } from '@arco-design/web-react/icon';
import { api } from '../api';
import { useSSE } from '../hooks/useSSE';
import type { SSEMessage, TickGenerateTaskStatus } from '../types';
import { DatePicker } from '../components/ui/date-picker';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/ui/page-header';

interface GeneratePageProps {
  dates: string[];
  onDone: (date: string) => void;
}

const TICK_PENDING_TASK_KEY = 'generate-page:tick-task';

interface PersistedTickTask {
  taskId: string;
  date: string;
  session: string;
  copyMode: string;
  format: string;
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
  cancellable,
  onCancel,
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
  cancellable?: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className={`rounded-2xl border ${accentBorder} bg-glass border-glass p-5 shadow-2xl flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <span className="text-lg opacity-60">{icon}</span>
        <div>
          <div className="text-base font-semibold text-ink">{title}</div>
          <div className="text-xs text-ink-3 mt-0.5">{desc}</div>
        </div>
      </div>
      <div className={`h-0.5 w-full rounded-full mt-3 mb-4 ${accentBg} opacity-30`} />

      {/* Form controls */}
      <div className="flex flex-wrap gap-x-4 gap-y-3 mb-4">
        {form}
      </div>

      {/* Generate button */}
      <div className="mb-4">
        <Space>
          <Button
            type="primary"
            loading={isRunning}
            onClick={onGenerate}
            icon={<IconPlayArrow />}
            className="!bg-primary !border-primary !text-primary-ink !h-9 !font-semibold !px-5 shadow-glow-primary hover:!brightness-110"
          >
            生成
          </Button>
          {cancellable && onCancel && (
            <Button
              status="danger"
              onClick={onCancel}
              icon={<IconStop />}
              className="!h-9 !font-semibold !px-4"
            >
              取消生成
            </Button>
          )}
        </Space>
      </div>

      {/* Status */}
      {statusType && (
        <Alert
          type={statusType === 'success' ? 'success' : statusType === 'error' ? 'error' : 'info'}
          title={statusText}
          className="!mb-3"
        />
      )}

      {/* Progress */}
      {progress && isRunning && (
        <div className="mb-3 flex items-center gap-2 text-xs text-ink-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {progress}
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="rounded-lg bg-glass border-glass border border-hairline p-3 flex-1 min-h-0 max-h-48 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-2 text-xs text-ink-3">
            <span className="w-1 h-1 rounded-full bg-glass-subtle" />
            生成日志
          </div>
          <div className="space-y-1">
            {logs.map((l, i) => (
              <div
                key={i}
                className="text-xs font-mono text-ink-3 leading-relaxed hover:text-ink-2 transition-colors"
              >
                <span className="text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                <span className="mx-2 text-ink-3">|</span>
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
            className="!bg-primary !border-primary !text-primary-ink !font-semibold shadow-glow-primary"
          >
            前往预览
          </Button>
          <span className="text-xs text-ink-3">查看生成的视频文件</span>
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
  const [tickFormat, setTickFormat] = useState('mobile');
  const [tickLogs, setTickLogs] = useState<string[]>([]);
  const [tickProgress, setTickProgress] = useState('');
  const [tickRunning, setTickRunning] = useState(false);
  const [tickCancellable, setTickCancellable] = useState(false);
  const [tickCancelling, setTickCancelling] = useState(false);
  const [tickTaskId, setTickTaskId] = useState('');
  const [tickStatus, setTickStatus] = useState<{ type: 'success' | 'error' | 'info' | ''; text: string }>({ type: '', text: '' });
  const tickPollRef = useRef<number | null>(null);

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

  const clearTickPolling = useCallback(() => {
    if (tickPollRef.current !== null) {
      window.clearInterval(tickPollRef.current);
      tickPollRef.current = null;
    }
  }, []);

  const persistTickTask = useCallback((task: PersistedTickTask) => {
    localStorage.setItem(TICK_PENDING_TASK_KEY, JSON.stringify(task));
  }, []);

  const clearTickTask = useCallback(() => {
    localStorage.removeItem(TICK_PENDING_TASK_KEY);
    setTickTaskId('');
  }, []);

  const applyTickTaskStatus = useCallback((status: TickGenerateTaskStatus) => {
    setTickTaskId(status.task_id);
    setTickLogs(status.logs || []);
    setTickProgress(status.progress || '');
    setTickCancellable(Boolean(status.cancellable));

    if (status.status === 'done') {
      clearTickPolling();
      setTickRunning(false);
      setTickCancellable(false);
      setTickCancelling(false);
      clearTickTask();
      setTickStatus({ type: 'success', text: status.progress || '生成完毕' });
      onDone(status.date || tickDate);
      return;
    }

    if (status.status === 'error') {
      clearTickPolling();
      setTickRunning(false);
      setTickCancellable(false);
      setTickCancelling(false);
      clearTickTask();
      setTickStatus({ type: 'error', text: status.error || status.progress || '生成失败' });
      return;
    }

    if (status.status === 'cancelled') {
      clearTickPolling();
      setTickRunning(false);
      setTickCancellable(false);
      setTickCancelling(false);
      clearTickTask();
      setTickStatus({ type: 'info', text: status.progress || '已取消生成' });
      return;
    }

    setTickRunning(true);
    setTickStatus({
      type: 'info',
      text: status.existing ? '已恢复正在执行的 Tick 生成任务' : (status.progress || '正在生成 Tick 视频...'),
    });
  }, [clearTickPolling, clearTickTask, onDone, tickDate]);

  const startTickPolling = useCallback((taskId: string) => {
    clearTickPolling();
    tickPollRef.current = window.setInterval(async () => {
      try {
        const status = await api.generateTickStatus(taskId);
        applyTickTaskStatus(status);
      } catch (e) {
        clearTickPolling();
        setTickRunning(false);
        setTickStatus({ type: 'error', text: e instanceof Error ? e.message : '查询任务状态失败' });
      }
    }, 2000);
  }, [applyTickTaskStatus, clearTickPolling]);

  useEffect(() => {
    const raw = localStorage.getItem(TICK_PENDING_TASK_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as PersistedTickTask;
      if (!pending.taskId) return;
      setTickDate(pending.date);
      setTickSession(pending.session);
      setTickCopyMode(pending.copyMode);
      setTickFormat(pending.format);
      setTickTaskId(pending.taskId);
      setTickStatus({ type: 'info', text: '正在恢复 Tick 生成任务...' });
      void api.generateTickStatus(pending.taskId)
        .then((status) => {
          applyTickTaskStatus(status);
          if (status.status === 'pending' || status.status === 'running') {
            startTickPolling(pending.taskId);
          }
        })
        .catch(() => {
          clearTickTask();
        });
    } catch {
      clearTickTask();
    }
    return () => clearTickPolling();
  }, [applyTickTaskStatus, clearTickPolling, clearTickTask, startTickPolling]);

  async function handleGenerateTick() {
    if (!tickDate) return;
    try {
      setTickLogs([]);
      setTickProgress('等待启动...');
      setTickRunning(true);
      setTickCancelling(false);
      setTickStatus({ type: 'info', text: '正在生成 Tick 视频...' });
      const status = await api.generateTick(tickDate, tickSession, tickCopyMode, tickFormat);
      persistTickTask({
        taskId: status.task_id,
        date: tickDate,
        session: tickSession,
        copyMode: tickCopyMode,
        format: tickFormat,
      });
      applyTickTaskStatus(status);
      if (status.status === 'pending' || status.status === 'running') {
        startTickPolling(status.task_id);
      }
    } catch (e: unknown) {
      clearTickPolling();
      setTickRunning(false);
      setTickCancellable(false);
      setTickStatus({ type: 'error', text: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleCancelTick() {
    if (!tickTaskId) return;
    try {
      setTickCancelling(true);
      await api.generateTickCancel(tickTaskId);
      setTickCancelling(false);
      void api.generateTickStatus(tickTaskId)
        .then(applyTickTaskStatus)
        .catch(() => {});
    } catch (e: unknown) {
      setTickCancelling(false);
      setTickStatus({ type: 'error', text: e instanceof Error ? e.message : '取消失败' });
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
          <span className="w-1 h-1 rounded-full bg-glass-sm" />
          <span className="text-xs text-ink-3">采集日期</span>
        </div>
        <DatePicker value={tickDate} onChange={setTickDate} style={{ width: 150 }} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-glass-sm" />
          <span className="text-xs text-ink-3">时段</span>
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
          <span className="w-1 h-1 rounded-full bg-glass-sm" />
          <span className="text-xs text-ink-3">文案模式</span>
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
          <span className="w-1 h-1 rounded-full bg-glass-sm" />
          <span className="text-xs text-ink-3">视频格式</span>
        </div>
        <Select
          value={tickFormat}
          onChange={v => setTickFormat(v as string)}
          style={{ width: 120 }}
          options={[
            { label: '竖版 9:16', value: 'mobile' },
            { label: '横版 16:9', value: 'tv' },
            { label: '全部', value: 'all' },
          ]}
        />
      </div>
    </>
  );

  const mdForm = (
    <>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-glass-sm" />
          <span className="text-xs text-ink-3">截止日期</span>
        </div>
        <DatePicker value={mdDate} onChange={setMdDate} style={{ width: 150 }} />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1 h-1 rounded-full bg-glass-sm" />
          <span className="text-xs text-ink-3">对比天数</span>
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
          <span className="w-1 h-1 rounded-full bg-glass-sm" />
          <span className="text-xs text-ink-3">文案模式</span>
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
        className="pointer-events-none absolute inset-0 opacity-[0.015] bg-dashboard-grid bg-grid-lg"
      />

      <div className="relative space-y-6">
        <PageHeader
          title="视频生成"
          meta={<span className="text-sm text-ink-3">AI 自动分析 · Remotion 渲染</span>}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Tick Card */}
          <GeneratorCard
            title="Tick 曲线视频"
            desc="日内资金流动曲线渲染"
            accentBorder="border-primary/20"
            accentBg="bg-gradient-to-r from-primary to-chart-6"
            icon="◈"
            form={tickForm}
            onGenerate={handleGenerateTick}
            logs={tickLogs}
            progress={tickProgress}
            isRunning={tickRunning && !tickCancelling}
            statusType={tickStatus.type}
            statusText={tickTaskId ? `${tickStatus.text}${tickRunning ? `（任务 ${tickTaskId.slice(-8)}）` : ''}` : tickStatus.text}
            onPreview={tickStatus.type === 'success' ? () => onDone(tickDate) : undefined}
            cancellable={tickCancellable && !tickCancelling}
            onCancel={handleCancelTick}
          />

          {/* Multiday Card */}
          <GeneratorCard
            title="多日 Bar Chart Race"
            desc="多交易日资金流向排名竞赛"
            accentBorder="border-primary/20"
            accentBg="bg-gradient-to-r from-info to-chart-5"
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
