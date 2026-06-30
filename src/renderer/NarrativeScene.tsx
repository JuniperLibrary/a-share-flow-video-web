import React from 'react';
import { useCurrentFrame, Audio, staticFile, interpolate } from 'remotion';
import { Background } from './Background.tsx';

interface NarrativeSceneProps {
  sceneText: string;
  audioFile: string;
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  totalFrames: number;
  sceneType: 'hook1' | 'suspense' | 'twist' | 'answer' | 'hook2';
}

const SCENE_CONFIG = {
  hook1: {
    color: '#ff6b6b',
    subtitle: '今天有个反常现象',
    fontSize: { mobile: 64, tv: 50 },
  },
  suspense: {
    color: '#feca57',
    subtitle: '为什么会出现这种情况？',
    fontSize: { mobile: 48, tv: 38 },
  },
  twist: {
    color: '#48dbfb',
    subtitle: '更离谱的是...',
    fontSize: { mobile: 50, tv: 40 },
  },
  answer: {
    color: '#1dd1a1',
    subtitle: '真相是...',
    fontSize: { mobile: 46, tv: 36 },
  },
  hook2: {
    color: '#ff9ff3',
    subtitle: '明天会怎样？',
    fontSize: { mobile: 52, tv: 42 },
  },
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function normalizeSceneText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

function splitSceneText(text: string, maxLineLength: number): string[] {
  const cleaned = normalizeSceneText(text);
  if (!cleaned) return [];
  const parts = cleaned.split('\n').map(s => s.trim()).filter(Boolean);
  const merged = parts.join(' ');
  const runes = Array.from(merged);
  if (runes.length <= maxLineLength) return [merged];

  const targets = new Set(['，', '、', ' ', '；', '：', '。', '！', '？', ',', ';', ':', '!', '?']);
  const center = Math.min(maxLineLength, Math.max(10, Math.floor(runes.length / 2)));
  let best = -1;
  let bestDist = 1e9;
  const lo = Math.max(8, center - 10);
  const hi = Math.min(runes.length - 8, center + 12);
  for (let i = lo; i <= hi; i++) {
    if (!targets.has(runes[i])) continue;
    const dist = Math.abs(i - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  if (best < 0) best = center;

  const l1 = runes.slice(0, best + 1).join('').trim();
  let l2 = runes.slice(best + 1).join('').trim();
  if (Array.from(l2).length > maxLineLength) {
    l2 = Array.from(l2).slice(0, Math.max(0, maxLineLength-1)).join('') + '…';
  }
  return [l1, l2].filter(Boolean).slice(0, 2);
}

export const NarrativeScene: React.FC<NarrativeSceneProps> = ({
  sceneText,
  audioFile,
  displayDate,
  width,
  height,
  format,
  totalFrames,
  sceneType,
}) => {
  const frame = useCurrentFrame();
  const isTV = format === 'tv';
  const config = SCENE_CONFIG[sceneType];
  const lines = React.useMemo(() => {
    return splitSceneText(sceneText, isTV ? 18 : 14);
  }, [sceneText, isTV]);
  const charCount = React.useMemo(() => Array.from(normalizeSceneText(sceneText)).length, [sceneText]);

  const isFirstHook = sceneType === 'hook1';
  const fadeIn = isFirstHook ? 1 : Math.min(1, frame / 15);
  const fadeOut = Math.min(1, (totalFrames - frame) / 3);
  const opacity = fadeIn * fadeOut;
  const textSlide = isFirstHook ? 1 : Math.min(1, Math.max(0, (frame - 10) / 20));
  const subtitleOpacity = isFirstHook ? 1 : Math.min(1, Math.max(0, (frame - 20) / 15));
  const dateFadeIn = Math.min(1, Math.max(0, (frame - (isFirstHook ? 12 : 28)) / 10));
  const dateOpacity = dateFadeIn * fadeOut;
  const audioVolume = interpolate(frame, [0, 8, Math.max(0, totalFrames - 10), totalFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const baseFontSize = isTV ? config.fontSize.tv : config.fontSize.mobile;
  const fontScale = clamp(1 - Math.max(0, charCount - (isTV ? 22 : 18)) * 0.015, 0.82, 1);
  const fontSize = Math.floor(baseFontSize * fontScale);

  return (
    <>
      {audioFile && <Audio src={staticFile(audioFile)} volume={audioVolume} />}
      <Background frame={frame} totalFrames={totalFrames} sentiment="neutral" width={width} height={height} format={format} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          padding: '0 60px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: isTV ? 44 : 72,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: dateOpacity,
            transform: `translateY(${(1 - dateFadeIn) * -10}px)`,
          }}
        >
          <div
            style={{
              fontSize: isTV ? 24 : 32,
              fontWeight: 800,
              color: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              padding: isTV ? '10px 18px' : '12px 22px',
              borderRadius: 999,
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              letterSpacing: isTV ? 1.5 : 2,
              boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
            }}
          >
            {displayDate}
          </div>
        </div>
        <div
          style={{
            fontSize: isTV ? 24 : 30,
            color: config.color,
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: isTV ? 2.2 : 2.6,
            marginBottom: isTV ? 24 : 32,
            opacity: subtitleOpacity * fadeOut,
            fontWeight: 600,
          }}
        >
          {config.subtitle}
        </div>
        <div
          style={{
            fontSize,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            textAlign: 'center',
            lineHeight: 1.4,
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            opacity: opacity,
            transform: `translateY(${(1 - textSlide) * 30}px)`,
          }}
        >
          {lines.length > 0 ? lines.map((l, idx) => <div key={idx}>{l}</div>) : sceneText}
        </div>
      </div>
    </>
  );
};
