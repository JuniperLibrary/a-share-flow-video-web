import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface SubtitleOverlayProps {
  text?: string;
  format: 'mobile' | 'tv';
  width: number;
  height: number;
}

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?]/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function splitSubtitle(text: string, maxLineLength: number): string[] {
  const runes = Array.from(text.replace(/[，、]/g, ' ').replace(/\s+/g, ' ').trim());
  const lines: string[] = [];
  for (let i = 0; i < runes.length && lines.length < 2; i += maxLineLength) {
    lines.push(runes.slice(i, i + maxLineLength).join(''));
  }
  return lines;
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
    const sentences = splitSentences(text);
    if (sentences.length === 0) return [];
    const index = Math.min(
      sentences.length - 1,
      Math.floor((frame / Math.max(1, durationInFrames)) * sentences.length),
    );
    return splitSubtitle(sentences[index], isTV ? 24 : 15);
  }, [text, isTV, frame, durationInFrames]);

  if (lines.length === 0) return null;

  const fadeIn = Math.min(1, frame / 8);
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
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          maxWidth,
          padding: isTV ? '14px 28px' : '18px 30px',
          borderRadius: 8,
          background: 'rgba(3, 10, 22, 0.72)',
          border: '1px solid rgba(120, 150, 190, 0.22)',
          boxShadow: '0 12px 34px rgba(0,0,0,0.35)',
          color: '#ffffff',
          fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
          fontSize,
          fontWeight: 800,
          lineHeight,
          textAlign: 'center',
          textShadow: '0 3px 12px rgba(0,0,0,0.7)',
          letterSpacing: 0,
        }}
      >
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
