import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import {
  Send,
  RefreshCw,
  X,
  Info,
  Search,
  FileText,
  History as HistoryIcon,
  MessageSquare,
  Film,
  CheckCircle2,
  XCircle,
  Volume2,
  Loader2,
  Sparkles,
  Download,
  Eye,
  Trash2,
  Smartphone,
  Tv,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api';
import type { DebateScript, DebateAudioTurn, DebateProbeReport, DebateHistoryEntry } from '../types';
import { PageHeader } from '../components/ui/page-header';
import { EmptyState } from '../components/ui/empty-state';
import { GlassPanel } from '../components/ui/glass-panel';
import { cn } from '../lib/utils';
import {
  PERSONA,
  PERSONA_ORDER,
  type DebatePhaseKey,
  type PersonaName,
} from '../components/debate/persona-config';
import { PersonaLineup, StageTrack, PhaseCard, DebateStage, Spotlight, PersonaIcon } from '../components/debate';

const SAMPLE_REPORT = `贵州茅台 2024 年三季报：

营业总收入 1207.76 亿元，同比增长 16.91%；归母净利润 608.28 亿元，同比增长 15.04%。其中 Q3 单季营收 388.71 亿元，同比 +15.04%；归母净利 191.33 亿元，同比 +13.23%。

毛利率 91.53%，较去年同期提升 0.16pct；净利率 50.46%。经营活动现金流净额 495.32 亿元，同比增长 35%。

直销渠道收入 522.59 亿元，同比增长 27.5%，占比 43.27%；批发代理收入 671.97 亿元，同比增长 9.7%。

系列酒收入 193.93 亿元，同比增长 24.4%；茅台酒收入 1013.42 亿元，同比增长 15.0%。

合同负债 99.31 亿元，环比 Q2 末的 112.55 亿元下降 11.7%。`;

type Stage = 'idle' | 'script' | 'audio' | 'render' | 'done' | 'error';
type Format = 'mobile' | 'tv';

const STAGE_LABEL: Record<Stage, string> = {
  idle: '等待开始',
  script: '正在编排辩论',
  audio: '正在合成语音',
  render: '正在渲染视频',
  done: '已完成',
  error: '出错了',
};

const PIPELINE_STAGES: Array<'script' | 'audio' | 'render' | 'done'> = ['script', 'audio', 'render', 'done'];

function validateReport(text: string): string | null {
  if (text.trim().length < 20) {
    return '财报文本过短，至少需要 20 字';
  }
  const keywords = ['营收', '利润', '净利', '毛利', '增长', '收入', '费用', '资产', '负债', '现金流', 'ROE', 'EPS'];
  const hasKeyword = keywords.some(k => text.includes(k));
  if (!hasKeyword) {
    return '未检测到财务关键词，建议包含营收、利润、增速等关键指标';
  }
  return null;
}

function fmtNum(v: unknown): string {
  if (typeof v !== 'number') return '—';
  return (v / 1e8).toFixed(2);
}

function yoyStr(v: unknown): { text: string; positive: boolean } | undefined {
  if (typeof v !== 'number') return undefined;
  const sign = v >= 0 ? '+' : '';
  return { text: `${sign}${v.toFixed(1)}%`, positive: v >= 0 };
}

function deriveCurrentPhase(script: DebateScript | null): DebatePhaseKey | null {
  if (!script || script.turns.length === 0) return null;
  for (let i = script.turns.length - 1; i >= 0; i--) {
    const p = script.turns[i].phase;
    if (p) return p;
  }
  return 'open';
}

function deriveVisitedPhases(script: DebateScript | null): Set<DebatePhaseKey> {
  const out = new Set<DebatePhaseKey>();
  if (!script) return out;
  for (const t of script.turns) {
    if (t.phase) out.add(t.phase);
  }
  return out;
}

function deriveActiveSpeaker(script: DebateScript | null): PersonaName | null {
  if (!script || script.turns.length === 0) return null;
  return script.turns[script.turns.length - 1].speaker;
}

function derivePastSpeakers(script: DebateScript | null, active: PersonaName | null): Set<PersonaName> {
  const out = new Set<PersonaName>();
  if (!script || !active) return out;
  for (const t of script.turns) {
    if (t.speaker === active) break;
    out.add(t.speaker);
  }
  return out;
}

function deriveUpcomingSpeakers(script: DebateScript | null, active: PersonaName | null): PersonaName[] {
  if (!script || !active) return [];
  const seenActive = new Set<PersonaName>();
  let activeIdx = -1;
  for (let i = 0; i < script.turns.length; i++) {
    const sp = script.turns[i].speaker;
    if (sp === active && activeIdx < 0) {
      activeIdx = i;
    }
    if (activeIdx >= 0) {
      seenActive.add(sp);
    }
  }
  return PERSONA_ORDER.filter((n) => !seenActive.has(n));
}

export function DebatePage() {
  const [report, setReport] = useState('');
  const [richReport, setRichReport] = useState<Record<string, unknown> | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>('mobile');
  const [stockCode, setStockCode] = useState('');
  const [stockName, setStockName] = useState('');
  const [fetching, setFetching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ code: string; name: string; market: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [taskId, setTaskId] = useState('');
  const [script, setScript] = useState<DebateScript | null>(null);
  const [audioTurns, setAudioTurns] = useState<DebateAudioTurn[] | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [probe, setProbe] = useState<DebateProbeReport | null>(null);
  const [playingTurn, setPlayingTurn] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<DebateHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const scriptEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBusy = stage !== 'idle' && stage !== 'error' && stage !== 'done';
  const isWorking = stage === 'script' || stage === 'audio' || stage === 'render';

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.debateHistoryList();
      setHistory(res.history);
    } catch {
      // history unavailable — non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [script]);

  const CACHE_PREFIX = 'debate_report_';
  const CACHE_TTL = 60 * 60 * 1000;

  function getCachedReport(code: string): { report: Record<string, unknown>; text: string } | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + code);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_PREFIX + code);
        return null;
      }
      return { report: parsed.report, text: parsed.text };
    } catch {
      return null;
    }
  }

  function setCachedReport(code: string, report: Record<string, unknown>, text: string) {
    try {
      localStorage.setItem(CACHE_PREFIX + code, JSON.stringify({ report, text, ts: Date.now() }));
    } catch { /* storage full — ignore */ }
  }

  async function handleFetchReport() {
    if (!stockCode.trim()) {
      setError('请输入股票代码');
      return;
    }
    const cached = getCachedReport(stockCode.trim());
    if (cached) {
      setReport(cached.text);
      setRichReport(cached.report);
      setWarning(validateReport(cached.text));
      return;
    }
    setFetching(true);
    setError(null);
    setShowSearch(false);
    try {
      const res = await api.debateFetchReport(stockCode.trim());
      setCachedReport(stockCode.trim(), res.report, res.text);
      setReport(res.text);
      setRichReport(res.report);
      setWarning(validateReport(res.text));
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取财报失败');
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!stockName.trim() || stockName.length < 1) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.debateSearchStock(stockName.trim());
        setSearchResults(res.stocks.slice(0, 6));
        setShowSearch(res.stocks.length > 0);
        setSearchError(res.stocks.length === 0 ? '未找到匹配的股票' : null);
      } catch {
        setSearchResults([]);
        setSearchError('搜索服务暂时不可用');
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [stockName]);

  function selectStock(stock: { code: string; name: string; market: string }) {
    setStockCode(stock.code);
    setStockName(stock.name);
    setShowSearch(false);
    setSearchResults([]);
  }

  const startPolling = useCallback((tid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const st = await api.debateRenderStatus(tid);
        setRenderStatus(st.status);
        if (st.status === 'done') {
          setVideoUrl(st.videoUrl ?? null);
          setProbe(st.probe ?? null);
          setStage('done');
          setRenderProgress(null);
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        } else if (st.status === 'error') {
          setError(st.error ?? '渲染失败');
          setStage('error');
          setRenderProgress(null);
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        } else if (st.status === 'cancelled') {
          setError('渲染已取消');
          setStage('idle');
          setRenderProgress(null);
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        } else {
          setRenderProgress(st.progress);
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 2000);
  }, []);

  const handleCancelRender = useCallback(async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    try {
      await api.debateRenderCancel(taskId);
    } catch {
      // cancel 失败不影响重置
    }
    setRenderProgress(null);
    setRenderStatus(null);
    setStage('idle');
  }, [taskId]);

  async function handleViewHistory(entry: DebateHistoryEntry) {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setStage('done');
    setTaskId(entry.task_id);
    setVideoUrl(api.debateFileUrl(entry.task_id));
    setStockCode(entry.stock_code);
    setStockName(entry.stock_name);
    setFormat(entry.format as Format);
    setError(null);
    setShowHistory(false);
  }

  async function handleDeleteHistory(tid: string) {
    try {
      await api.debateHistoryDelete(tid);
      setHistory(prev => prev.filter(h => h.task_id !== tid));
    } catch {
    }
  }

  const handleStart = useCallback(async () => {
    if (!report.trim()) {
      setError('请粘贴财报文本');
      return;
    }
    const validationError = validateReport(report);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setWarning(null);
    setScript(null);
    setAudioTurns(null);
    setVideoUrl(null);
    setTaskId('');
    setRenderProgress(null);
    setRenderStatus(null);

    try {
      setStage('script');
      const genRes = await api.debateGenerate(report, richReport ?? undefined, stockCode || undefined, stockName || undefined);
      setTaskId(genRes.taskId);
      setScript(genRes.script);

      setStage('audio');
      const audioRes = await api.debateAudio(genRes.taskId, genRes.script);
      setAudioTurns(audioRes.audioTurns);

      setStage('render');
      setRenderProgress('启动渲染...');
      setRenderStatus('pending');
      await api.debateRender(genRes.taskId, genRes.script, audioRes.audioTurns, format);
      startPolling(genRes.taskId);
    } catch (e) {
      setError(e instanceof Error ? e.message : '出错了');
      setStage('error');
    }
  }, [report, format, richReport, startPolling, stockCode, stockName]);

  async function retryStage() {
    if (!script && stage === 'error') {
      handleStart();
      return;
    }
    try {
      setError(null);
      if (stage === 'error' && script && !audioTurns) {
        setStage('audio');
        const audioRes = await api.debateAudio(taskId, script);
        setAudioTurns(audioRes.audioTurns);

        setStage('render');
        setRenderProgress('启动渲染...');
        setRenderStatus('pending');
        await api.debateRenderCancel(taskId).catch(() => {});
        await api.debateRender(taskId, script, audioRes.audioTurns, format);
        startPolling(taskId);
      } else if (stage === 'error' && script && audioTurns && !videoUrl) {
        setStage('render');
        setRenderProgress('启动渲染...');
        setRenderStatus('pending');
        await api.debateRenderCancel(taskId).catch(() => {});
        await api.debateRender(taskId, script, audioTurns, format);
        startPolling(taskId);
      } else {
        handleReset();
        handleStart();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '重试失败');
      setStage('error');
    }
  }

  function handleReset() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (stage === 'render' && taskId) {
      api.debateRenderCancel(taskId).catch(() => {});
    }
    setStage('idle');
    setError(null);
    setWarning(null);
    setScript(null);
    setRichReport(null);
    setAudioTurns(null);
    setVideoUrl(null);
    setProbe(null);
    setTaskId('');
    setStockCode('');
    setStockName('');
    setSearchResults([]);
    setShowSearch(false);
    setPlayingTurn(null);
    setSearchError(null);
    setRenderProgress(null);
    setRenderStatus(null);
    loadHistory();
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isBusy) {
        e.preventDefault();
        handleStart();
      }
      if (e.key === 'Escape' && stage !== 'idle') {
        e.preventDefault();
        handleReset();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart, isBusy, stage]);

  const activeSpeaker = deriveActiveSpeaker(script);
  const pastSpeakers = derivePastSpeakers(script, activeSpeaker);
  const upcomingSpeakers = deriveUpcomingSpeakers(script, activeSpeaker);
  const currentPhase = deriveCurrentPhase(script);
  const visitedPhases = deriveVisitedPhases(script);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-canvas -z-10" />
      <div className="fixed inset-0 -z-10 opacity-[0.04] bg-dashboard-grid bg-grid-lg" />
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] -z-10" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-warning/5 blur-[120px] -z-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex flex-col items-center gap-1.5 mt-1">
            <div className="w-11 h-11 rounded-xl bg-primary-softer border border-primary/30 flex items-center justify-center shadow-glow-primary">
              <PersonaIcon name="bull" size={22} color="#22d3ee" />
            </div>
            <div className="w-px h-4 bg-gradient-to-b from-primary/30 to-warning/30" />
            <div className="w-11 h-11 rounded-xl bg-warning-softer border border-warning/30 flex items-center justify-center shadow-glow-warning">
              <PersonaIcon name="bear" size={22} color="#fbbf24" />
            </div>
          </div>
          <PageHeader
            title={
              <span className="flex items-center gap-2.5">
                财报两方辩论
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest bg-surface-2 text-ink-3 border border-hairline">
                  Beta
                </span>
              </span>
            }
            meta={
              <span className="flex items-center gap-2 flex-wrap">
                <span>6 角色 × 7 阶段 · 智能分析财报</span>
                <span className="text-primary font-semibold">乐观派</span>
                <span className="text-ink-muted">vs</span>
                <span className="text-warning font-semibold">谨慎派</span>
              </span>
            }
            actions={
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-2 border border-hairline">
                  <FormatButton
                    active={format === 'mobile'}
                    onClick={() => setFormat('mobile')}
                    disabled={isBusy}
                    tone="primary"
                    label="手机 9:16"
                    icon={<Smartphone className="w-3.5 h-3.5" />}
                  />
                  <FormatButton
                    active={format === 'tv'}
                    onClick={() => setFormat('tv')}
                    disabled={isBusy}
                    tone="warning"
                    label="电视 16:9"
                    icon={<Tv className="w-3.5 h-3.5" />}
                  />
                </div>
                <button
                  onClick={handleReset}
                  disabled={stage === 'idle'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-surface-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  重置
                </button>
              </div>
            }
          />
        </div>

        <PipelineProgress stage={stage} />

        {script && (
          <PersonaLineup
            activeSpeaker={activeSpeaker}
            pastSpeakers={pastSpeakers}
            upcomingSpeakers={upcomingSpeakers}
          />
        )}

        {script && (
          <StageTrack
            currentPhase={currentPhase}
            visitedPhases={visitedPhases}
          />
        )}

        {error && (
          <div className="group relative overflow-hidden rounded-xl border border-destructive/30 bg-destructive/10 backdrop-blur-xl">
            <div className="flex items-start gap-3 p-3.5">
              <div className="w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-sm text-foreground/90 flex-1 pt-0.5">{error}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                {stage === 'error' && (script || taskId) && (
                  <button
                    onClick={retryStage}
                    className="w-6 h-6 rounded-md hover:bg-surface-3 flex items-center justify-center text-destructive/60 hover:text-destructive transition-colors"
                    title="重试失败阶段"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setError(null)}
                  className="w-6 h-6 rounded-md hover:bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <FetchReportCard
              stockName={stockName}
              stockCode={stockCode}
              setStockName={setStockName}
              setStockCode={setStockCode}
              setReport={setReport}
              fetching={fetching}
              isBusy={isBusy}
              searchResults={searchResults}
              searching={searching}
              showSearch={showSearch}
              searchError={searchError}
              onFetch={handleFetchReport}
              onSelectStock={selectStock}
              onCloseSearch={() => setShowSearch(false)}
            />

            <ReportCard
              report={report}
              setReport={setReport}
              richReport={richReport}
              warning={warning}
              setWarning={setWarning}
              isBusy={isBusy}
              onFillSample={() => setReport(SAMPLE_REPORT)}
              onStart={handleStart}
              isWorking={isWorking}
              stage={stage}
            />

            {script && (
              <DebateStage activeSpeaker={activeSpeaker}>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary-soft border border-hairline flex items-center justify-center text-primary">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-semibold text-ink">辩论脚本</h3>
                      <span className="text-[11px] text-ink-3 bg-surface-2 px-2 py-0.5 rounded-full">
                        {script.turns.length} 轮
                      </span>
                    </div>
                    {activeSpeaker && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-ink-muted">现在:</span>
                        <span className={cn('font-semibold tracking-wider', PERSONA[activeSpeaker].text)}>
                          {PERSONA[activeSpeaker].name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                    {script.turns.map((turn, idx) => {
                      const prevSpeaker = idx > 0 ? script.turns[idx - 1].speaker : null;
                      const isSwitch = prevSpeaker && prevSpeaker !== turn.speaker;
                      const isLatest = idx === script.turns.length - 1;
                      const isActive = isLatest && !videoUrl;
                      const audio = audioTurns?.[idx];
                      return (
                        <Fragment key={turn.index}>
                          {isSwitch && (
                            <div className="flex items-center gap-2 py-1.5">
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-hairline-active to-transparent" />
                              <Sparkles className="w-3 h-3 text-ink-muted" />
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-hairline-active to-transparent" />
                            </div>
                          )}
                          <PhaseCard
                            turn={turn}
                            phase={turn.phase ?? null}
                            isActive={isActive}
                            isPlaying={playingTurn === idx}
                            audioDurationSec={audio?.durationSec}
                            onTogglePlay={audio ? () => {
                              if (playingTurn === idx) {
                                setPlayingTurn(null);
                                return;
                              }
                              setPlayingTurn(idx);
                              const a = new Audio(api.debateAudioUrl(taskId, idx));
                              a.onended = () => setPlayingTurn(null);
                              a.play();
                            } : undefined}
                          />
                        </Fragment>
                      );
                    })}
                    <div ref={scriptEndRef} />
                  </div>
                </div>
              </DebateStage>
            )}
          </div>

          <div className="space-y-5">
            <HistoryPanel
              history={history}
              loading={historyLoading}
              expanded={showHistory}
              onToggle={() => setShowHistory(!showHistory)}
              onView={handleViewHistory}
              onDelete={handleDeleteHistory}
            />

            <VideoPreview
              taskId={taskId}
              stage={stage}
              format={format}
              isWorking={isWorking}
              videoUrl={videoUrl}
              probe={probe}
              renderProgress={renderProgress}
              onCancelRender={handleCancelRender}
              onRetry={retryStage}
              onReset={handleReset}
              hasScript={!!script}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineProgress({ stage }: { stage: Stage }) {
  const order: Stage[] = ['script', 'audio', 'render', 'done'];
  const cur = stage === 'idle' ? -1 : stage === 'error' ? 0 : order.indexOf(stage as typeof order[number]);
  return (
    <div className="rounded-xl border border-hairline bg-surface-1/40 backdrop-blur-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
          PIPELINE
        </span>
        <span className="text-[10px] text-ink-muted">生产管线</span>
        {stage !== 'idle' && (
          <span className="ml-auto text-[10px] text-ink-2">{STAGE_LABEL[stage]}</span>
        )}
      </div>
      <div className="flex items-center gap-0">
        {PIPELINE_STAGES.map((s, i) => {
          const me = PIPELINE_STAGES.indexOf(s);
          const isPast = cur > me;
          const isCurrent = cur === me;
          return (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    'relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 shrink-0',
                    isPast
                      ? 'bg-outflow-muted text-outflow ring-1 ring-outflow/30'
                      : isCurrent
                        ? 'bg-primary-soft text-primary ring-1 ring-primary/40 animate-pulse shadow-glow-primary'
                        : 'bg-surface-2 text-ink-muted',
                  )}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : s === 'script' ? (
                    <FileText className="w-3.5 h-3.5" />
                  ) : s === 'audio' ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : s === 'render' ? (
                    <Film className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={cn(
                    'hidden sm:inline text-xs font-medium transition-colors duration-300',
                    isPast ? 'text-ink-2' : isCurrent ? 'text-ink' : 'text-ink-muted',
                  )}
                >
                  {s === 'script' && '编排辩论'}
                  {s === 'audio' && '语音合成'}
                  {s === 'render' && '渲染视频'}
                  {s === 'done' && '完成'}
                </span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-3 transition-colors duration-500',
                    isPast ? 'bg-outflow/30' : isCurrent ? 'bg-primary/20' : 'bg-surface-2',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FetchReportCard({
  stockName,
  stockCode,
  setStockName,
  setStockCode,
  setReport,
  fetching,
  isBusy,
  searchResults,
  searching,
  showSearch,
  searchError,
  onFetch,
  onSelectStock,
  onCloseSearch,
}: {
  stockName: string;
  stockCode: string;
  setStockName: (v: string) => void;
  setStockCode: (v: string) => void;
  setReport: (v: string) => void;
  fetching: boolean;
  isBusy: boolean;
  searchResults: { code: string; name: string; market: string }[];
  searching: boolean;
  showSearch: boolean;
  searchError: string | null;
  onFetch: () => void;
  onSelectStock: (stock: { code: string; name: string; market: string }) => void;
  onCloseSearch: () => void;
}) {
  return (
    <GlassPanel className="group transition-all duration-300">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary-soft border border-primary/30 flex items-center justify-center text-primary">
            <Search className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-ink">自动获取财报</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {stockName && stockCode ? (
              <div className="flex items-center gap-2 bg-black/40 border border-primary/30 rounded-lg px-3 py-2.5">
                <span className="text-xs font-medium text-primary">{stockName}</span>
                <span className="text-[10px] text-ink-3 font-mono">{stockCode}</span>
                <button
                  onClick={() => {
                    setStockCode('');
                    setStockName('');
                    setReport('');
                  }}
                  className="ml-auto w-5 h-5 rounded hover:bg-surface-3 flex items-center justify-center text-ink-3 hover:text-ink"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={stockName}
                  onChange={(e) => {
                    setStockName(e.target.value);
                    if (!e.target.value) {
                      setStockCode('');
                    }
                  }}
                  placeholder="搜索股票名称或代码，如 茅台、600519"
                  disabled={isBusy || fetching}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && stockCode && !isBusy && !fetching) {
                      onFetch();
                    }
                    if (e.key === 'Escape') {
                      onCloseSearch();
                    }
                  }}
                  className="w-full bg-black/40 border border-hairline rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 disabled:opacity-40"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                )}
                {searchError && (
                  <p className="mt-1.5 text-[10px] text-destructive/70 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {searchError}
                  </p>
                )}
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-1 border border-hairline rounded-lg overflow-hidden shadow-2xl z-50">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.code}
                        onClick={() => onSelectStock(stock)}
                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-surface-2 transition-colors text-left"
                      >
                        <span className="text-sm text-ink font-medium">{stock.name}</span>
                        <span className="text-[10px] font-mono text-ink-3">{stock.code}</span>
                        <span className="text-[9px] text-ink-muted ml-auto">{stock.market}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={onFetch}
            disabled={isBusy || fetching || !stockCode.trim()}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-primary-softer border border-primary/30 text-primary hover:bg-primary-soft hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary-softer shrink-0 flex items-center gap-1.5"
          >
            {fetching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                获取中
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                获取
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-muted flex items-center gap-1">
          <Info className="w-3 h-3" />
          自动从东方财富获取最新财报，或手动在下方粘贴
        </p>
      </div>
    </GlassPanel>
  );
}

function ReportCard({
  report,
  setReport,
  richReport,
  warning,
  setWarning,
  isBusy,
  onFillSample,
  onStart,
  isWorking,
  stage,
}: {
  report: string;
  setReport: (v: string) => void;
  richReport: Record<string, unknown> | null;
  warning: string | null;
  setWarning: (v: string | null) => void;
  isBusy: boolean;
  onFillSample: () => void;
  onStart: () => void;
  isWorking: boolean;
  stage: Stage;
}) {
  return (
    <GlassPanel className="group transition-all duration-300">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-surface-3 border border-hairline flex items-center justify-center text-ink-2">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">财报文本</h3>
          </div>
          <button
            className="text-[11px] text-ink-3 hover:text-primary transition-colors flex items-center gap-1"
            onClick={onFillSample}
          >
            <Download className="w-3 h-3" />
            填入示例
          </button>
        </div>

        {richReport && (
          <div className="mb-3 rounded-lg border border-hairline bg-surface-2 overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2 border-b border-hairline">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">
                关键指标
              </span>
              <span className="flex items-center gap-1 text-[10px] ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-outflow/60" />
                <span className="text-ink-muted">已获取</span>
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-px bg-hairline-strong">
              {[
                { label: '营收', value: fmtNum(richReport.revenue), unit: '亿', sub: yoyStr(richReport.revenueYoY) },
                { label: '归母净利', value: fmtNum(richReport.netProfit), unit: '亿', sub: yoyStr(richReport.netProfitYoY) },
                { label: '扣非净利', value: fmtNum(richReport.deductedProfit), unit: '亿' },
                { label: '毛利率', value: typeof richReport.grossMargin === 'number' ? richReport.grossMargin.toFixed(1) : '—', unit: '%' },
                { label: '净利率', value: typeof richReport.netMargin === 'number' ? richReport.netMargin.toFixed(1) : '—', unit: '%' },
                { label: 'ROE', value: typeof richReport.roe === 'number' ? richReport.roe.toFixed(1) : '—', unit: '%' },
                { label: '资产负债率', value: typeof richReport.debtAssetRatio === 'number' ? richReport.debtAssetRatio.toFixed(1) : '—', unit: '%' },
                { label: '经营现金流', value: fmtNum(richReport.operatingCashFlow), unit: '亿' },
              ].map((item) => (
                <div key={item.label} className="bg-surface-2 px-3 py-2.5">
                  <div className="text-[10px] text-ink-3 mb-0.5">{item.label}</div>
                  <div className="text-sm font-semibold text-ink tracking-tight">
                    {item.value}
                    <span className="text-[10px] text-ink-3 font-normal ml-0.5">{item.unit}</span>
                  </div>
                  {item.sub && (
                    <div className={cn('text-[10px] mt-0.5 font-mono', item.sub.positive ? 'text-inflow/70' : 'text-outflow/70')}>
                      {item.sub.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            value={report}
            onChange={(e) => {
              const val = e.target.value;
              setReport(val);
              if (val.trim().length >= 20) {
                setWarning(validateReport(val));
              } else {
                setWarning(null);
              }
            }}
            placeholder="粘贴 A 股上市公司财报关键内容（营收、利润、增速、风险等）"
            rows={8}
            disabled={isBusy}
            className="w-full bg-black/40 border border-hairline rounded-lg px-4 py-3 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 disabled:opacity-40 resize-y font-light leading-relaxed"
            maxLength={20000}
          />
          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-ink-muted bg-black/60 px-2 py-0.5 rounded">
            {report.length}/20000
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-xs">
            {warning ? (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning-soft border border-warning/30 text-warning">
                <AlertTriangle className="w-3.5 h-3.5" />
                {warning}
              </span>
            ) : report.length > 0 ? (
              <span className="flex items-center gap-1 text-ink-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-outflow/60" />
                文本格式验证通过
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-ink-muted font-mono">⌘/Ctrl+Enter</span>
            <button
              onClick={onStart}
              disabled={isBusy || report.trim().length < 20}
              className="relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 overflow-hidden group/btn disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary-hover opacity-90 group-hover/btn:opacity-100 transition-opacity" />
              <span className="absolute inset-0 bg-[linear-gradient(60deg,transparent_30%,rgba(255,255,255,0.15)_50%,transparent_70%)] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
              <span className="relative flex items-center gap-2 text-primary-ink">
                {isWorking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {STAGE_LABEL[stage]}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    开始辩论
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function HistoryPanel({
  history,
  loading,
  expanded,
  onToggle,
  onView,
  onDelete,
}: {
  history: DebateHistoryEntry[];
  loading: boolean;
  expanded: boolean;
  onToggle: () => void;
  onView: (entry: DebateHistoryEntry) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <GlassPanel className="group transition-all duration-300">
      <div className="p-4 sm:p-5">
        <button onClick={onToggle} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-soft border border-hairline flex items-center justify-center text-primary">
              <HistoryIcon className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">历史记录</h3>
            {history.length > 0 && (
              <span className="text-[10px] text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </div>
          <span
            className={cn(
              'text-ink-3 transition-transform duration-200',
              expanded ? 'rotate-180' : '',
            )}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
            {!loading && history.length === 0 && (
              <EmptyState compact title="暂无历史记录" />
            )}
            {!loading && history.map((entry) => (
              <div
                key={entry.task_id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-hairline hover:bg-surface-2 transition-colors group/item"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.stock_name && (
                      <span className="text-xs font-medium text-ink">{entry.stock_name}</span>
                    )}
                    {entry.stock_code && (
                      <span className="text-[10px] font-mono text-ink-3">{entry.stock_code}</span>
                    )}
                    {entry.format === 'tv' && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-warning-soft text-warning/70 border border-warning/30">
                        16:9
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-ink-muted">{entry.created_at}</span>
                    <span className="text-[10px] text-ink-muted">{entry.turn_count} 轮</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onView(entry)}
                    className="w-7 h-7 rounded-md hover:bg-primary-softer flex items-center justify-center text-ink-3 hover:text-primary transition-colors"
                    title="查看"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(entry.task_id)}
                    className="w-7 h-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-ink-3 hover:text-destructive transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

function VideoPreview({
  taskId,
  stage,
  format,
  isWorking,
  videoUrl,
  probe,
  renderProgress,
  onCancelRender,
  onRetry,
  onReset,
  hasScript,
}: {
  taskId: string;
  stage: Stage;
  format: Format;
  isWorking: boolean;
  videoUrl: string | null;
  probe: DebateProbeReport | null;
  renderProgress: string | null;
  onCancelRender: () => void;
  onRetry: () => void;
  onReset: () => void;
  hasScript: boolean;
}) {
  return (
    <GlassPanel className="group transition-all duration-300 h-full">
      <div className="p-4 sm:p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-soft border border-hairline flex items-center justify-center text-primary">
              <Film className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">视频预览</h3>
            {probe && (
              <span className="text-[10px] text-outflow/70 bg-outflow-softer px-1.5 py-0.5 rounded-full border border-outflow/30">
                已渲染
              </span>
            )}
          </div>
          {videoUrl && (
            <a
              href={api.debateFileUrl(taskId)}
              download={`debate-${taskId}.mp4`}
              className="flex items-center gap-1.5 text-[11px] text-ink-3 hover:text-primary transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              下载 MP4
            </a>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          {!taskId && stage === 'idle' && (
            <div className="relative w-full max-w-[360px] mx-auto">
              <div className="aspect-[9/16] rounded-2xl border border-hairline-active bg-gradient-to-b from-surface-1 to-canvas overflow-hidden relative flex items-center justify-center">
                <Spotlight color="#22d3ee" intensity="med" />
                <div className="text-center px-8 relative z-10">
                  <div className="relative mx-auto w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full bg-primary-soft animate-pulse" />
                    <div className="absolute inset-1 rounded-full bg-primary-softer flex items-center justify-center">
                      <PersonaIcon name="moderator" size={32} color="#22d3ee" />
                    </div>
                  </div>
                  <p className="text-sm text-ink-3 font-medium mb-1">等待生成</p>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    输入股票代码获取财报<br />或粘贴文本后点击"开始辩论"
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-ink-muted">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline font-mono">⌘</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline font-mono">Enter</kbd>
                  </div>
                </div>
                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[120px] h-[5px] rounded-full bg-hairline-active z-10" />
                <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-hairline-active z-10" />
              </div>
            </div>
          )}

          {isWorking && (
            <div className="relative w-full max-w-[360px] mx-auto">
              <div className="aspect-[9/16] rounded-2xl border border-hairline-active bg-gradient-to-b from-surface-1 to-canvas overflow-hidden relative flex items-center justify-center">
                <Spotlight color="#00d4ff" intensity="med" />
                <div className="text-center px-8 w-full relative z-10">
                  {stage !== 'render' ? (
                    <>
                      <div className="relative mx-auto w-20 h-20 mb-5">
                        <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-2 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                        <div className="absolute inset-4 rounded-full bg-primary-soft flex items-center justify-center">
                          {stage === 'script' ? (
                            <FileText className="w-8 h-8 text-primary" />
                          ) : (
                            <Volume2 className="w-8 h-8 text-primary" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-ink-2 font-medium mb-1">{STAGE_LABEL[stage]}</p>
                    </>
                  ) : (
                    <>
                      <div className="relative mx-auto w-20 h-20 mb-5">
                        <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-2 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                        <div className="absolute inset-4 rounded-full bg-primary-soft flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                      </div>
                      <p className="text-sm text-ink-2 font-medium mb-3">渲染视频中...</p>
                      <div className="w-full max-w-[220px] mx-auto bg-surface-2 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-warning rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                      {renderProgress && (
                        <p className="text-xs text-ink-3 mb-3 font-mono">{renderProgress}</p>
                      )}
                      <button
                        onClick={onCancelRender}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-outflow-softer border border-outflow/30 text-outflow hover:bg-outflow-muted transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        取消渲染
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {videoUrl && stage === 'done' && (
            <div className="relative w-full max-w-[360px] mx-auto">
              <div
                className={cn(
                  'relative rounded-2xl overflow-hidden border border-hairline-active bg-black shadow-glow-primary',
                  format === 'tv' ? 'aspect-video' : 'aspect-[9/16]',
                )}
              >
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary/10 via-transparent to-warning/10 pointer-events-none z-10" />
                <video
                  key={taskId}
                  src={api.debateFileUrl(taskId)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
              {probe && (
                <div className="mt-3">
                  <ProbeCard probe={probe} />
                </div>
              )}
            </div>
          )}

          {stage === 'error' && !videoUrl && (
            <div className="relative w-full max-w-[360px] mx-auto">
              <div className="aspect-[9/16] rounded-2xl border border-destructive/30 bg-gradient-to-b from-destructive/[0.05] to-transparent overflow-hidden relative flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <p className="text-sm text-destructive font-medium mb-1">生成失败</p>
                  <p className="text-[11px] text-destructive/60">查看上方错误提示</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {(hasScript || taskId) && (
                      <button
                        onClick={onRetry}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary-softer border border-primary/30 text-primary hover:bg-primary-soft transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        重试
                      </button>
                    )}
                    <button
                      onClick={onReset}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      重新开始
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

function FormatButton({
  active, onClick, disabled, tone, label, icon,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  tone: 'primary' | 'warning';
  label: string;
  icon: React.ReactNode;
}) {
  const toneClass = tone === 'primary'
    ? 'text-primary shadow-glow-primary'
    : 'text-warning shadow-glow-warning';
  const activeBg = tone === 'primary'
    ? 'bg-primary-soft border border-primary/30'
    : 'bg-warning-soft border border-warning/30';
  return (
    <button
      className={cn(
        'relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300',
        active ? toneClass : 'text-ink-3 hover:text-ink-2',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {active && <span className={cn('absolute inset-0 rounded-md', activeBg)} />}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

function ProbeCard({ probe }: { probe: DebateProbeReport }) {
  const diffTone = Math.abs(probe.diffSec) <= 2 ? 'text-ink-2' : 'text-warning';
  return (
    <div className="group rounded-lg border border-hairline bg-surface-2 overflow-hidden transition-all hover:border-hairline-active">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-3">
            ffprobe 校验
          </span>
          <span
            className={cn(
              'text-[10px] font-semibold flex items-center gap-1',
              probe.hasAudio ? 'text-outflow' : 'text-destructive',
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', probe.hasAudio ? 'bg-outflow' : 'bg-destructive')} />
            {probe.hasAudio ? '有音轨' : '无音轨'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="space-y-1">
            <span className="text-ink-muted">编码</span>
            <p className="text-ink-2 font-mono">{probe.hasAudio ? probe.audioCodec : '—'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-ink-muted">音频时长</span>
            <p className="text-ink-2 font-mono">
              {probe.hasAudio ? `${probe.audioDurationSec.toFixed(2)}s` : '—'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-ink-muted">时长差</span>
            <p className={cn('font-mono', diffTone)}>
              {probe.diffSec >= 0 ? '+' : ''}{probe.diffSec.toFixed(2)}s
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-ink-muted">状态</span>
            <p className={Math.abs(probe.diffSec) <= 2 ? 'text-outflow/70' : 'text-warning/70'}>
              {Math.abs(probe.diffSec) <= 2 ? '正常' : '偏差较大'}
            </p>
          </div>
        </div>
        {probe.warnings.length > 0 && (
          <div className="pt-1.5 border-t border-hairline space-y-0.5">
            {probe.warnings.map((w, i) => (
              <p key={i} className="text-[10px] text-warning/70 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DebatePage;
