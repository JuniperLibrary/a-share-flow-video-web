import React from 'react';
import { useCurrentFrame, interpolate, Audio, staticFile } from 'remotion';
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

  const fadeIn = Math.min(1, frame / 18);

  const headerSize = isTV ? 28 : 36;
  const sectorNameSize = isTV ? 30 : 38;
  const newsTitleSize = isTV ? 22 : 30;
  const briefSize = isTV ? 16 : 22;
  const pageSize = isTV ? 18 : 24;
  const badgeFontSize = isTV ? 14 : 18;

  const containerPad = isTV ? 36 : 38;
  const cardPad = isTV ? 14 : 18;
  const cardRadius = isTV ? 10 : 12;
  const sectorGap = isTV ? 12 : 16;

  return (
    <>
      <Audio src={staticFile(audioFile)} />
      <Background
        frame={frame}
        totalFrames={totalFrames}
        sentiment="neutral"
        width={width}
        height={height}
        format={format}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          padding: containerPad,
          zIndex: 20,
          opacity: fadeIn,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: isTV ? 12 : 16,
            borderBottom: '1px solid rgba(60,80,120,0.2)',
            marginBottom: isTV ? 14 : 18,
          }}
        >
          <div
            style={{
              fontSize: headerSize,
              color: '#4a80d0',
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              letterSpacing: 3,
              fontWeight: 600,
              textShadow: '0 0 20px rgba(74,128,208,0.25)',
            }}
          >
            {displayDate} · 资金催化
          </div>
          <div
            style={{
              fontSize: pageSize,
              color: '#556677',
              fontFamily: '"Helvetica Neue", sans-serif',
              fontVariantNumeric: 'tabular-nums',
              background: 'rgba(30,50,80,0.35)',
              padding: isTV ? '2px 8px' : '3px 10px',
              borderRadius: 4,
              border: '1px solid rgba(60,80,120,0.2)',
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
            gap: sectorGap,
            justifyContent: 'center',
            alignItems: 'stretch',
          }}
        >
          {page.sectors.map((sn, si) => {
            const color = sectorColor(sn.sector);
            const sectorDelay = si * 8;
            const sectorProgress = Math.min(1, Math.max(0, (frame - sectorDelay) / 14));
            const sectorOpacity = sectorProgress;
            const sectorTranslateY = interpolate(sectorProgress, [0, 1], [24, 0]);

            return (
              <div
                key={sn.sector}
                style={{
                  opacity: sectorOpacity,
                  transform: `translateY(${sectorTranslateY}px)`,
                  flex: isTV ? 1 : undefined,
                  background: 'rgba(10, 20, 40, 0.6)',
                  borderRadius: cardRadius,
                  border: '1px solid rgba(60, 80, 120, 0.2)',
                  boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)`,
                  padding: cardPad,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                  <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isTV ? 6 : 10,
                    marginBottom: isTV ? 8 : 12,
                    paddingBottom: isTV ? 6 : 10,
                    borderBottom: '1px solid rgba(60, 80, 120, 0.12)',
                  }}
                >
                  <div
                    style={{
                      width: isTV ? 3 : 4,
                      height: isTV ? 14 : 20,
                      borderRadius: 2,
                      background: color,
                      boxShadow: `0 0 10px ${color}44`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: sectorNameSize,
                      fontWeight: 700,
                      color: '#dce4ec',
                      fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                      textShadow: `0 0 12px ${color}22`,
                      letterSpacing: 1,
                    }}
                  >
                    {sn.sector}
                  </span>
                </div>

                  <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isTV ? 6 : 10,
                    flex: 1,
                  }}
                >
                  {sn.news.slice(0, 2).map((item, ni) => {
                    const newsDelay = sectorDelay + 6 + ni * 4;
                    const newsProgress = Math.min(1, Math.max(0, (frame - newsDelay) / 10));
                    const newsOpacity = newsProgress;
                    const newsTranslateY = interpolate(newsProgress, [0, 1], [8, 0]);
                    const isLevelA = item.level === 'A';

                    return (
                      <div
                        key={ni}
                        style={{
                          opacity: newsOpacity,
                          transform: `translateY(${newsTranslateY}px)`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: isTV ? 6 : 10,
                          padding: isTV ? '3px 0' : '2px 0',
                        }}
                      >
                        {isLevelA && (
                          <span
                            style={{
                              fontSize: badgeFontSize,
                              fontWeight: 700,
                              color: '#ff6b6b',
                              background: 'rgba(255,60,60,0.1)',
                              borderRadius: 3,
                              padding: isTV ? '1px 5px' : '2px 6px',
                              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                              flexShrink: 0,
                              marginTop: isTV ? 2 : 3,
                              border: '1px solid rgba(255,80,80,0.15)',
                            }}
                          >
                            热
                          </span>
                        )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isTV ? 6 : 8,
                              marginBottom: item.brief ? (isTV ? 3 : 5) : 0,
                            }}
                          >
                            <span
                              style={{
                                flexShrink: 0,
                                fontSize: isTV ? 13 : 18,
                                fontWeight: 700,
                                color,
                                fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              催化{ni + 1}
                            </span>
                            <span
                              style={{
                                fontSize: newsTitleSize,
                                color: isLevelA ? '#e8c8c8' : '#b0c0d0',
                                fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                                lineHeight: 1.35,
                              }}
                            >
                              {item.title}
                            </span>
                          </div>
                          {item.brief && (
                            <div
                              style={{
                                fontSize: briefSize,
                                color: '#5a6a7a',
                                fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                                lineHeight: 1.35,
                                marginTop: isTV ? 1 : 2,
                              }}
                            >
                              内容：{item.brief}
                            </div>
                          )}
                        </div>
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
            marginTop: isTV ? 10 : 14,
            paddingTop: isTV ? 8 : 10,
            borderTop: '1px solid rgba(60,80,120,0.12)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: pageSize,
              color: '#3a4a5a',
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              letterSpacing: 2,
            }}
          >
            新闻解释催化，资金确认方向 · 仅供参考
          </span>
        </div>
      </div>
    </>
  );
};
