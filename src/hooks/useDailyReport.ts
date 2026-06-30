import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { DailyReport } from '../types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const SHANGHAI_TZ = 'Asia/Shanghai';

export function todayShanghai(): string {
  return dayjs().tz(SHANGHAI_TZ).format('YYYY-MM-DD');
}

interface UseDailyReportOptions {
  date: string;
  enabled?: boolean;
}

export function useDailyReport({ date, enabled = true }: UseDailyReportOptions) {
  return useQuery({
    queryKey: ['dailyReport', date],
    queryFn: () => api.getDailyReport(date),
    enabled: enabled && !!date,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30_000,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return error instanceof Error && !error.message.includes('404');
    },
    refetchOnWindowFocus: true,
  });
}

export function useReportDates() {
  return useQuery({
    queryKey: ['dailyReportDates'],
    queryFn: () => api.getDailyReportDates(),
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

interface GenerateReportParams {
  date: string;
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date }: GenerateReportParams) =>
      api.generateDailyReport(date),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['dailyReport', variables.date], data);
      queryClient.invalidateQueries({ queryKey: ['dailyReportDates'] });
    },
  });
}

export function usePrevNextDate(dates: string[], currentDate: string) {
  const idx = dates.indexOf(currentDate);
  return {
    prevDate: idx > 0 ? dates[idx - 1] : null,
    nextDate: idx >= 0 && idx < dates.length - 1 ? dates[idx + 1] : null,
    hasPrev: idx > 0,
    hasNext: idx >= 0 && idx < dates.length - 1,
  };
}

export function usePrefetchAdjacentDates(date: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchDate = async (d: string) => {
      if (!d) return;
      await queryClient.prefetchQuery({
        queryKey: ['dailyReport', d],
        queryFn: () => api.getDailyReport(d),
        staleTime: 5 * 60 * 1000,
      });
    };

    if (!date) return;

    const d = new Date(date);
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    prefetchDate(prev.toISOString().slice(0, 10));
    prefetchDate(next.toISOString().slice(0, 10));
  }, [date, queryClient]);
}