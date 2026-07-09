import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface SubtitleOverlayProps {
  text?: string;
  format: 'mobile' | 'tv';
  width: number;
  height: number;
}

interface SubtitleToken {
  text: string;
  kind: 'normal' | 'number' | 'money' | 'percent' | 'time' | 'keyword';
}

function normalizeSubtitleText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .trim();
}

function wrapSubtitleLines(text: string, maxLineLength: number): string[] {
  const cleaned = normalizeSubtitleText(text);
  if (!cleaned) return [];

  const rawParts = cleaned.split('\n').map(s => s.trim()).filter(Boolean);
  const merged = rawParts.join(' ');
  const runes = Array.from(merged);
  if (runes.length <= maxLineLength) return [merged];

  const targets = new Set(['，', '、', ' ', '；', '：', '。', '！', '？', ',', ';', ':', '!', '?']);
  const lines: string[] = [];
  let cursor = 0;

  while (cursor < runes.length) {
    const remaining = runes.length - cursor;
    if (remaining <= maxLineLength) {
      lines.push(runes.slice(cursor).join('').trim());
      cursor = runes.length;
      break;
    }

    const start = cursor;
    const end = cursor + maxLineLength;
    const softLo = start + Math.floor(maxLineLength * 0.6);
    let splitAt = -1;
    for (let i = Math.min(end, runes.length - 1); i >= softLo; i--) {
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

function paginateLines(allLines: string[], maxLinesPerPage: number): string[][] {
  if (allLines.length === 0) return [];
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += maxLinesPerPage) {
    pages.push(allLines.slice(i, i + maxLinesPerPage));
  }
  return pages;
}

function classifyToken(token: string): SubtitleToken['kind'] {
  if (/^\d{1,2}:\d{2}$/.test(token)) return 'time';
  if (/^[+-]?\d+(?:\.\d+)?%$/.test(token)) return 'percent';
  if (/^[+-]?\d+(?:\.\d+)?(?:亿|万|元|倍)$/.test(token)) return 'money';
  if (/^(净流入|净流出|吸金|走强|走弱|放量|缩量|领涨|领跌|主线)$/.test(token)) return 'keyword';
  if (/^[+-]?\d+(?:\.\d+)?$/.test(token)) return 'number';
  return 'normal';
}

function tokenizeSubtitleLine(line: string): SubtitleToken[] {
  const pattern = /(\d{1,2}:\d{2}|[+-]?\d+(?:\.\d+)?%|[+-]?\d+(?:\.\d+)?(?:亿|万|元|倍)|净流入|净流出|吸金|走强|走弱|放量|缩量|领涨|领跌|主线|[+-]?\d+(?:\.\d+)?)/g;
  const tokens: SubtitleToken[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0;
    const matched = match[0];
    if (start > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, start), kind: 'normal' });
    }
    tokens.push({ text: matched, kind: classifyToken(matched) });
    lastIndex = start + matched.length;
  }

  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), kind: 'normal' });
  }

  return tokens.filter((token) => token.text.length > 0);
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
  const maxLines = isTV ? 2 : 3;
  const maxLineLength = isTV ? 28 : 18;
  const maxLinesPerPage = isTV ? 2 : 4;
  const pages = React.useMemo(() => {
    const allLines = wrapSubtitleLines(text, maxLineLength);
    if (allLines.length === 0) return [] as string[][];
    if (allLines.length <= maxLines) return [allLines];
    const loosePerPage = isTV ? 3 : 5;
    return paginateLines(allLines, loosePerPage);
  }, [text, maxLineLength, maxLines, maxLinesPerPage]);

  const displayPages = pages;

  const paging = displayPages.length > 1;
  const perPage = paging ? Math.max(1, Math.floor(durationInFrames / displayPages.length)) : durationInFrames;
  const pageIndex = paging ? Math.min(displayPages.length - 1, Math.floor(frame / perPage)) : 0;
  const pageStart = pageIndex * perPage;
  const pageEnd = paging ? Math.min(durationInFrames, (pageIndex + 1) * perPage) : durationInFrames;
  const pageLines = displayPages[pageIndex] ?? [];
  const lineTokens = React.useMemo(() => pageLines.map(tokenizeSubtitleLine), [pageLines]);

  if (pageLines.length === 0) return null;

  const fadeIn = Math.min(1, frame / 8);
  const fadeOut = Math.min(1, Math.max(0, (durationInFrames - frame) / 10));
  const pageFadeIn = paging ? Math.min(1, Math.max(0, (frame - pageStart) / 6)) : 1;
  const pageFadeOut = paging ? Math.min(1, Math.max(0, (pageEnd - frame) / 6)) : 1;
  const opacity = fadeIn * fadeOut * pageFadeIn * pageFadeOut;
  const bottom = isTV ? height * 0.045 : height * 0.085;
  const baseFontSize = isTV ? 34 : 54;
  const lineCount = pageLines.length;
  const longestLine = React.useMemo(() => {
    let best = 0;
    for (const line of pageLines) {
      best = Math.max(best, Array.from(line).length);
    }
    return best;
  }, [pageLines]);
  const lengthScale = 1 - Math.max(0, longestLine - maxLineLength) * 0.025;
  const linesScale = 1 - Math.max(0, lineCount - (isTV ? 2 : 3)) * 0.075;
  const fontScale = Math.max(0.62, Math.min(1, Math.min(lengthScale, linesScale)));
  const fontSize = Math.floor(baseFontSize * fontScale);
  const lineHeight = 1.28;
  const maxWidth = isTV ? width * 0.74 : width * 0.88;

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
          padding: isTV ? '14px 28px' : (lineCount >= 5 ? '14px 24px' : '18px 30px'),
          borderRadius: 12,
          background: 'rgba(3, 10, 22, 0.08)',
          border: '1px solid rgba(140, 180, 220, 0.06)',
          boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          color: '#ffffff',
          fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
          fontSize,
          fontWeight: 700,
          lineHeight,
          textAlign: 'center',
          textShadow: '0 2px 10px rgba(0,0,0,0.65)',
          letterSpacing: isTV ? 0.6 : 0.4,
          position: 'relative',
        }}
      >
        {paging && (
          <div
            style={{
              position: 'absolute',
              top: isTV ? 10 : 12,
              right: isTV ? 12 : 14,
              fontSize: isTV ? 11 : 12,
              fontWeight: 700,
              color: '#89b4e8',
              opacity: 0.8,
              fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif',
              fontVariantNumeric: 'tabular-nums' as const,
              letterSpacing: 0.6,
              textShadow: '0 2px 10px rgba(0,0,0,0.55)',
            }}
          >
            {pageIndex + 1}/{displayPages.length}
          </div>
        )}
        {lineTokens.map((tokens, index) => (
          <div key={index}>
            {tokens.map((token, tokenIndex) => {
              const isAccent = token.kind !== 'normal';
              const accentColor =
                token.kind === 'time'
                  ? '#9fd2ff'
                  : token.kind === 'percent'
                    ? '#86efac'
                    : token.kind === 'money'
                      ? '#fbbf24'
                      : token.kind === 'keyword'
                        ? '#c4b5fd'
                        : '#f8fafc';

              return (
                <span
                  key={`${index}-${tokenIndex}`}
                  style={{
                    color: accentColor,
                    fontWeight: isAccent ? 800 : 700,
                    textShadow: isAccent ? `0 0 14px ${accentColor}33, 0 3px 12px rgba(0,0,0,0.7)` : '0 3px 12px rgba(0,0,0,0.7)',
                  }}
                >
                  {token.text}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
