import { useMemo, useCallback } from 'react';
import { Button, DatePicker, Message as ArcoMessage } from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import {
  useDailyReport,
  useReportDates,
  useGenerateReport,
  usePrevNextDate,
  usePrefetchAdjacentDates,
  todayShanghai,
} from '../hooks/useDailyReport';
import { useUrlSearchParam } from '../hooks/useUrlSearchParams';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { TickerTape } from '../components/daily-report/TickerTape';
import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../lib/utils';
import type { DailyReport } from '../types';

const BloombergHeader = lazy(() =>
  import('../components/daily-report/BloombergHeader').then((m) => ({ default: m.BloombergHeader }))
);
const ReportContent = lazy(() =>
  import('../components/daily-report/ReportContent').then((m) => ({ default: m.ReportContent }))
);

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-glass-subtle', className)}
      aria-hidden="true"
    />
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="日报加载中">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SkeletonBlock className="h-48" />
        <SkeletonBlock className="h-48" />
      </div>
      <SkeletonBlock className="h-40" />
    </div>
  );
}

function ComponentSkeleton() {
  return <SkeletonBlock className="h-40" />;
}

let _queryClient: QueryClient | null = null;
function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: true },
      },
    });
  }
  return _queryClient;
}

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<ComponentSkeleton />}>
      <Suspense fallback={<ComponentSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export function DailyReportPage() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <DailyReportPageInner />
    </QueryClientProvider>
  );
}

function DailyReportPageInner() {
  const [selectedDate, setSelectedDate] = useUrlSearchParam('date', '');

  const { data: datesData, isLoading: datesLoading } = useReportDates();
  const dates = datesData?.dates ?? [];

  const effectiveDate = selectedDate || (dates.length > 0 ? dates[0] : todayShanghai());

  const { data: report, isLoading: reportLoading, error: reportError } = useDailyReport({
    date: effectiveDate,
    enabled: !!effectiveDate,
  });

  const generateMutation = useGenerateReport();

  const { prevDate, nextDate, hasPrev, hasNext } = usePrevNextDate(dates, effectiveDate);
  const qc = useQueryClient();

  usePrefetchAdjacentDates(effectiveDate);

  const parsed = useMemo(() => {
    if (!report?.report) return null;
    try {
      return JSON.parse(report.report) as NonNullable<DailyReport['_parsed']>;
    } catch {
      return null;
    }
  }, [report]);

  const tickerSectors = useMemo(() => {
    if (!parsed) return [];
    const inflows = Array.isArray(parsed.topInflows) ? parsed.topInflows : [];
    const outflows = Array.isArray(parsed.topOutflows) ? parsed.topOutflows : [];
    return [...inflows, ...outflows].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [parsed]);

  const handlePrevDate = useCallback(() => {
    if (prevDate) setSelectedDate(prevDate);
  }, [prevDate, setSelectedDate]);

  const handleNextDate = useCallback(() => {
    if (nextDate) setSelectedDate(nextDate);
  }, [nextDate, setSelectedDate]);

  const handleGenerate = useCallback(() => {
    generateMutation.mutate(
      { date: effectiveDate },
      {
        onError: () => ArcoMessage.error('生成日报失败，请确认当日已有板块数据'),
      },
    );
  }, [effectiveDate, generateMutation]);

  const handleRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['dailyReport'] });
    ArcoMessage.success('日报已刷新');
  }, [qc]);

  useKeyboardShortcuts({
    prevDate: handlePrevDate,
    nextDate: handleNextDate,
    refresh: handleRefresh,
    generate: handleGenerate,
    hasPrev,
    hasNext,
  });

  if (datesLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-3" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <LazyWrapper>
        {effectiveDate && (
          <BloombergHeader
            date={effectiveDate}
            generated={report?.generated}
            loading={generateMutation.isPending}
            onGenerate={handleGenerate}
            onPrevDate={hasPrev ? handlePrevDate : undefined}
            onNextDate={hasNext ? handleNextDate : undefined}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        )}
      </LazyWrapper>

      <div className="flex items-center gap-3">
        <DatePicker
          style={{ width: 160 }}
          value={selectedDate}
          onChange={(v) => setSelectedDate(v || '')}
          placeholder="选择日期"
        />
        <Button
          type="primary"
          loading={generateMutation.isPending}
          onClick={handleGenerate}
          icon={<IconRefresh />}
          className="!bg-primary !border-primary !text-primary-ink !font-semibold border-0"
          size="small"
        >
          {generateMutation.isPending ? '生成中…' : '生成日报'}
        </Button>
      </div>

      {generateMutation.isPending && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-primary">正在生成日报，请耐心等待（预计 5-15 秒…）</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-glass-sm">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" style={{ animationDuration: '2s' }} />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {reportLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ReportSkeleton />
          </motion.div>
        ) : reportError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <EmptyState
              title="加载日报失败"
              description={reportError instanceof Error ? reportError.message : '请检查网络连接后重试'}
              action={
                <Button type="primary" size="small" onClick={handleGenerate}>
                  生成日报
                </Button>
              }
            />
          </motion.div>
        ) : !report ? (
          <motion.div
            key="no-report"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <EmptyState
              title="暂无日报"
              description={
                effectiveDate
                  ? '该日期还没有日报和数据，点击「生成日报」创建'
                  : '选择一个日期或点击生成按钮'
              }
            />
          </motion.div>
        ) : !parsed ? (
          <motion.div
            key="parse-error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <EmptyState
              title="日报数据解析失败"
              description="日报数据格式异常，请尝试重新生成"
              action={
                <Button
                  type="primary"
                  loading={generateMutation.isPending}
                  onClick={handleGenerate}
                  size="small"
                >
                  重新生成
                </Button>
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <LazyWrapper>
              <ReportContent report={report} parsed={parsed} date={effectiveDate} />
            </LazyWrapper>
          </motion.div>
        )}
      </AnimatePresence>

      {tickerSectors.length > 0 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <TickerTape sectors={tickerSectors} />
        </div>
      )}
    </div>
  );
}
