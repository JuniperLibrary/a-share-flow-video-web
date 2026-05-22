import { useState, useCallback } from 'react';

const apiBase = import.meta.env.VITE_API_BASE_URL || '';

export function apiUrl(path: string): string {
  return apiBase ? `${apiBase}${path}` : path;
}

export function fmtNet(n: number): string {
  if (isNaN(n)) return '—';
  return (n > 0 ? '+' : '') + n.toFixed(1) + '亿';
}

export function trendInfo(n: number): string {
  return n > 0 ? '↑ 净流入' : '↓ 净流出';
}

export function trendClass(n: number): string {
  return n > 0 ? 'tag-red' : 'tag-green';
}

export function netColor(n: number): string {
  return n > 0 ? '#f53f3f' : '#00b42a';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function useCopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, []);

  return { copied, handleCopy };
}
