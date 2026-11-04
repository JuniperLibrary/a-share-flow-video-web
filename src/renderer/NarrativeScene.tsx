import React from 'react';
import { useCurrentFrame, Audio, staticFile, interpolate } from 'remotion';
import { Background } from './Background.tsx';
import { CINE_COLORS, CINE_EASE } from './cinema.ts';
import { useGsapState } from './gsap/useRemotionGsap.ts';

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
  hook1: { color: CINE_COLORS.inflowLight, accent: '#ffb3b3', subtitle: '盘面有个反常现象' },
  suspense: { color: CINE_COLORS.gold, accent: '#ffe9ad', subtitle: '为什么会出现这种情况？' },
  twist: { color: CINE_COLORS.cyan, accent: '#b8ecff', subtitle: '更离谱的是' },
  answer: { color: CINE_COLORS.outflowLight, accent: '#b9f0d4', subtitle: '真相是' },
  hook2: { color: '#e8a8f0', accent: '#f6d6fa', subtitle: '接下来会怎样？' },
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
  const lines: string[] = [];
  let cursor = 0;

  while (cursor < runes.length) {
    const remaining = runes.length - cursor;
    if (remaining <= maxLineLength) {
      lines.push(runes.slice(cursor).join('').trim());
      break;
    }
    const start = cursor;
    const end = Math.min(runes.length, cursor + maxLineLength);
    const softLo = start + Math.floor(maxLineLength * 0.6);
    let splitAt = -1;
    for (let i = end - 1; i >= softLo; i--) {
      if (targets.has(runes[i])) {
        splitAt = i;
        break;
      }
    }
    if (splitAt < 0) splitAt = end - 1;
    lines.push(runes.slice(start, splitAt + 1).join('').trim());
    cursor = splitAt + 1;
  }
  return lines.filter(Boolean);
}

/** Per-glyph cascade: each character fades+rises with a GSAP-faithful expo ease. */
const CharCascade: React.FC<{ line: string; progress: number; gap: number }> = ({ line, progress, gap }) => {
  const runes = Array.from(line);
  const each = 1 / Math.max(1, runes.length);
  return (
    <>
      {runes.map((ch, i) => {
        const start = i * each;
        const local = Math.max(0, Math.min(1, (progress - start) / (each * 1.6)));
        const eased = CINE_EASE.expoOut(local);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: eased,
              transform: `translateY(${(1 - eased) * -14}px)`,
              marginRight: runes.length > 1 ? gap : 0,
            }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
};

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
  const lines = React.useMemo(() => splitSceneText(sceneText, isTV ? 18 : 14), [sceneText, isTV]);
  const charCount = React.useMemo(() => Array.from(normalizeSceneText(sceneText)).length, [sceneText]);
  const isFirstHook = sceneType === 'hook1';

  // ── GSAP-paced body reveal: 0 → 1 over the narration, then holds ──
  const bodyAnim = useGsapState(
    frame,
    (p, t, fps) => {
      t.fromTo(
        p,
        { chars: 0 },
        { chars: 1, duration: (isFirstHook ? 1.05 : 0.85) * fps / 30, ease: 'power4.out' },
        (isFirstHook ? 0.45 : 0.55) * fps / 30,
      );
    },
    [isFirstHook],
  );
  const lineProgress = bodyAnim.chars ?? 0;

  const fadeIn = isFirstHook ? Math.min(1, (frame + 2) / 6) : Math.min(1, frame / 10);
  const fadeOut = Math.min(1, Math.max(0, (totalFrames - frame + 2) / 10));
  const opacity = fadeIn * fadeOut;

  const subtitleOpacity = isFirstHook ? Math.min(1, frame / 8) : Math.min(1, Math.max(0, (frame - 10) / 10));
  const dateFadeIn = Math.min(1, Math.max(0, (frame - (isFirstHook ? 6 : 20)) / 8));
  const dateOpacity = dateFadeIn * fadeOut;

  const audioVolume = interpolate(frame, [0, 6, Math.max(0, totalFrames - 8), totalFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const baseFontSize = isTV ? 46 : 58;
  const lineCount = lines.length || 1;
  const lengthScale = 1 - Math.max(0, charCount - (isTV ? 22 : 18)) * 0.022;
  const linesScale = 1 - Math.max(0, lineCount - 2) * 0.10;
  const fontScale = clamp(Math.min(lengthScale, linesScale), 0.62, 1);
  const fontSize = Math.floor(baseFontSize * fontScale);

  // Slow camera push-in: drift upward while slightly scaling.
  const camP = Math.min(1, frame / Math.max(1, totalFrames));
  const camY = (1 - camP) * 12 * (isTV ? 0.5 : 1);
  const camScale = 1 + camP * 0.022;

  const charGap = Math.max(1, Math.round(fontSize * 0.06)) * (isTV ? 0.5 : 1);

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
          transform: `translateY(${camY}px) scale(${camScale})`,
          transformOrigin: '50% 50%',
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
              backgroundColor: 'rgba(5, 10, 20, 0.62)',
              border: `1px solid ${CINE_COLORS.hairline}`,
              padding: isTV ? '10px 18px' : '12px 22px',
              borderRadius: 999,
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              letterSpacing: isTV ? 1.5 : 2,
              boxShadow: `0 10px 28px rgba(0,0,0,0.4), 0 0 22px ${config.accent}22`,
            }}
          >
            {displayDate}
          </div>
        </div>

        <div
          style={{
            fontSize: isTV ? 22 : 28,
            color: config.color,
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: isTV ? 2.0 : 2.4,
            marginBottom: isTV ? 20 : 28,
            opacity: subtitleOpacity * fadeOut,
            fontWeight: 700,
            transform: `translateY(${(1 - subtitleOpacity) * 14}px)`,
            textShadow: `0 0 20px ${config.color}33, 0 3px 12px rgba(0,0,0,0.45)`,
          }}
        >
          {config.subtitle}
        </div>

        <div
          style={{
            fontSize,
            fontWeight: 800,
            color: '#ffffff',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            textAlign: 'center',
            lineHeight: 1.32,
            textShadow: `0 4px 22px rgba(0,0,0,0.62), 0 0 40px ${config.accent}18`,
            opacity,
            maxWidth: isTV ? '80%' : '90%',
          }}
        >
          {lines.length > 0 ? lines.map((line, idx) => (
            <div key={idx} style={{ transform: `translateY(${(1 - Math.min(1, (lineProgress - idx * 0.12) / 0.3)) * 16}px)` }}>
              {idx < 0 ? line : (
                <CharCascade
                  line={line}
                  progress={Math.max(0, Math.min(1, (lineProgress - idx * 0.12) / 0.34))}
                  gap={charGap}
                />
              )}
            </div>
          )) : sceneText}
        </div>
      </div>
    </>
  );
};