import { useState, useCallback, useRef, useEffect } from 'react';
import type { SSEMessage } from '../types';

type StreamFetch = (signal: AbortSignal) => Promise<Response>;

interface UseSSEReturn {
  logs: string[];
  progress: string;
  isRunning: boolean;
  startStream: (fetchFn: StreamFetch, onData?: (msg: SSEMessage) => void) => Promise<void>;
}

export function useSSE(): UseSSEReturn {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    const controller = abortRef.current;
    abortRef.current = null;
    controller?.abort();
  }, []);

  const startStream = useCallback(async (fetchFn: StreamFetch, onData?: (msg: SSEMessage) => void) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLogs([]);
    setProgress('');
    setIsRunning(true);

    try {
      const res = await fetchFn(controller.signal);
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string; message?: string } | null;
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          let msg: SSEMessage;
          try {
            msg = JSON.parse(line) as SSEMessage;
          } catch {
            // Ignore keep-alives and malformed non-JSON lines only.
            continue;
          }

          if (msg.type === 'log' || msg.type === 'progress') {
            setLogs(prev => [...prev, msg.text]);
            if (msg.type === 'progress') setProgress(msg.text);
          } else if (msg.type === 'data') {
            setLogs(prev => [...prev, '数据加载完成']);
          } else if (msg.type === 'done') {
            setProgress(msg.text);
          } else if (msg.type === 'error') {
            throw new Error(msg.text || '生成失败');
          }
          onData?.(msg);
        }
      }
    } catch (e: unknown) {
      if (controller.signal.aborted) return;
      controller.abort();
      const msg = e instanceof Error ? e.message : String(e);
      setLogs(prev => [...prev, `❌ ${msg}`]);
      throw e;
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsRunning(false);
      }
    }
  }, []);

  return { logs, progress, isRunning, startStream };
}
