import { useState, useEffect } from 'react';
import { Input, Button, Tag } from '@arco-design/web-react';
import { IconSave, IconLock, IconSettings, IconTool, IconLink } from '@arco-design/web-react/icon';
import { api } from '../api';
import { PageHeader } from '../components/ui/page-header';

export function ConfigPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiBase, setApiBase] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-4o-mini');
  const [hasKey, setHasKey] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    try {
      const cfg = await api.getConfig();
      setHasKey(cfg.has_api_key);
      setApiBase(cfg.api_base);
      setModel(cfg.model);
      setApiKey(cfg.has_api_key ? '••••••' : '');
    } catch { void 0; }
  }

  async function handleSave() {
    try {
      const key = apiKey === '••••••' ? '' : apiKey;
      await api.saveConfig(key, apiBase, model);
      setStatusType('success');
      setStatus('配置已保存');
      loadConfig();
    } catch (e: unknown) {
      setStatusType('error');
      setStatus(`保存失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const inputBaseClasses = 'text-ink text-sm transition-all duration-200';

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] bg-dashboard-grid bg-grid-lg" />

      <div className="relative mx-auto max-w-[640px] space-y-4">
        <PageHeader
          title="AI 配置"
          meta={<span className="text-sm text-ink-3">大模型 API 连接设置</span>}
        />

        <div className="rounded-2xl border border-hairline bg-black/30 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
              <IconLock className="text-primary" style={{ fontSize: 16 }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">API 配置</h2>
              <p className="text-xs text-ink-3 mt-0.5">设置 AI 分析引擎的访问凭证</p>
            </div>
            {hasKey && (
              <Tag color="green" className="!ml-auto !rounded !text-[11px]">
                已配置
              </Tag>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex flex-col gap-1 mb-2">
                <span className="flex items-center gap-1.5 text-xs text-ink-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  API Key
                </span>
                <span className="text-[11px] text-ink-3 ml-[10px]">你的 OpenAI 兼容 API 密钥</span>
              </label>
              <Input.Password
                value={apiKey}
                onChange={setApiKey}
                placeholder={hasKey ? '已设置' : 'sk-...'}
                className={inputBaseClasses}
                prefix={<IconLock className="text-primary" style={{ fontSize: 14 }} />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex flex-col gap-1 mb-2">
                  <span className="flex items-center gap-1.5 text-xs text-ink-2">
                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                    <IconLink style={{ fontSize: 12 }} />
                    接口地址
                  </span>
                  <span className="text-[11px] text-ink-3 ml-[10px]">API 服务地址</span>
                </label>
                <Input
                  value={apiBase}
                  onChange={setApiBase}
                  className={inputBaseClasses}
                  prefix={<IconSettings style={{ color: '#848e9c', fontSize: 14 }} />}
                />
              </div>
              <div>
                <label className="flex flex-col gap-1 mb-2">
                  <span className="flex items-center gap-1.5 text-xs text-ink-2">
                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                    <IconTool style={{ fontSize: 12 }} />
                    模型
                  </span>
                  <span className="text-[11px] text-ink-3 ml-[10px]">使用的模型名称</span>
                </label>
                <Input
                  value={model}
                  onChange={setModel}
                  className={inputBaseClasses}
                  prefix={<IconTool style={{ color: '#848e9c', fontSize: 14 }} />}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button
                type="primary"
                onClick={handleSave}
                icon={<IconSave />}
                className="!bg-primary !border-primary !text-primary-ink !h-10 !font-semibold !px-6 shadow-glow-primary hover:!brightness-110"
              >
                保存配置
              </Button>
              {status && (
                <span className={`text-sm ${statusType === 'error' ? 'text-inflow' : 'text-outflow'}`}>
                  {statusType === 'success' ? '✓' : '✕'} {status}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-black/30 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
              <IconSettings className="text-ink-3" style={{ fontSize: 16 }} />
            </div>
            <h2 className="text-base font-semibold text-ink">当前设置</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-hairline bg-white/[0.02] p-4">
              <p className="text-xs text-ink-3 mb-1">AI 状态</p>
              <Tag color={hasKey ? 'green' : 'red'} className="!rounded !text-xs">
                {hasKey ? '已配置' : '未配置'}
              </Tag>
            </div>
            <div className="rounded-lg border border-hairline bg-white/[0.02] p-4">
              <p className="text-xs text-ink-3 mb-1">模型</p>
              <p className="text-sm font-mono text-ink">{model}</p>
            </div>
            <div className="rounded-lg border border-hairline bg-white/[0.02] p-4 sm:col-span-2">
              <p className="text-xs text-ink-3 mb-1">接口地址</p>
              <p className="text-sm font-mono text-ink truncate">{apiBase}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
