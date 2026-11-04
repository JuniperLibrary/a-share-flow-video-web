import { useState, useEffect, Suspense, lazy } from 'react';
import {
  IconDashboard,
  IconPlayArrow,
  IconEye,
  IconList,
  IconSettings,
  IconFile,
  IconStar,
  IconEdit,
  IconSound,
  IconMessage,
  IconCompass,
} from '@arco-design/web-react/icon';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { api } from './api';
import { Sidebar } from './components/ui/sidebar';
import { MobileHeader } from './components/ui/mobile-header';

// 各页面按需加载：此前全部静态 import，导致所有页面的代码都打进入口 chunk（约 2.1MB）。
// 这里改为 lazy，配合下方已存在的 Suspense，首屏只需下载当前页面的代码。
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TickPage = lazy(() => import('./pages/TickPage').then((m) => ({ default: m.TickPage })));
const GeneratePage = lazy(() => import('./pages/GeneratePage').then((m) => ({ default: m.GeneratePage })));
const PreviewPage = lazy(() => import('./pages/PreviewPage').then((m) => ({ default: m.PreviewPage })));
const ConfigPage = lazy(() => import('./pages/ConfigPage').then((m) => ({ default: m.ConfigPage })));
const NewsPage = lazy(() => import('./pages/NewsPage').then((m) => ({ default: m.NewsPage })));
const NotesPage = lazy(() => import('./pages/NotesPage').then((m) => ({ default: m.NotesPage })));
const FundTab = lazy(() => import('./fund/FundTab'));
const TTSPage = lazy(() => import('./pages/TTSPage').then((m) => ({ default: m.TTSPage })));
const DebatePage = lazy(() => import('./pages/DebatePage').then((m) => ({ default: m.DebatePage })));
const DailyReportPage = lazy(() => import('./pages/DailyReportPage').then((m) => ({ default: m.DailyReportPage })));

type Page = 'dashboard' | 'tick' | 'generate' | 'preview' | 'config' | 'news' | 'fund' | 'notes' | 'tts' | 'debate' | 'dailyreport';

const allNavItems: { key: Page; label: string; icon: React.ReactNode; staticOnly?: boolean }[] = [
  { key: 'dashboard', label: '首页', icon: <IconDashboard /> },
  { key: 'fund', label: '基金宝', icon: <IconStar /> },
  { key: 'tts', label: 'TTS 配音', icon: <IconSound /> },
  { key: 'notes', label: '开发笔记', icon: <IconEdit /> },
  { key: 'debate', label: '财报辩论', icon: <IconMessage />, staticOnly: true },
  { key: 'tick', label: 'Tick 采集', icon: <IconList />, staticOnly: true },
  { key: 'generate', label: '视频生成', icon: <IconPlayArrow />, staticOnly: true },
  { key: 'preview', label: '视频预览', icon: <IconEye />, staticOnly: true },
  { key: 'news', label: '新闻资讯', icon: <IconFile /> },
  { key: 'config', label: 'AI 配置', icon: <IconSettings />, staticOnly: true },
  { key: 'dailyreport', label: '每日日报', icon: <IconCompass />, staticOnly: true },
];

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [dates, setDates] = useState<string[]>([]);
  const [previewDate, setPreviewDate] = useState('');

  useEffect(() => {
    api.getDates().then(d => {
      setDates(d.dates?.map(x => x.date) || []);
    }).catch(() => void 0);
  }, []);

  const staticMode = api.isStaticMode();
  const navItems = staticMode ? allNavItems.filter(i => !i.staticOnly) : allNavItems;

  useEffect(() => {
    if (staticMode && allNavItems.find(i => i.key === page)?.staticOnly) {
      setPage('dashboard');
    }
  }, [staticMode, page]);

  const handleDone = (date: string) => {
    setPreviewDate(date);
    setPage('preview');
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas md:flex-row">
      <MobileHeader />
      <Sidebar
        brand="A股情绪流"
        subtitle="板块资金流向可视化"
        items={navItems}
        activeKey={page}
        onSelect={(key) => setPage(key as Page)}
      />
      <main className="flex-1 min-w-0 bg-canvas overflow-auto">
        <div className="p-6">
          <Suspense fallback={<div className="text-ink-3 text-sm">加载中…</div>}>
            {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
            {page === 'tick' && <TickPage />}
            {page === 'generate' && <GeneratePage dates={dates} onDone={handleDone} />}
            {page === 'preview' && <PreviewPage previewDate={previewDate} />}
            {page === 'news' && <NewsPage />}
            {page === 'config' && <ConfigPage />}
            {page === 'fund' && <FundTab />}
            {page === 'notes' && <NotesPage />}
            {page === 'tts' && <TTSPage />}
            {page === 'debate' && <DebatePage />}
            {page === 'dailyreport' && (
              <ErrorBoundary>
                <DailyReportPage />
              </ErrorBoundary>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
