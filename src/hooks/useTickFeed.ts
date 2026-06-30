import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';

export interface TickPoint {
  Time: string;
  Name: string;
  Net: number;
  Rate: number;
  ChangePct: number;
  SuperNet: number;
  SuperRate: number;
  BigNet: number;
  BigRate: number;
  MainRate: number;
  Volume: number;
  Turnover: number;
  BKCode: string;
  TurnoverRate: number;
  LeadStockName: string;
  LeadStockChangePct: number;
  TotalMarketCap: number;
  CirculatingMarketCap: number;
}

export interface TickSnapshot {
  points: TickPoint[];
  date: string;
  running: boolean;
  count: number;
  lastTime: string;
}

interface TickStreamMessage {
  type: string;
  text: string;
}

const AUTO_START_BEFORE = 5;

function todayAtHHMM(hours: number, minutes: number): number {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

function getNextAutoStart(now: number): { time: number; label: string } | null {
  const windows = [
    { open: todayAtHHMM(9, 30), label: '早盘' },
    { open: todayAtHHMM(13, 0), label: '午盘' },
  ];
  for (const w of windows) {
    const start = w.open - AUTO_START_BEFORE * 60 * 1000;
    if (now < start) return { time: start, label: w.label };
  }
  return null;
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function isInAutoWindow(now: number): boolean {
  const windows = [
    { start: todayAtHHMM(9, 30) - AUTO_START_BEFORE * 60 * 1000, end: todayAtHHMM(9, 35) },
    { start: todayAtHHMM(13, 0) - AUTO_START_BEFORE * 60 * 1000, end: todayAtHHMM(13, 5) },
  ];
  return windows.some((w) => now >= w.start && now <= w.end);
}

export function useTickFeed(mode: 'live' | 'history') {
  const [snapshot, setSnapshot] = useState<TickSnapshot | null>(null);
  const [now, setNow] = useState(Date.now());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyDate, setHistoryDate] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [tickDataLoading, setTickDataLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const autoStartSuppressed = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoStartTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const disconnectSSE = useCallback((suppressAutoStart = true) => {
    autoStartSuppressed.current = suppressAutoStart;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setConnected(false);
  }, []);

  const loadDateData = useCallback(async (date: string) => {
    setTickDataLoading(true);
    try {
      const tickData = await api.getTickData(date, 'full');
      if (tickData.points?.length) {
        const times = new Set(tickData.points.map((p: TickPoint) => p.Time));
        setSnapshot({
          points: tickData.points,
          date: tickData.date,
          running: false,
          count: times.size,
          lastTime: tickData.points[tickData.points.length - 1].Time,
        });
      } else {
        setSnapshot(null);
      }
    } catch {
      void 0;
    } finally {
      setTickDataLoading(false);
    }
  }, []);

  const connectSSE = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(api.tickStreamUrl(), { signal: controller.signal });
      if (!res.body) throw new Error('no body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      setConnected(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg: TickStreamMessage = JSON.parse(line);
            if (msg.type === 'tick') {
              const data: TickSnapshot = JSON.parse(msg.text);
              setSnapshot(data);
              setConnected(true);
            }
          } catch {
            void 0;
          }
        }
      }
    } catch {
      setConnected(false);
      setError('连接断开，尝试重连...');
      reconnectTimer.current = setTimeout(() => {
        if (!autoStartSuppressed.current) {
          void connectSSE();
        }
      }, 5000);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  const handleStart = useCallback(async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    autoStartSuppressed.current = false;
    setError(null);
    try {
      await api.startTick();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '启动失败';
      disconnectSSE(false);
      if (!errMsg.includes('采集中')) {
        setError(errMsg);
      }
      return;
    } finally {
      connectingRef.current = false;
    }
    await connectSSE();
  }, [connectSSE, disconnectSSE]);

  const handleStop = useCallback(async () => {
    autoStartSuppressed.current = true;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    try {
      await api.stopTick();
    } catch {
      void 0;
    }
    disconnectSSE();
  }, [disconnectSSE]);

  useEffect(() => {
    const initPage = async () => {
      try {
        const datesData = await api.getDates();
        const dates = (datesData.dates || []).map((d) => d.date);
        dates.sort();
        setAvailableDates(dates);
        if (dates.length === 0) return;

        const latest = dates[dates.length - 1];
        setHistoryDate(latest);

        const data = await api.getTickStatus();
        if (data.running) {
          autoStartSuppressed.current = false;
          await connectSSE();
          return;
        }

        await loadDateData(latest);
      } catch {
        void 0;
      }
    };
    void initPage();
  }, [connectSSE, loadDateData]);

  useEffect(() => {
    if (mode === 'history' && historyDate) {
      void loadDateData(historyDate);
    }
  }, [historyDate, loadDateData, mode]);

  useEffect(() => {
    if (isWeekend() || mode !== 'live') return;
    if (autoStartSuppressed.current || connected) return;
    if (isInAutoWindow(Date.now())) {
      void handleStart();
    }
    if (autoStartTimerRef.current) clearInterval(autoStartTimerRef.current);
    autoStartTimerRef.current = setInterval(() => {
      if (autoStartSuppressed.current) return;
      if (!connected && isInAutoWindow(Date.now())) {
        void handleStart();
      }
    }, 30000);
    return () => {
      if (autoStartTimerRef.current) clearInterval(autoStartTimerRef.current);
    };
  }, [connected, handleStart, mode]);

  useEffect(() => () => disconnectSSE(), [disconnectSSE]);

  const nextAutoStart = useMemo(() => getNextAutoStart(now), [now]);
  const showAutoCountdown = !connected && !autoStartSuppressed.current && nextAutoStart !== null;

  return {
    snapshot,
    now,
    connected,
    error,
    historyDate,
    availableDates,
    tickDataLoading,
    nextAutoStart,
    showAutoCountdown,
    connectingRef,
    clearSnapshot: () => setSnapshot(null),
    setHistoryDate,
    loadDateData,
    handleStart,
    handleStop,
  };
}
