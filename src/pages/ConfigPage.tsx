import { useState, useEffect } from 'react';
import { Input, Button, Tag } from '@arco-design/web-react';
import { IconSave, IconLock, IconSettings, IconTool, IconLink } from '@arco-design/web-react/icon';
import { api } from '../api';

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

  // visual styles (bg, border, rounded, height, hover/focus) 由 index.css 中 .arco-input-inner-wrapper 覆盖控制
  const inputBaseClasses = 'text-white text-sm transition-all duration-200';

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto" style={{ maxWidth: 640 }}>
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            AI 配置
          </h1>
          <span className="text-sm text-gray-500">大模型 API 连接设置</span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-6 shadow-2xl mb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <IconLock style={{ color: '#22d3ee', fontSize: 16 }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">API 配置</h2>
              <p className="text-xs text-gray-500 mt-0.5">设置 AI 分析引擎的访问凭证</p>
            </div>
            {hasKey && (
              <Tag color="green" style={{ marginLeft: 'auto', borderRadius: 4, fontSize: 11 }}>
                已配置
              </Tag>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex flex-col gap-1 mb-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  API Key
                </span>
                <span className="text-[11px] text-gray-500 ml-[10px]">你的 OpenAI 兼容 API 密钥</span>
              </label>
              <Input.Password
                value={apiKey}
                onChange={setApiKey}
                placeholder={hasKey ? '已设置' : 'sk-...'}
                className={inputBaseClasses}
                prefix={<IconLock style={{ color: '#22d3ee', fontSize: 14 }} />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex flex-col gap-1 mb-2">
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50" />
                    <IconLink style={{ fontSize: 12 }} />
                    接口地址
                  </span>
                  <span className="text-[11px] text-gray-500 ml-[10px]">API 服务地址</span>
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
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50" />
                    <IconTool style={{ fontSize: 12 }} />
                    模型
                  </span>
                  <span className="text-[11px] text-gray-500 ml-[10px]">使用的模型名称</span>
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
                style={{
                  background: 'linear-gradient(135deg, #0891b2, #0d9488)',
                  border: 'none',
                  height: 38,
                  fontWeight: 600,
                  paddingLeft: 24,
                  paddingRight: 24,
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
                }}
              >
                保存配置
              </Button>
              {status && (
                <span className={`text-sm ${statusType === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {statusType === 'success' ? '✓' : '✕'} {status}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500/20 to-gray-400/5 flex items-center justify-center">
              <IconSettings style={{ color: '#86909c', fontSize: 16 }} />
            </div>
            <h2 className="text-base font-semibold text-white">当前设置</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
              <p className="text-xs text-gray-500 mb-1">AI 状态</p>
              <Tag color={hasKey ? 'green' : 'red'} style={{ borderRadius: 4, fontSize: 12 }}>
                {hasKey ? '已配置' : '未配置'}
              </Tag>
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
              <p className="text-xs text-gray-500 mb-1">模型</p>
              <p className="text-sm font-mono text-white">{model}</p>
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4 sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">接口地址</p>
              <p className="text-sm font-mono text-white truncate">{apiBase}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
