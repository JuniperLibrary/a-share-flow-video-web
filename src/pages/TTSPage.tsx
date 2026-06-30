import { useState, useRef } from 'react';
import { Button, Message } from '@arco-design/web-react';
import { Download, Loader2, Mic, RefreshCw, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui/page-header';
import { api } from '../api';
import { cn } from '../lib/utils';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TTSPage() {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [durationSec, setDurationSec] = useState(0);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const topicRef = useRef<HTMLInputElement>(null);

  const handleGenerateScript = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      Message.warning('请输入主题');
      return;
    }
    setScriptLoading(true);
    setScript('');
    setGenerated(false);
    setAudioUrl('');
    try {
      const res = await api.generateScript(trimmed);
      setScript(res.script);
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      Message.error(`口播稿生成失败：${message}`);
    } finally {
      setScriptLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    const trimmed = script.trim();
    if (!trimmed) {
      Message.warning('口播稿内容为空');
      return;
    }
    setAudioLoading(true);
    try {
      const res = await api.synthesizeTTS(trimmed);
      setAudioUrl(api.ttsFileUrl(res.file));
      setFileName(res.file);
      setDurationSec(res.durationSec);
      setGenerated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      Message.error(`配音生成失败：${message}`);
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <PageHeader
          title="TTS 配音"
          meta="输入主题，AI 自动生成解说口播稿并转为语音"
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-hairline bg-surface-glass-low backdrop-blur-xl">
              <div className="px-5 py-3 border-b border-hairline">
                <span className="text-sm font-medium text-ink">口播主题</span>
              </div>
              <div className="p-5 space-y-3">
                <input
                  ref={topicRef}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="输入主题，如：黄金为什么暴跌"
                  className="w-full bg-glass border-glass border border-hairline rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-primary/50 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateScript()}
                />
                <Button
                  type="primary"
                  long
                  disabled={!topic.trim() || scriptLoading}
                  loading={scriptLoading}
                  onClick={handleGenerateScript}
                  icon={scriptLoading ? undefined : <Sparkles size={16} />}
                >
                  AI 生成口播稿
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-hairline bg-surface-glass-low backdrop-blur-xl p-5">
              <h3 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">主题示例</h3>
              <div className="space-y-1.5 text-sm text-ink-3">
                <div className="px-2.5 py-1.5 rounded-md bg-glass-sm border-glass cursor-pointer hover:bg-glass border-glass transition-all" onClick={() => setTopic('黄金为什么暴跌')}>
                  黄金为什么暴跌
                </div>
                <div className="px-2.5 py-1.5 rounded-md bg-glass-sm border-glass cursor-pointer hover:bg-glass border-glass transition-all" onClick={() => setTopic('半导体板块为何大涨')}>
                  半导体板块为何大涨
                </div>
                <div className="px-2.5 py-1.5 rounded-md bg-glass-sm border-glass cursor-pointer hover:bg-glass border-glass transition-all" onClick={() => setTopic('A股最近为什么调整')}>
                  A股最近为什么调整
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl border border-hairline bg-surface-glass-low backdrop-blur-xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-hairline">
                <span className="text-sm font-medium text-ink">口播稿</span>
                {script && <span className="text-xs text-ink-4">{[...script].length} 字</span>}
              </div>
              <div className="p-0">
                {scriptLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <p className="text-sm text-ink-3">AI 正在创作口播稿...</p>
                  </div>
                ) : script ? (
                  <textarea
                    value={script}
                    onChange={(e) => {
                      setScript(e.target.value);
                      setGenerated(false);
                      setAudioUrl('');
                    }}
                    className="w-full bg-transparent border-none outline-none resize-none text-sm text-ink leading-relaxed px-5 py-4 min-h-[300px]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 space-y-2">
                    <Sparkles size={20} className="text-ink-4" />
                    <p className="text-sm text-ink-4">在左侧输入主题，AI 将生成解说口播稿</p>
                  </div>
                )}
              </div>
              {script && (
                <div className="px-5 py-3 border-t border-hairline">
                  <Button
                    type="primary"
                    long
                    disabled={!script.trim() || audioLoading}
                    loading={audioLoading}
                    onClick={handleGenerateAudio}
                    icon={audioLoading ? undefined : <Mic size={16} />}
                  >
                    {audioLoading ? '生成配音中...' : generated ? '重新生成配音' : '生成配音'}
                  </Button>
                </div>
              )}
            </div>

            {generated && (
              <div className="rounded-xl border border-hairline bg-surface-glass-low backdrop-blur-xl p-5 space-y-4">
                <div className="flex items-center gap-3 text-sm text-ink-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-soft text-primary text-xs font-medium">
                    解说模式
                  </span>
                  <span>{formatDuration(durationSec)}</span>
                  <span>{[...script].length} 字</span>
                </div>
                <audio controls src={audioUrl} className="w-full" />
                <a
                  href={audioUrl}
                  download={fileName}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2',
                    'py-2.5 px-4 rounded-lg border border-hairline',
                    'text-sm font-medium text-ink-2',
                    'hover:border-hairline-active hover:text-ink transition-all',
                  )}
                >
                  <Download size={16} />
                  下载 MP3
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TTSPage;
