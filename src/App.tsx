import { useState, useEffect, Suspense } from 'react';
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
import DashboardPage from './pages/DashboardPage';
import { TickPage } from './pages/TickPage';
import { GeneratePage } from './pages/GeneratePage';
import { PreviewPage } from './pages/PreviewPage';
import { ConfigPage } from './pages/ConfigPage';
import { NewsPage } from './pages/NewsPage';
import { NotesPage } from './pages/NotesPage';
import FundTab from './fund/FundTab';
import { TTSPage } from './pages/TTSPage';
import { DebatePage } from './pages/DebatePage';
import { DailyReportPage } from './pages/DailyReportPage';
import { api } from './api';
import { Sidebar } from './components/ui/sidebar';

type Page = 'dashboard' | 'tick' | 'generate' | 'preview' | 'config' | 'news' | 'fund' | 'notes' | 'tts' | 'debate' | 'dailyreport';

const allNavItems: { key: Page; label: string; icon: React.ReactNode; staticOnly?: boolean }[] = [
  { key: 'dashboard', label: '仪表盘', icon: <IconDashboard /> },
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
    <div className="flex min-h-screen bg-canvas">
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
            {page === 'dashboard' && <DashboardPage />}
            {page === 'tick' && <TickPage />}
            {page === 'generate' && <GeneratePage dates={dates} onDone={handleDone} />}
            {page === 'preview' && <PreviewPage previewDate={previewDate} />}
            {page === 'news' && <NewsPage />}
            {page === 'config' && <ConfigPage />}
            {page === 'fund' && <FundTab />}
            {page === 'notes' && <NotesPage />}
            {page === 'tts' && <TTSPage />}
            {page === 'debate' && <DebatePage />}
            {page === 'dailyreport' && <DailyReportPage />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
