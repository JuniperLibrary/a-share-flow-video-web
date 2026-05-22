import { useState, useEffect } from 'react';
import { Input, Button, Select } from '@arco-design/web-react';
import { IconSend, IconCopy, IconCheck, IconCamera } from '@arco-design/web-react/icon';
import { api } from '../api';
import { DatePicker } from '../components/ui/date-picker';

interface SectorOption {
  code: string;
  name: string;
}

export function PreviewPage() {
  const [sectors, setSectors] = useState<SectorOption[]>([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [genDate, setGenDate] = useState('');
  const [dates, setDates] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getSectorsAllNames().then(r => {
      const names = (r.names || []).map((n, i) => ({ code: n, name: n }));
      setSectors(names);
      if (names.length > 0) setSelectedSector(names[0].code);
    }).catch(() => void 0);

    api.getSectorsAllDates().then(r => {
      const sorted = (r.dates || []).sort();
      setDates(sorted);
      if (sorted.length > 0) setGenDate(sorted[sorted.length - 1]);
    }).catch(() => void 0);
  }, []);

  async function handleGenerate() {
    if (!genDate) return;
    setLoading(true);
    setResult('');
    try {
      const res = await api.optimizeCopy(genDate, 'full');
      const data = res as { text?: string; error?: string };
      if (data.error) {
        setResult(`生成失败: ${data.error}`);
      } else {
        setResult(data.text || JSON.stringify(res));
      }
    } catch (e) {
      setResult(`生成失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => void 0);
  }

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative">
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">
            视频文案
          </h1>
          <span className="text-sm text-gray-500">AI 生成视频旁白与字幕</span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-6 shadow-2xl mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
              <IconSend style={{ color: '#fbbf24', fontSize: 16 }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">生成文案</h2>
              <p className="text-xs text-gray-500 mt-0.5">配置参数并生成 AI 视频旁白</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  板块
                </label>
                <Select
                  value={selectedSector}
                  onChange={setSelectedSector}
                  placeholder="选择板块"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', height: 42 }}
                >
                  {sectors.map(s => (
                    <Select.Option key={s.code} value={s.code}>
                      {s.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  日期
                </label>
                <DatePicker
                  value={genDate}
                  onChange={setGenDate}
                  placeholder="选择日期"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                <span className="w-1 h-1 rounded-full bg-white/30" />
                自定义提示词 <span className="text-gray-600">(可选)</span>
              </label>
              <Input.TextArea
                value={customPrompt}
                onChange={setCustomPrompt}
                placeholder="例如：用偏乐观的语气，强调政策利好..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                }}
              />
            </div>

            <Button
              type="primary"
              onClick={handleGenerate}
              loading={loading}
              icon={<IconSend />}
              style={{
                background: 'linear-gradient(135deg, #d97706, #e11d48)',
                border: 'none',
                height: 42,
                fontWeight: 600,
                paddingLeft: 28,
                paddingRight: 28,
                boxShadow: '0 0 24px rgba(225, 29, 72, 0.15)',
              }}
            >
              {loading ? '生成中...' : '生成文案'}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                <IconCamera style={{ color: '#a78bfa', fontSize: 16 }} />
              </div>
              <h2 className="text-base font-semibold text-white">生成结果</h2>
            </div>
            {result && (
              <Button
                size="mini"
                icon={copied ? <IconCheck /> : <IconCopy />}
                onClick={handleCopy}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: copied ? '#34d399' : '#9ca3af',
                  borderRadius: 6,
                }}
              >
                {copied ? '已复制' : '复制'}
              </Button>
            )}
          </div>

          {result ? (
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-5">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                <IconCamera style={{ color: '#4b5563', fontSize: 22 }} />
              </div>
              <p className="text-sm text-gray-600">选择板块和日期并点击生成</p>
              <p className="text-xs text-gray-700 mt-1">文案将展示在这里</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
