# A股板块资金流向视频生成器 - 前端

> React + Vite + Remotion + Tailwind CSS + shadcn/ui 前端应用，配合 Go 后端服务使用。

## 这是什么

这是 [a-share-flow-video-go](https://github.com/your-org/a-share-flow-video-go) 项目的前端部分，已分离为独立项目。提供：

- **Web 控制台**：数据拉取、视频生成、文案优化、实时行情监控
- **Remotion 视频渲染**：Bloomberg Terminal × TradingView × 科技电影 HUD 风格的资金流向视频
- **仪表盘**：聚合展示板块资金流向、趋势分析、事件时间线
- **Tick 采集控制**：实时采集板块资金流数据，支持历史回放

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
├── App.tsx               # 主应用（页面路由）
├── api.ts                # API 客户端（所有后端调用）
├── types.ts              # 共享类型定义
├── utils.ts              # 工具函数（含 apiUrl 辅助函数）
├── vite-env.d.ts         # Vite 环境变量类型
├── index.css             # 全局样式（Tailwind CSS）
├── components/           # shadcn/ui 组件
│   └── ui/               # Button, Card, Tabs, Dialog, etc.
├── hooks/
│   └── useSSE.ts         # SSE 流式读取 Hook
├── pages/                # Web 页面组件
│   ├── DashboardPage.tsx # 仪表盘（聚合数据展示）
│   ├── AllSectorsPage.tsx# 全量板块获取与展示
│   ├── GeneratePage.tsx  # 视频生成控制台
│   ├── PreviewPage.tsx   # 视频预览
│   ├── MarketPage.tsx    # 实时行情（SSE 推送）
│   ├── ConfigPage.tsx    # AI 配置
│   └── TickPage.tsx      # Tick 采集控制 + 回放
└── renderer/             # Remotion 视频组件
    ├── index.ts          # Remotion 入口
    ├── Root.tsx          # 根组件注册
    ├── BloombergVideo.tsx        # 主视频（移动端 1080×1920）
    ├── BloombergVideoTick.tsx    # Tick 视频
    ├── MultiDayVideo.tsx         # 多日视频
    ├── types.ts                  # RenderProps 类型
    └── ...               # 20+ 子组件
```

## API 契约

前端通过以下端点与 Go 后端通信：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/dates` | GET | 获取所有有数据的日期 |
| `/api/data/:date` | GET | 获取指定日期数据 |
| `/api/generate` | POST | SSE 流式生成视频 |
| `/api/generate-multiday` | POST | 多日视频生成（Bar Chart Race） |
| `/api/config` | GET/POST | AI 配置读写 |
| `/api/optimize-copy` | POST | AI 文案优化 |
| `/api/files/:date` | GET | 文件列表 |
| `/api/export-all/:date` | GET | 全量板块导出 |
| `/api/export-all/status/:task_id` | GET | 导出任务状态 |
| `/api/export-all/file/:task_id` | GET | 下载导出文件 |
| `/api/tick/stream` | GET | SSE 实时行情流 |
| `/api/tick/status` | GET | Tick 采集状态 |
| `/api/tick/start` | POST | 启动 Tick 采集 |
| `/api/tick/stop` | POST | 停止 Tick 采集 |
| `/api/tick/enable` | POST | 启用/禁用定时采集 |
| `/api/tick/interval` | GET/POST | 采集频率 |
| `/api/tick/dates` | GET | 获取所有有 Tick 数据的日期 |
| `/api/tick/replay-stream` | GET | SSE 回放历史 Tick 数据 |
| `/api/tick/events/:date` | GET | Tick 事件分析数据 |
| `/api/tick-data/:date` | GET | Tick 历史数据 |
| `/api/dashboard` | GET | 仪表盘聚合数据 |
| `/api/sectors-all/save/:date` | POST | 获取全量板块并保存 |
| `/api/sectors-all/status/:task_id` | GET | 全量板块任务状态 |
| `/api/sectors-all/dates` | GET | 全量板块数据日期 |
| `/api/sectors-all/trend` | GET | 板块资金流向趋势 |
| `/api/sectors-all/range` | GET | 指定日期范围板块数据 |
| `/api/sectors-all/names` | GET | 所有板块名称列表 |
| `/output/:date/:file` | GET | 视频文件下载 |

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| Vite | 构建工具 |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式系统 |
| shadcn/ui | UI 组件库 |
| Remotion | 视频渲染 |
| React Router | 页面路由 |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | Go 后端 API 地址 | `http://localhost:8084` |

## 部署

### 开发模式

```bash
npm run dev
```

前端直接请求后端 API，后端通过 CORS 中间件允许跨域访问。

### 生产部署

将 `dist/` 部署到 Nginx/Caddy 等静态文件服务器，设置 `VITE_API_BASE_URL` 为后端地址：

```env
VITE_API_BASE_URL=https://your-backend-host.com
```

后端需在 `.env` 中配置 CORS：

```env
CORS_ALLOWED_ORIGINS=https://your-frontend-host.com
```

## License

MIT
