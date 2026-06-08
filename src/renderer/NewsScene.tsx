import React from 'react';
import { useCurrentFrame, Audio, staticFile } from 'remotion';
import { Background } from './Background.tsx';
import type { NewsPage } from './types.ts';

interface NewsSceneProps {
  page: NewsPage;
  audioFile: string;
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  totalFrames: number;
  pageIndex: number;
  totalPages: number;
}

const SECTOR_COLORS = [
  '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9',
  '#2bd6d6', '#4dabf7', '#748ffc', '#9775fa', '#e599f7',
  '#f783ac', '#ff8787', '#ffb068', '#ffe066', '#8ce99a',
  '#63e6be', '#3bc9db', '#66c0ff', '#91a7ff', '#b197fc',
  '#d0bfff',
];

function sectorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SECTOR_COLORS[Math.abs(hash) % SECTOR_COLORS.length];
}

export const NewsScene: React.FC<NewsSceneProps> = ({
  page,
  audioFile,
  displayDate,
  width,
  height,
  format,
  totalFrames,
  pageIndex,
  totalPages,
}) => {
  const frame = useCurrentFrame();
  const isTV = format === 'tv';

  const fadeIn = Math.min(1, frame / 20);

  const headerSize = isTV ? 26 : 34;
  const sectorNameSize = isTV ? 28 : 36;
  const newsTitleSize = isTV ? 22 : 30;
  const pageSize = isTV ? 18 : 22;

  const containerPadding = isTV ? 44 : 32;
  const sectorGap = isTV ? 18 : 24;
  const newsGap = isTV ? 10 : 14;

  return (
    <>
      <Audio src={staticFile(audioFile)} />
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
          padding: containerPadding,
          zIndex: 20,
          opacity: fadeIn,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isTV ? 20 : 30,
          }}
        >
          <div
            style={{
              fontSize: headerSize,
              color: '#4a80d0',
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            {displayDate} · 今日热点 · 板块新闻
          </div>
          <div
            style={{
              fontSize: pageSize,
              color: '#667788',
              fontFamily: '"Helvetica Neue", sans-serif',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {pageIndex + 1} / {totalPages}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: isTV ? 'row' : 'column',
            gap: isTV ? 16 : sectorGap,
            justifyContent: isTV ? 'center' : 'flex-start',
            alignItems: isTV ? 'stretch' : undefined,
          }}
        >
          {page.sectors.map((sn, si) => {
            const color = sectorColor(sn.sector);
            const sectorDelay = si * 8;
            const sectorOpacity = Math.min(1, Math.max(0, (frame - sectorDelay) / 10));

            return (
              <div
                key={sn.sector}
                style={{
                  opacity: sectorOpacity,
                  flex: isTV ? 1 : undefined,
                  background: isTV ? 'rgba(20,30,50,0.6)' : undefined,
                  borderRadius: isTV ? 8 : 0,
                  border: isTV ? '1px solid rgba(60,80,120,0.3)' : undefined,
                  padding: isTV ? 12 : 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isTV ? 8 : 14,
                    marginBottom: isTV ? 8 : 12,
                    borderBottom: isTV ? '1px solid rgba(60,80,120,0.3)' : undefined,
                    paddingBottom: isTV ? 6 : 0,
                  }}
                >
                  <div
                    style={{
                      width: isTV ? 3 : 6,
                      height: isTV ? 16 : 28,
                      borderRadius: 2,
                      background: color,
                      boxShadow: `0 0 8px ${color}66`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: sectorNameSize,
                      fontWeight: 700,
                      color: '#e0e8f0',
                      fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                      textShadow: `0 0 12px ${color}44`,
                    }}
                  >
                    {sn.sector}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: isTV ? 4 : newsGap, flex: 1 }}>
                  {sn.news.map((item, ni) => {
                    const newsDelay = sectorDelay + 6 + ni * 4;
                    const newsOpacity = Math.min(1, Math.max(0, (frame - newsDelay) / 8));
                    const isLevelA = item.level === 'A';

                    return (
                      <div
                        key={ni}
                        style={{
                          opacity: newsOpacity,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: isTV ? 6 : 12,
                        }}
                      >
                        {isLevelA && (
                          <span
                            style={{
                              fontSize: isTV ? 11 : 14,
                              fontWeight: 700,
                              color: '#ff4444',
                              background: 'rgba(255,68,68,0.15)',
                              borderRadius: 3,
                              padding: isTV ? '2px 4px' : '3px 8px',
                              fontFamily: '"Helvetica Neue", sans-serif',
                              flexShrink: 0,
                              marginTop: isTV ? 3 : 4,
                            }}
                          >
                            热
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: newsTitleSize,
                            color: isLevelA ? '#ffaaaa' : '#aabbcc',
                            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                          }}
                        >
                          {item.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: isTV ? 12 : 16,
            fontSize: pageSize,
            color: '#556677',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 2,
            textAlign: 'center',
          }}
        >
          数据来源：财联社 · 仅供参考
        </div>
      </div>
    </>
  );
};
