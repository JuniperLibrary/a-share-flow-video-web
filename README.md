# A股板块资金流向视频生成器 - 前端

> React + Vite + TypeScript + Tailwind CSS + @arco-design/web-react 前端控制台，配合 Go 后端服务使用。

## 这是什么

这是 [a-share-flow-video-go](https://github.com/your-org/a-share-flow-video-go) 项目的前端部分，已分离为独立项目。提供：

- **控制台**：数据拉取、视频生成、文案优化、实时行情监控、新闻检索
- **仪表盘**：聚合展示板块资金流向、市场概览、趋势分析、事件时间线
- **Tick 采集控制**：实时采集板块资金流数据，支持历史回放
- **实时行情**：SSE 流式推送板块资金曲线 + AI 异动事件检测
- **新闻资讯**：财联社电报实时展示，按板块标签筛选，全文弹窗阅读
- **基金宝**：基金持仓管理工具，支持多账户/多分组、自定义标签、盈亏统计、交易记录、持仓日历、定投计算、扫描导入、云端同步

## 快速开始

### 前置条件

- **Node.js 18+**
- **npm 9+**
- **Go 后端服务**（a-share-flow-video-go）运行在 `http://localhost:8084`

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 设置后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:8084
```

### 3. 开发模式

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`。前端直接请求后端 API，后端通过 CORS 中间件允许跨域访问。

### 4. 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可部署到任意静态文件服务器。

### 5. 类型检查

```bash
npm run typecheck
```

## 项目结构

```
src/
├── main.tsx              # React 入口
├── App.tsx               # 主应用（状态路由 + 侧边栏导航）
├── api.ts                # API 客户端（所有后端调用）
├── types.ts              # 共享类型定义
├── utils.ts              # 工具函数（含 apiUrl 辅助函数）
├── index.css             # 全局样式（Tailwind CSS + 暗色主题）
├── components/
│   └── ui/               # 自定义 UI 组件（DatePicker, Select 等暗色玻璃风格）
    ├── fund/                 # 基金宝功能（从 real-time-fund 移植）
    │   ├── FundTab.jsx       # 基金宝应用入口（QueryClientProvider + Toaster）
    │   ├── FundPage.jsx      # 主页面（路由状态控制）
    │   ├── fund.css          # 基金宝样式（4400+ 行，Tailwind v3 兼容）
    │   ├── stores/           # Zustand 状态管理（index, modal, storage, user）
    │   ├── lib/              # 工具库（supabase 客户端, Next.js 兼容垫片, 交易日历等）
    │   ├── api/fund.js       # 基金数据 API 客户端（1920 行）
    │   ├── hooks/            # 自定义 Hooks（移动端检测, 同步管理, 主题, 交易日历等）
    │   └── components/       # 70+ 组件（卡片, 表格, 图表, 模态框, 设置面板等）
    │       └── ui/           # 21 个 shadcn/ui 基础组件（dialog, drawer, select, tabs 等）
    ├── pages/                # Web 页面组件
│   ├── DashboardPage.tsx # 仪表盘（市场概览 + 板块排行 + 趋势图）
│   ├── AllSectorsPage.tsx# 全量板块获取与展示
│   ├── GeneratePage.tsx  # 视频生成控制台
│   ├── PreviewPage.tsx   # 视频预览
│   ├── MarketPage.tsx    # 实时行情（SSE 推送 + SVG 资金曲线图）
│   ├── NewsPage.tsx      # 财联社新闻（轮询状态、搜索、全文弹窗）
│   ├── ConfigPage.tsx    # AI 配置
│   └── TickPage.tsx      # Tick 采集控制 + 历史回放
└── renderer/             # Remotion 视频渲染组件
    ├── index.ts          # Remotion 入口
    ├── Root.tsx          # 根组件注册
    ├── BloombergVideo.tsx        # 主视频（移动端 1080×1920）
    ├── BloombergVideoTick.tsx    # Tick 曲线视频
    ├── MultiDayVideo.tsx         # 多日 Bar Chart Race 视频
    ├── types.ts                  # RenderProps 类型（需与 Go 侧同步）
    └── ...               # 20+ 子组件（Header, Chart, Timeline, ...
```

## API 契约

前端通过以下端点与 Go 后端通信：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/dates` | GET | 获取所有有数据的日期 |
| `/api/data/:date` | GET | 获取指定日期数据 |
| `/api/generate` | POST | SSE 流式生成视频 |
| `/api/generate-multiday` | POST | 多日视频生成 |
| `/api/generate-tick` | POST | Tick 曲线视频生成 |
| `/api/config` | GET/POST | AI 配置读写 |
| `/api/optimize-copy` | POST | AI 文案优化 |
| `/api/files/:date` | GET | 文件列表 |
| `/api/export-all/:date` | GET | 全量板块导出 |
| `/api/export-hot-sectors/:date` | GET | Top21 热门板块 |
| `/api/tick/stream` | GET | SSE 实时行情流 |
| `/api/tick/status` | GET | Tick 采集状态 |
| `/api/tick/start` | POST | 启动 Tick 采集 |
| `/api/tick/stop` | POST | 停止 Tick 采集 |
| `/api/tick/enable` | POST | 启用/禁用定时采集 |
| `/api/tick/interval` | GET/POST | 采集频率 |
| `/api/tick/dates` | GET | 获取所有 Tick 日期 |
| `/api/tick/replay-stream` | GET | SSE 回放历史 Tick |
| `/api/tick/events/:date` | GET | Tick 事件分析 |
| `/api/tick-data/:date` | GET | Tick 历史数据 |
| `/api/dashboard` | GET | 仪表盘聚合数据 |
| `/api/sectors-all/save/:date` | POST | 获取全量板块并保存 |
| `/api/sectors-all/status/:task_id` | GET | 全量板块任务状态 |
| `/api/sectors-all/dates` | GET | 全量板块数据日期 |
| `/api/sectors-all/range` | GET | 日期范围板块数据 |
| `/api/sectors-all/names` | GET | 板块名称列表 |
| `/api/news` | GET | 新闻列表（分页） |
| `/api/news/search` | GET | 搜索新闻 |
| `/api/news/status` | GET | 新闻轮询状态 |
| `/api/news/start` | POST | 启动新闻轮询 |
| `/api/news/stop` | POST | 停止新闻轮询 |
| `/output/:date/:file` | GET | 视频文件下载 |

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| Vite | 构建工具 |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式系统 |
| @arco-design/web-react | UI 组件库（Layout, Menu, Button, Input, Pagination 等） |
| lucide-react | 图标库 |
| Remotion | 视频渲染（React 组件生成 MP4） |
| **zustand** | 基金宝状态管理 |
| **@tanstack/react-query** | 基金宝数据请求与缓存 |
| **framer-motion** | 基金宝交互动画 |
| **chart.js / react-chartjs-2** | 基金宝趋势图表 |
| **shadcn/ui radix-ui** | 基金宝基础 UI 组件 |
| **Supabase** | 基金宝云端同步（可选，无 key 时本地运行） |

## 页面导航

应用使用**状态路由**（非 react-router），通过 `useState<Page>` 切换页面：

| 页面 | 功能 |
|------|------|
| 仪表盘 | 市场概览、板块排行、趋势图、事件时间线 |
| Tick 采集 | 启动/停止实时采集、查看采集数据 |
| 全量板块 | 异步获取并浏览全量板块资金数据 |
| 视频生成 | 单日 Tick 视频 + 多日 Bar Chart Race 视频 |
| 视频预览 | 浏览生成的视频文件 |
| 实时行情 | SSE 资金曲线图表 + 市场事件列表 |
| 新闻资讯 | 财联社电报轮询控制、搜索、全文弹窗 |
| AI 配置 | API Key / Base URL / Model 配置 |
| 基金宝 | 基金持仓管理（多分组、交易记录、盈亏图表、扫描导入、云端同步 + Supabase 可选） |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | Go 后端 API 地址 | `http://localhost:8084`（空字符串=同源） |

## 部署

### 开发模式

```bash
npm run dev
```

前端直接请求后端 API，后端通过 CORS 中间件允许跨域访问。

### GitHub Pages 部署（静态模式）

前端已内置 **静态数据模式**：当后端 API 不可达时，自动从 `data/*.json` 文件读取数据。

```bash
# 构建生产版本
npm run build

# 将 JSON 数据文件复制到构建输出
mkdir -p dist/data
cp ../a-share-flow-video-go/data/*.json dist/data/

# 部署 dist/ 到 GitHub Pages
```

**自动部署流程**（通过 GitHub Actions）：
1. [Go 后端仓库](https://github.com/JuniperLibrary/a-share-flow-video-go) 定时采集数据 → 导出 JSON → 提交到仓库
2. 通过 `repository_dispatch` 触发前端仓库部署
3. 前端构建时自动拉取最新 JSON 数据 → 部署到 Pages

> 详细部署步骤见后端仓库的 [DEPLOY.md](https://github.com/JuniperLibrary/a-share-flow-video-go/blob/main/DEPLOY.md)

### 传统生产部署（有后端 API）

将 `dist/` 部署到 Nginx/Caddy 等静态文件服务器，设置 `VITE_API_BASE_URL` 为后端地址：

```env
VITE_API_BASE_URL=https://your-backend-host.com
```

后端需在 `.env` 中配置 CORS：

```env
CORS_ALLOWED_ORIGINS=https://your-frontend-host.com
```

## 静态数据说明

在 GitHub Pages 模式下（无后端 API），以下页面正常工作：

| 页面 | 状态 | 数据来源 |
|------|------|----------|
| 仪表盘 | ✅ 完整 | `data/sectors.json` |
| 全量板块 | ✅ 完整 | `data/sectors_all.json` |
| 新闻资讯 | ✅ 完整（仅展示，不支持轮询控制） | `data/cls_news.json` |
| Tick 采集 | ❌ 需后端 | — |
| 视频生成 | ❌ 需后端 | — |
| 视频预览 | ❌ 需后端 | — |
| 实时行情 | ❌ 需后端 | — |
| AI 配置 | ❌ 需后端 | — |
| 基金宝 | ✅ 完整（本地存储，无需后端） | 浏览器 localStorage + 本地 IndexedDB |

## License

MIT
