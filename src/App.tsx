import { useState, useEffect } from 'react';
import { Layout, Menu, Typography } from '@arco-design/web-react';
import {
  IconDashboard,
  IconPlayArrow,
  IconEye,
  IconList,
  IconSettings,
  IconFile,
} from '@arco-design/web-react/icon';
import DashboardPage from './pages/DashboardPage';
import { TickPage } from './pages/TickPage';
import { AllSectorsPage } from './pages/AllSectorsPage';
import { GeneratePage } from './pages/GeneratePage';
import { PreviewPage } from './pages/PreviewPage';
import { MarketPage } from './pages/MarketPage';
import { ConfigPage } from './pages/ConfigPage';
import { NewsPage } from './pages/NewsPage';
import { api } from './api';

const { Sider, Content } = Layout;
const { Title } = Typography;

type Page = 'dashboard' | 'tick' | 'all-sectors' | 'generate' | 'preview' | 'market' | 'config' | 'news';

const allNavItems: { key: Page; label: string; icon: React.ReactNode; staticOnly?: boolean }[] = [
  { key: 'dashboard', label: '仪表盘', icon: <IconDashboard /> },
  { key: 'tick', label: 'Tick 采集', icon: <IconList />, staticOnly: true },
  { key: 'all-sectors', label: '全量板块', icon: <IconList /> },
  { key: 'generate', label: '视频生成', icon: <IconPlayArrow />, staticOnly: true },
  { key: 'preview', label: '视频预览', icon: <IconEye />, staticOnly: true },
  { key: 'market', label: '实时行情', icon: <IconList />, staticOnly: true },
  { key: 'news', label: '新闻资讯', icon: <IconFile /> },
  { key: 'config', label: 'AI 配置', icon: <IconSettings />, staticOnly: true },
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
    <Layout style={{ minHeight: '100vh', background: '#0a1628' }}>
      <Sider
        width={220}
        style={{
          background: '#0d1f3c',
          borderRight: '1px solid #1a3a5c',
          boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1a3a5c' }}>
          <Title heading={5} style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
            📊 A股情绪流
          </Title>
          <div style={{ fontSize: 12, color: '#86909c', marginTop: 4 }}>
            板块资金流向可视化
          </div>
        </div>
        <Menu
          mode="vertical"
          selectedKeys={[page]}
          onClickMenuItem={(key) => setPage(key as Page)}
          style={{ border: 'none', marginTop: 8, background: 'transparent' }}
        >
          {navItems.map((item) => (
            <Menu.Item key={item.key} style={{ fontSize: 14, color: '#86909c' }}>
              {item.icon}
              <span style={{ marginLeft: 8 }}>{item.label}</span>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout>
        <Content style={{ padding: 24, overflow: 'auto', background: '#0a1628' }}>
          <div style={{ display: page === 'dashboard' ? 'block' : 'none' }}>
            <DashboardPage />
          </div>
          <div style={{ display: page === 'tick' ? 'block' : 'none' }}>
            <TickPage />
          </div>
          <div style={{ display: page === 'all-sectors' ? 'block' : 'none' }}>
            <AllSectorsPage />
          </div>
          <div style={{ display: page === 'generate' ? 'block' : 'none' }}>
            <GeneratePage dates={dates} onDone={handleDone} />
          </div>
          <div style={{ display: page === 'preview' ? 'block' : 'none' }}>
            <PreviewPage previewDate={previewDate} />
          </div>
          <div style={{ display: page === 'market' ? 'block' : 'none' }}>
            <MarketPage />
          </div>
          <div style={{ display: page === 'news' ? 'block' : 'none' }}>
            <NewsPage />
          </div>
          <div style={{ display: page === 'config' ? 'block' : 'none' }}>
            <ConfigPage />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
