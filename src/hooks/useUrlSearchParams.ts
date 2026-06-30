import { useState, useCallback, useRef } from 'react';

/**
 * useUrlSearchParams — 将组件状态同步到 URL query string。
 *
 * 让 DailyReportPage 的日期和时段选择可分享、可书签。
 * 用法：const [date, setDate] = useUrlSearchParam('date', todayShanghai());
 *
 * 不需要 react-router，直接操作 history.replaceState。
 */
export function useUrlSearchParam(key: string, defaultValue: string): [string, (val: string) => void] {
  const initial = useRef(readParam(key) ?? defaultValue);
  const [value, setValue] = useState(initial.current);

  const setParam = useCallback(
    (val: string) => {
      setValue(val);
      writeParam(key, val);
    },
    [key],
  );

  return [value, setParam];
}

function readParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function writeParam(key: string, val: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (val) {
    url.searchParams.set(key, val);
  } else {
    url.searchParams.delete(key);
  }
  window.history.replaceState(null, '', url.toString());
}
