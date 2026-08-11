import React from 'react';
import { useCurrentFrame, interpolate, Audio, staticFile } from 'remotion';
import { Background } from './Background.tsx';
import type { NewsPage, CatalysisResult } from './types.ts';

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
  catalysisResult?: CatalysisResult;
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

const confidenceMeta: Record<string, { label: string; color: string; bg: string; border: string }> = {
  high: { label: '高置信', color: '#1f2937', bg: '#69db7c', border: 'rgba(105,219,124,0.5)' },
  medium: { label: '中置信', color: '#1f2937', bg: '#ffd43b', border: 'rgba(255,212,59,0.5)' },
  low: { label: '低置信', color: '#f3f4f6', bg: 'rgba(130,130,150,0.4)', border: 'rgba(130,130,150,0.5)' },
};

function confidenceOf(confidence?: string) {
  const k = (confidence || '').toLowerCase();
  return confidenceMeta[k] || confidenceMeta.low;
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
  catalysisResult,
}) => {
  const frame = useCurrentFrame();
  const isTV = format === 'tv';

  const enter = Math.min(1, frame / 10);
  const leave = Math.min(1, Math.max(0, (totalFrames - frame) / 8));
  const opacity = interpolate(enter * leave, [0, 1], [0.75, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(enter, [0, 1], [16, 0]);
  const audioVolume = interpolate(frame, [0, 8, Math.max(0, totalFrames - 10), totalFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerSweep = interpolate(frame, [0, 10, Math.max(0, totalFrames - 10), totalFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const headerSize = isTV ? 28 : 36;
  const sectorNameSize = isTV ? 30 : 38;
  const newsTitleSize = isTV ? 22 : 30;
  const analysisSize = isTV ? 20 : 26;
  const briefSize = isTV ? 16 : 22;
  const pageSize = isTV ? 18 : 24;
  const badgeFontSize = isTV ? 14 : 18;

  const containerPad = isTV ? 36 : 38;
  const cardPad = isTV ? 14 : 18;
  const cardRadius = isTV ? 10 : 12;
  const sectorGap = isTV ? 12 : 16;

  const sectorAnalysis = React.useMemo(() => {
    if (!catalysisResult) return null;
    const map = new Map<string, CatalysisResult['sectors'][0]>();
    for (const s of catalysisResult.sectors) {
      map.set(s.sector, s);
    }
    return map;
  }, [catalysisResult]);

  const introLead = isTV ? 6 : 10;

  return (
    <>
      <Audio src={staticFile(audioFile)} volume={audioVolume} />
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
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        <div
          style={{
            position: 'relative',
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
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -1,
              height: 2,
              opacity: 0.18 + 0.28 * headerSweep,
              background: 'linear-gradient(90deg, rgba(74,128,208,0) 0%, rgba(170,210,255,0.9) 45%, rgba(74,128,208,0) 100%)',
              transform: `scaleX(${Math.max(0.05, headerSweep)})`,
              transformOrigin: 'left center',
            }}
          />
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
            const sectorProgress = Math.min(1, Math.max(0, (frame + introLead - sectorDelay) / 14));
            const sectorOpacity = sectorProgress;
            const sectorTranslateY = interpolate(sectorProgress, [0, 1], [24, 0]);
            const analysis = sectorAnalysis?.get(sn.sector);

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
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: 2,
                    opacity: 0.18 + 0.45 * sectorProgress,
                    background: `linear-gradient(90deg, rgba(74,128,208,0) 0%, ${color} 50%, rgba(74,128,208,0) 100%)`,
                    backgroundSize: '200% 100%',
                    backgroundPosition: `${Math.round((1 - sectorProgress) * 100)}% 0`,
                    filter: `blur(${Math.max(0, 1 - sectorProgress)}px)`,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isTV ? 6 : 10,
                    marginBottom: isTV ? 8 : 12,
                    paddingBottom: isTV ? 6 : 10,
                    borderBottom: '1px solid rgba(60, 80, 120, 0.12)',
                    position: 'relative',
                    zIndex: 2,
                    flexWrap: 'wrap',
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
                  {analysis && analysis.confidence && (
                    <span
                      style={{
                        fontSize: badgeFontSize,
                        fontWeight: 700,
                        color: confidenceOf(analysis.confidence).color,
                        background: confidenceOf(analysis.confidence).bg,
                        borderRadius: 4,
                        padding: isTV ? '1px 6px' : '2px 8px',
                        fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif, sans-serif',
                        border: `1px solid ${confidenceOf(analysis.confidence).border}`,
                        letterSpacing: 1,
                      }}
                    >
                      {confidenceOf(analysis.confidence).label}
                    </span>
                  )}
                  {analysis && typeof analysis.overallScore === 'number' && !Number.isNaN(analysis.overallScore) && (
                    <span
                      style={{
                        fontSize: isTV ? 12 : 16,
                        fontWeight: 600,
                        color: '#aab8c8',
                        fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif',
                        fontVariantNumeric: 'tabular-nums',
                        background: 'rgba(30,50,80,0.35)',
                        padding: isTV ? '1px 6px' : '2px 8px',
                        borderRadius: 4,
                        border: '1px solid rgba(60,80,120,0.2)',
                      }}
                    >
                      证据分 {analysis.overallScore.toFixed(0)}
                    </span>
                  )}
                  {analysis && typeof analysis.flow === 'number' && !Number.isNaN(analysis.flow) && (
                    <span
                      style={{
                        fontSize: isTV ? 12 : 16,
                        fontWeight: 700,
                        color: analysis.flow >= 0 ? '#51cf66' : '#ff6b6b',
                        fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif',
                        fontVariantNumeric: 'tabular-nums',
                        marginLeft: 'auto',
                      }}
                    >
                      {analysis.flow >= 0 ? '+' : ''}
                      {analysis.flow.toFixed(2)} 亿
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isTV ? 6 : 10,
                    flex: 1,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {analysis && (
                    <div
                      style={{
                        fontSize: analysisSize,
                        color: '#e0e8f0',
                        fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                        lineHeight: 1.4,
                        marginBottom: isTV ? 4 : 6,
                        padding: isTV ? '4px 0' : '6px 0',
                        borderBottom: '1px solid rgba(60,80,120,0.1)',
                      }}
                    >
                      {analysis.analysis}
                    </div>
                  )}

                  {(() => {
                    const list: {
                      key: string;
                      delay: number;
                      isLevelA: boolean;
                      label?: string;
                      score?: number;
                      flowDelta?: number;
                      title: string;
                      text: string;
                      source?: string;
                    }[] = [];

                    const newsCount = Math.min(2, sn.news.length);
                    for (let ni = 0; ni < newsCount; ni++) {
                      const newsDelay = sectorDelay + 6 + ni * 4;
                      const item = sn.news[ni];
                      const newInsight = analysis?.newInsights?.[ni];
                      list.push({
                        key: `n-${ni}`,
                        delay: newsDelay,
                        isLevelA: item.level === 'A',
                        label: newInsight?.label || '',
                        score: newInsight?.score,
                        flowDelta: newInsight?.flowDelta,
                        title: item.title,
                        text: newInsight?.text || analysis?.insights?.[ni] || item.title,
                        source: newInsight?.source || item.title,
                      });
                    }
                    return list.map((row) => {
                      const newsProgress = Math.min(1, Math.max(0, (frame + introLead - row.delay) / 10));
                      const newsOpacity = newsProgress;
                      const newsTranslateY = interpolate(newsProgress, [0, 1], [8, 0]);
                      const levelAcolor = row.isLevelA ? '#ffd4d4' : undefined;
                      return (
                        <div
                          key={row.key}
                          style={{
                            opacity: newsOpacity,
                            transform: `translateY(${newsTranslateY}px)`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: isTV ? 6 : 10,
                            padding: isTV ? '3px 0' : '2px 0',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: isTV ? 4 : 6,
                              flexShrink: 0,
                            }}
                          >
                            {row.isLevelA && (
                              <span
                                style={{
                                  fontSize: badgeFontSize,
                                  fontWeight: 700,
                                  color: '#ff6b6b',
                                  background: 'rgba(255,60,60,0.1)',
                                  borderRadius: 3,
                                  padding: isTV ? '1px 5px' : '2px 6px',
                                  fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                                  marginTop: isTV ? 2 : 3,
                                  border: '1px solid rgba(255,80,80,0.15)',
                                  textAlign: 'center',
                                }}
                              >
                                热
                              </span>
                            )}
                            {row.label && (
                              <span
                                style={{
                                  fontSize: isTV ? 11 : 14,
                                  fontWeight: 700,
                                  color,
                                  background: `${color}15`,
                                  borderRadius: 3,
                                  padding: isTV ? '1px 5px' : '2px 6px',
                                  fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                                  border: `1px solid ${color}33`,
                                  textAlign: 'center',
                                  letterSpacing: 1,
                                  marginTop: isTV ? 0 : 2,
                                }}
                              >
                                {row.label}
                              </span>
                            )}
                            {typeof row.score === 'number' && !Number.isNaN(row.score) && (
                              <span
                                style={{
                                  fontSize: isTV ? 10 : 12,
                                  fontWeight: 600,
                                  color: '#aab8c8',
                                  fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif',
                                  fontVariantNumeric: 'tabular-nums',
                                  textAlign: 'center',
                                }}
                              >
                                {row.score.toFixed(0)}
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: isTV ? 6 : 8,
                                marginBottom: 2,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: newsTitleSize,
                                  color: levelAcolor || (analysis?.confidence === 'low' ? '#bcc6d0' : '#d0dae6'),
                                  fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                                  lineHeight: 1.35,
                                }}
                              >
                                {row.text}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: isTV ? 8 : 10,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: briefSize,
                                  color: '#5a6a7a',
                                  fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                                  lineHeight: 1.35,
                                  marginTop: isTV ? 1 : 2,
                                  flex: 1,
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                来源：{row.source}
                              </div>
                              {typeof row.flowDelta === 'number' && !Number.isNaN(row.flowDelta) && row.flowDelta !== 0 && (
                                <span
                                  style={{
                                    fontSize: isTV ? 11 : 14,
                                    fontWeight: 700,
                                    color: row.flowDelta >= 0 ? '#51cf66' : '#ff6b6b',
                                    fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif',
                                    fontVariantNumeric: 'tabular-nums',
                                    flexShrink: 0,
                                  }}
                                >
                                  {row.flowDelta >= 0 ? '+' : ''}
                                  {row.flowDelta.toFixed(2)}亿
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
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
