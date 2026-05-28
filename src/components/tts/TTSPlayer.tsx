import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Slider, Select, Message, Tag } from '@arco-design/web-react';
import {
  IconPlayArrow,
  IconPause,
  IconStop,
  IconRefresh,
  IconSettings,
  IconVoice,
} from '@arco-design/web-react/icon';

interface Voice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface TTSPlayerProps {
  text: string;
  className?: string;
}

type PlaybackState = 'idle' | 'playing' | 'paused';

const VOICE_PRESETS = [
  { id: 'zh-female', label: '中文女声', lang: 'zh', icon: '👩', color: 'from-pink-500 to-rose-500' },
  { id: 'zh-male', label: '中文男声', lang: 'zh', icon: '👨', color: 'from-blue-500 to-indigo-500' },
  { id: 'en-female', label: '英文女声', lang: 'en', icon: '👩‍🦰', color: 'from-purple-500 to-pink-500' },
  { id: 'en-male', label: '英文男声', lang: 'en', icon: '👨‍🦱', color: 'from-cyan-500 to-blue-500' },
];

export function TTSPlayer({ text, className = '' }: TTSPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animationFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const voiceList: Voice[] = availableVoices.map(v => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        default: v.default,
      }));
      setVoices(voiceList);

      const chineseVoice = voiceList.find(v => v.lang.startsWith('zh'));
      if (chineseVoice) {
        setSelectedVoice(chineseVoice.name);
      } else if (voiceList.length > 0) {
        setSelectedVoice(voiceList[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const matchedVoices = useMemo(() => {
    const chineseVoices = voices.filter(v => v.lang.startsWith('zh'));
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const otherVoices = voices.filter(v => !v.lang.startsWith('zh') && !v.lang.startsWith('en'));

    return {
      zh: chineseVoices,
      en: englishVoices,
      other: otherVoices,
    };
  }, [voices]);

  const currentVoiceInfo = useMemo(() => {
    const voice = voices.find(v => v.name === selectedVoice);
    if (!voice) return null;

    const isZh = voice.lang.startsWith('zh');
    const isEn = voice.lang.startsWith('en');
    const gender = voice.name.toLowerCase().includes('female') || voice.name.includes('女') ? 'female' : 'male';

    return {
      ...voice,
      isZh,
      isEn,
      gender,
      label: isZh ? (gender === 'female' ? '中文女声' : '中文男声') : (isEn ? (gender === 'female' ? '英文女声' : '英文男声') : voice.name),
    };
  }, [voices, selectedVoice]);

  const drawVisualization = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = 32;
      const barWidth = canvas.width / bars - 2;

      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * canvas.height * 0.6 + 10;
        const x = i * (barWidth + 2);

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      }
    };

    draw();
  }, []);

  const handlePreviewVoice = useCallback((voiceName: string) => {
    window.speechSynthesis.cancel();

    const previewText = voices.find(v => v.name === voiceName)?.lang.startsWith('zh')
      ? '这是一段语音预览，您可以听听这个音色的效果。'
      : 'This is a voice preview. You can hear how this voice sounds.';

    const utterance = new SpeechSynthesisUtterance(previewText);
    const voice = window.speechSynthesis.getVoices().find(v => v.name === voiceName);

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setPreviewingVoice(voiceName);
    };

    utterance.onend = () => {
      setPreviewingVoice(null);
    };

    utterance.onerror = () => {
      setPreviewingVoice(null);
      Message.error('预览失败');
    };

    window.speechSynthesis.speak(utterance);
  }, [voices, rate, pitch, volume]);

  const handlePlay = useCallback(() => {
    if (!text.trim()) {
      Message.warning('请输入要朗读的文本');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) {
      const synthVoice = window.speechSynthesis.getVoices().find(v => v.name === voice.name);
      if (synthVoice) {
        utterance.voice = synthVoice;
      }
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setPlaybackState('playing');
      startTimeRef.current = Date.now();
      drawVisualization();
    };

    utterance.onend = () => {
      setPlaybackState('idle');
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setPlaybackState('idle');
      Message.error('语音合成失败');
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);
      }
    };

    const estimatedDuration = text.length * 0.2 / rate;
    setDuration(estimatedDuration);

    window.speechSynthesis.speak(utterance);
  }, [text, voices, selectedVoice, rate, pitch, volume, drawVisualization]);

  const handlePause = useCallback(() => {
    if (playbackState === 'playing') {
      window.speechSynthesis.pause();
      setPlaybackState('paused');
      pausedTimeRef.current = Date.now() - startTimeRef.current;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [playbackState]);

  const handleResume = useCallback(() => {
    if (playbackState === 'paused') {
      window.speechSynthesis.resume();
      setPlaybackState('playing');
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      drawVisualization();
    }
  }, [playbackState, drawVisualization]);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlaybackState('idle');
    setCurrentTime(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isSupported) {
    return (
      <div className={`rounded-2xl border border-red-500/20 bg-black/30 backdrop-blur-xl p-5 ${className}`}>
        <div className="text-center text-red-400">
          <span className="text-4xl mb-2 block">🔊</span>
          <p>您的浏览器不支持语音合成</p>
          <p className="text-sm text-gray-500 mt-1">请使用 Chrome 或 Edge 浏览器</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-purple-500/20 bg-black/30 backdrop-blur-xl p-4 shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm">🔊</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">TTS 配音</h3>
            <p className="text-[10px] text-gray-500">文本转语音</p>
          </div>
        </div>
        <Button
          type="text"
          size="small"
          icon={<IconSettings />}
          onClick={() => setShowSettings(!showSettings)}
          className={`text-gray-400 hover:text-white ${showSettings ? 'text-purple-400' : ''}`}
        />
      </div>

      {currentVoiceInfo && (
        <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{currentVoiceInfo.gender === 'female' ? '👩' : '👨'}</span>
              <div>
                <div className="text-xs font-medium text-white/90">{currentVoiceInfo.label}</div>
                <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{currentVoiceInfo.name}</div>
              </div>
            </div>
            <Button
              type="text"
              size="small"
              icon={<IconVoice />}
              onClick={() => handlePreviewVoice(selectedVoice)}
              loading={previewingVoice === selectedVoice}
              className="text-purple-400 hover:text-purple-300 text-xs"
            >
              试听
            </Button>
          </div>
        </div>
      )}

      <div className="relative h-20 rounded-lg bg-black/50 mb-3 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={80}
          className="w-full h-full"
        />
        {playbackState === 'idle' && !previewingVoice && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-600 text-xs">等待播放...</div>
          </div>
        )}
        {previewingVoice && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-purple-400 text-xs animate-pulse">预览中...</div>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-3">
        <button
          onClick={handleStop}
          disabled={playbackState === 'idle'}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center disabled:opacity-50 transition-colors"
        >
          <IconStop className="text-sm" />
        </button>

        {playbackState === 'playing' ? (
          <button
            onClick={handlePause}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:opacity-90 transition-opacity"
          >
            <IconPause className="text-xl text-white" />
          </button>
        ) : (
          <button
            onClick={playbackState === 'paused' ? handleResume : handlePlay}
            disabled={!!previewingVoice}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <IconPlayArrow className="text-xl text-white" />
          </button>
        )}

        <button
          onClick={handlePlay}
          disabled={playbackState === 'playing' || !!previewingVoice}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center disabled:opacity-50 transition-colors"
        >
          <IconRefresh className="text-sm" />
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-[10px] text-gray-500 mb-1.5">选择音色</label>
        <div className="grid grid-cols-2 gap-1.5">
          {matchedVoices.zh.slice(0, 4).map((voice) => (
            <button
              key={voice.name}
              onClick={() => setSelectedVoice(voice.name)}
              className={`p-1.5 rounded-md border transition-all text-left ${
                selectedVoice === voice.name
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/10 bg-black/20 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">👩</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium text-white/90 truncate">{voice.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="text-[8px] text-gray-500">中文</div>
                </div>
              </div>
            </button>
          ))}
          {matchedVoices.en.slice(0, 2).map((voice) => (
            <button
              key={voice.name}
              onClick={() => setSelectedVoice(voice.name)}
              className={`p-1.5 rounded-md border transition-all text-left ${
                selectedVoice === voice.name
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/10 bg-black/20 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">👨</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium text-white/90 truncate">{voice.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="text-[8px] text-gray-500">English</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {voices.length > 6 && (
          <div className="mt-1.5">
            <Select
              value={selectedVoice}
              onChange={setSelectedVoice}
              size="small"
              style={{ width: '100%' }}
              placeholder="更多音色..."
              options={voices.map(v => ({
                label: `${v.name} (${v.lang})`,
                value: v.name,
              }))}
            />
          </div>
        )}
      </div>

      {showSettings && (
        <div className="space-y-2 p-2.5 rounded-lg bg-black/30 border border-white/5">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">
              语速: {rate.toFixed(1)}x
            </label>
            <Slider
              value={rate}
              onChange={(val) => setRate(Array.isArray(val) ? val[0] : val)}
              min={0.5}
              max={2}
              step={0.1}
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1">
              音调: {pitch.toFixed(1)}
            </label>
            <Slider
              value={pitch}
              onChange={(val) => setPitch(Array.isArray(val) ? val[0] : val)}
              min={0.5}
              max={2}
              step={0.1}
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1">
              音量: {Math.round(volume * 100)}%
            </label>
            <Slider
              value={volume}
              onChange={(val) => setVolume(Array.isArray(val) ? val[0] : val)}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
        </div>
      )}

      {text && (
        <div className="mt-3 p-2.5 rounded-lg bg-black/30 border border-white/5">
          <div className="text-[10px] text-gray-500 mb-1">文本预览</div>
          <div className="text-xs text-gray-400 line-clamp-2 max-h-12 overflow-y-auto">
            {text}
          </div>
          <div className="text-[10px] text-gray-600 mt-1">
            共 {text.length} 字
          </div>
        </div>
      )}
    </div>
  );
}

export default TTSPlayer;
