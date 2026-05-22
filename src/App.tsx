import { useState, useEffect } from 'react';
import { Layout, Menu, Typography } from '@arco-design/web-react';
import {
  IconDashboard,
  IconPlayArrow,
  IconEye,
  IconList,
  IconSettings,
} from '@arco-design/web-react/icon';
import DashboardPage from './pages/DashboardPage';
import { TickPage } from './pages/TickPage';
import { AllSectorsPage } from './pages/AllSectorsPage';
import { GeneratePage } from './pages/GeneratePage';
import { PreviewPage } from './pages/PreviewPage';
import { MarketPage } from './pages/MarketPage';
import { ConfigPage } from './pages/ConfigPage';
import { api } from './api';

const { Sider, Content } = Layout;
const { Title } = Typography;

type Page = 'dashboard' | 'tick' | 'all-sectors' | 'generate' | 'preview' | 'market' | 'config';

const navItems: { key: Page; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: '仪表盘', icon: <IconDashboard /> },
  { key: 'tick', label: 'Tick 采集', icon: <IconList /> },
  { key: 'all-sectors', label: '全量板块', icon: <IconList /> },
  { key: 'generate', label: '视频生成', icon: <IconPlayArrow /> },
  { key: 'preview', label: '视频预览', icon: <IconEye /> },
  { key: 'market', label: '实时行情', icon: <IconList /> },
  { key: 'config', label: 'AI 配置', icon: <IconSettings /> },
];

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    api.getDates().then(d => {
      setDates(d.dates?.map(x => x.date) || []);
    }).catch(() => void 0);
  }, []);

  const handleDone = () => setPage('preview');

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
          {page === 'dashboard' && <DashboardPage />}
          <div style={{ display: page === 'tick' ? 'block' : 'none' }}>
            <TickPage />
          </div>
          {page === 'all-sectors' && <AllSectorsPage />}
          {page === 'generate' && <GeneratePage dates={dates} onDone={handleDone} />}
          {page === 'preview' && <PreviewPage />}
          {page === 'market' && <MarketPage />}
          {page === 'config' && <ConfigPage />}
        </Content>
      </Layout>
    </Layout>
  );
}
