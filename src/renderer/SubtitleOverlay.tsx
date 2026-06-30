import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface SubtitleOverlayProps {
  text?: string;
  format: 'mobile' | 'tv';
  width: number;
  height: number;
}

function normalizeSubtitleText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .trim();
}

function splitSubtitle(text: string, maxLineLength: number): string[] {
  const cleaned = normalizeSubtitleText(text);
  if (!cleaned) return [];

  const rawParts = cleaned.split('\n').map(s => s.trim()).filter(Boolean);
  const merged = rawParts.join(' ');
  const runes = Array.from(merged);
  if (runes.length <= maxLineLength) return [merged];

  const targets = new Set(['，', '、', ' ', '；', '：', '。', '！', '？', ',', ';', ':', '!', '?']);
  const center = maxLineLength;
  let best = -1;
  let bestDist = 1e9;
  const lo = Math.max(6, center - 8);
  const hi = Math.min(runes.length - 6, center + 10);
  for (let i = lo; i <= hi; i++) {
    if (!targets.has(runes[i])) continue;
    const dist = Math.abs(i - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  if (best < 0) best = Math.min(runes.length - 1, center);

  const l1 = runes.slice(0, best + 1).join('').trim();
  let l2 = runes.slice(best + 1).join('').trim();
  if (Array.from(l2).length > maxLineLength) {
    l2 = Array.from(l2).slice(0, Math.max(0, maxLineLength-1)).join('') + '…';
  }
  const lines = [l1, l2].filter(Boolean);
  return lines.slice(0, 2);
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  text = '',
  format,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const isTV = format === 'tv';
  const lines = React.useMemo(() => {
    return splitSubtitle(text, isTV ? 26 : 16);
  }, [text, isTV]);

  if (lines.length === 0) return null;

  const fadeIn = Math.min(1, frame / 8);
  const fadeOut = Math.min(1, Math.max(0, (durationInFrames - frame) / 10));
  const opacity = fadeIn * fadeOut;
  const bottom = isTV ? height * 0.07 : height * 0.13;
  const fontSize = isTV ? 34 : 54;
  const lineHeight = 1.28;
  const maxWidth = isTV ? width * 0.72 : width * 0.84;

  return (
    <AbsoluteFill
      style={{
        zIndex: 80,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: bottom,
        opacity,
      }}
    >
      <div
        style={{
          maxWidth,
          padding: isTV ? '14px 28px' : '18px 30px',
          borderRadius: 12,
          background: 'rgba(3, 10, 22, 0.62)',
          border: '1px solid rgba(140, 180, 220, 0.20)',
          boxShadow: '0 12px 34px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#ffffff',
          fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
          fontSize,
          fontWeight: 700,
          lineHeight,
          textAlign: 'center',
          textShadow: '0 3px 12px rgba(0,0,0,0.7)',
          letterSpacing: isTV ? 0.6 : 0.4,
        }}
      >
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
