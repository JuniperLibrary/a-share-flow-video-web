import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, getInputProps, Sequence, Audio, staticFile, interpolate, Easing } from 'remotion';
import { Background } from './Background.tsx';
import { Header } from './Header.tsx';
import { RankingPanel } from './RankingPanel.tsx';
import { Particles } from './Particles.tsx';
import { Disclaimer } from './Disclaimer.tsx';
import { TickChart } from './TickChart.tsx';
import { NarrativeScene } from './NarrativeScene.tsx';
import { NewsScene } from './NewsScene.tsx';
import { MainStructureScene } from './MainStructureScene.tsx';
import { SubtitleOverlay } from './SubtitleOverlay.tsx';
import type { BloombergVideoProps, SectorTick } from './types.ts';

/** Wraps children with a fade-in over the first `fadeFrames` frames of the Sequence. */
const FadeInLayer: React.FC<{fadeFrames: number; children: React.ReactNode}> = ({fadeFrames, children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: Math.min(1, frame / Math.max(1, fadeFrames))}}>{children}</AbsoluteFill>;
};

const TransitionSweep: React.FC<{
  durationInFrames: number;
  width: number;
  height: number;
  intensity?: number;
}> = ({ durationInFrames, width, height, intensity = 1 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  const peak = interpolate(p, [0, 0.5, 1], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sweepY = interpolate(p, [0, 1], [-height * 0.25, height * 0.25]);
  const glowOpacity = 0.22 * peak * intensity;
  const flashOpacity = 0.06 * peak * intensity;
  const lineOpacity = 0.22 * peak * intensity;
  const lineScale = interpolate(peak, [0, 1], [0.6, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ width, height, zIndex: 999 }}>
      <AbsoluteFill style={{ backgroundColor: 'rgba(255,255,255,1)', opacity: flashOpacity }} />
      <AbsoluteFill
        style={{
          transform: `translateY(${sweepY}px)`,
          filter: `blur(${18 - 10 * peak}px)`,
          opacity: glowOpacity,
          background:
            'linear-gradient(180deg, rgba(74,128,208,0) 0%, rgba(74,128,208,0.75) 50%, rgba(74,128,208,0) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          position: 'absolute',
          left: Math.floor(width * 0.08),
          top: Math.floor(height * 0.49) + sweepY,
          width: Math.floor(width * 0.84),
          height: 2,
          transform: `scaleX(${lineScale})`,
          opacity: lineOpacity,
          borderRadius: 2,
          background: 'linear-gradient(90deg, rgba(74,128,208,0) 0%, rgba(170,210,255,0.95) 50%, rgba(74,128,208,0) 100%)',
          boxShadow: '0 0 26px rgba(170,210,255,0.35)',
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.22 * peak * intensity,
          background:
            'radial-gradient(circle at 50% 50%, rgba(74,128,208,0.22) 0%, rgba(74,128,208,0.06) 55%, rgba(74,128,208,0) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const CornerBadge: React.FC<{
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  title: string;
  progress: number;
  sectionFrame: number;
}> = ({ width, height, format, title, progress, sectionFrame }) => {
  const frame = useCurrentFrame();
  const enter = Math.min(1, frame / 10);
  const opacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(enter, [0, 1], [-8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = interpolate(sectionFrame, [0, 4, 18], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const pulseScale = interpolate(pulse, [0, 1], [1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isTV = format === 'tv';
  const padX = isTV ? 14 : 16;
  const padY = isTV ? 10 : 12;
  const fontSize = isTV ? 14 : 18;
  const top = isTV ? 34 : 44;
  const right = isTV ? 34 : 36;
  const barW = isTV ? 90 : 110;
  const barH = 3;
  const p = Math.max(0, Math.min(1, progress));

  return (
    <AbsoluteFill style={{ width, height, pointerEvents: 'none', zIndex: 900 }}>
      <div
        style={{
          position: 'absolute',
          top,
          right,
          opacity,
          transform: `translateY(${translateY}px) scale(${pulseScale})`,
          background: 'rgba(10, 20, 40, 0.58)',
          border: `1px solid rgba(120, 170, 230, ${0.14 + 0.18 * pulse})`,
          borderRadius: 14,
          padding: `${padY}px ${padX}px`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 ${Math.round(18 + 26 * pulse)}px rgba(120,180,255,${0.08 + 0.12 * pulse})`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          minWidth: isTV ? 140 : 170,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.18 * pulse,
            background:
              'radial-gradient(circle at 30% 20%, rgba(170,210,255,0.55) 0%, rgba(170,210,255,0.18) 32%, rgba(170,210,255,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            opacity: 0.2 + 0.6 * pulse,
            background: 'linear-gradient(90deg, rgba(74,128,208,0) 0%, rgba(170,210,255,0.9) 50%, rgba(74,128,208,0) 100%)',
          }}
        />
        <div
          style={{
            fontSize,
            fontWeight: 800,
            color: '#dce4ec',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 8,
            position: 'relative',
            zIndex: 2,
            textShadow: `0 0 ${Math.round(18 + 22 * pulse)}px rgba(120,180,255,${0.12 + 0.22 * pulse})`,
          }}
        >
          <span>{title}</span>
          <span style={{ fontSize: fontSize - 2, color: '#7fa7d6', fontVariantNumeric: 'tabular-nums', fontFamily: '"Helvetica Neue", sans-serif' }}>
            {Math.round(p * 100)}%
          </span>
        </div>
        <div
          style={{
            width: barW,
            height: barH,
            borderRadius: 99,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: `${Math.max(2, Math.floor(barW * p))}px`,
              height: '100%',
              borderRadius: 99,
              background: 'linear-gradient(90deg, rgba(74,128,208,0.65) 0%, rgba(170,210,255,0.95) 100%)',
              boxShadow: '0 0 18px rgba(120,180,255,0.25)',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TickAnimationScene: React.FC<{
  sectorTicks: SectorTick[];
  times: string[];
  baseTotalFrames: number;
  displayDate: string;
  format: 'mobile' | 'tv';
  session: 'morning' | 'full';
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'mainline';
  hookText: string | undefined;
  width: number;
  height: number;
  events?: BloombergVideoProps['events'];
  xLim: [number, number];
}> = ({ sectorTicks, times, baseTotalFrames, displayDate, format, session, sentiment, hookText, width, height, events, xLim }) => {
  const frame = useCurrentFrame();
  const totalFrames = baseTotalFrames;
  const progress = frame / totalFrames;
  const isTV = format === 'tv';

  const activeEventSector = React.useMemo(() => {
    if (!events || events.length === 0) return null;
    const eventFrame = Math.round(progress * 100);
    for (const ev of events) {
      if (Math.abs(ev.frame - eventFrame) < 5) {
        return ev.sector || null;
      }
    }
    return null;
  }, [events, progress]);

  const tickMeta = React.useMemo(() => {
    if (sectorTicks.length === 0) {
      return { numPoints: 0, prefixSums: [] as number[][], times: [] as string[] };
    }
    const numPoints = sectorTicks[0].data.length;
    if (numPoints === 0) {
      return { numPoints: 0, prefixSums: [] as number[][], times: [] as string[] };
    }
    const prefixSums = sectorTicks.map((s) => {
      const p = new Array<number>(numPoints + 1);
      p[0] = 0;
      for (let i = 0; i < numPoints; i++) {
        p[i + 1] = p[i] + (s.data[i] || 0);
      }
      return p;
    });
    return { numPoints, prefixSums, times: times || [] };
  }, [sectorTicks, times]);

  const sectorsForRanking = React.useMemo(() => {
    if (sectorTicks.length === 0) return [];
    const numPoints = tickMeta.numPoints;
    if (numPoints === 0) return [];
    const currentIdx = Math.min(Math.floor(progress * numPoints), numPoints - 1);

    return sectorTicks.map((s, idx) => {
      const cum = tickMeta.prefixSums[idx]?.[currentIdx + 1] ?? 0;
      return {
        name: s.name,
        net: cum,
        rate: s.rate,
        color: s.color || '#888888',
        superNet: s.superNet,
        bigNet: s.bigNet,
      };
    });
  }, [sectorTicks, progress, tickMeta]);

  const currentTickTime = React.useMemo(() => {
    if (sectorTicks.length === 0) return undefined;
    const numPoints = tickMeta.numPoints;
    if (numPoints === 0) return undefined;
    const currentIdx = Math.min(Math.floor(progress * numPoints), numPoints - 1);
    return tickMeta.times[currentIdx];
  }, [sectorTicks, progress, tickMeta]);

  const highlightId = React.useMemo(() => {
    if (sectorsForRanking.length === 0) return undefined;
    const top = [...sectorsForRanking].sort((a, b) => Math.abs(b.net) - Math.abs(a.net))[0];
    return top?.name;
  }, [sectorsForRanking]);

  return (
    <>
      <Background frame={frame} totalFrames={totalFrames} sentiment={sentiment} width={width} height={height} format={format} />
      <Header displayDate={displayDate} frame={frame} totalFrames={totalFrames} sentiment={sentiment} width={width} height={height} format={format} session={session} hookText={hookText} timeString={currentTickTime} />
      <Particles frame={frame} width={width} height={height} />

      <TickChart
        sectorTicks={sectorTicks}
        times={times}
        frame={frame}
        totalFrames={totalFrames}
        activeEventSector={activeEventSector}
        width={width}
        height={height}
        format={format}
        sentiment={sentiment}
        session={session}
        xLim={xLim}
      />

      <RankingPanel
        sectors={sectorsForRanking}
        frame={frame}
        totalFrames={totalFrames}
        highlightId={highlightId}
        width={width}
        height={height}
        format={format}
      />

      <Disclaimer
        frame={frame}
        totalFrames={totalFrames}
        width={width}
        height={height}
        format={format}
      />
    </>
  );
};

export const BloombergVideoTick: React.FC = () => {
  const { durationInFrames, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const inputProps = (getInputProps() ?? {}) as unknown as BloombergVideoProps & { sectorTicks?: SectorTick[] };

  const displayDate = inputProps.displayDate || '05-11';
  const sectorTicks = inputProps.sectorTicks || [];
  const times = inputProps.times || sectorTicks[0]?.times || [];
  const totalFrames = inputProps.totalFrames || durationInFrames;
  const events = inputProps.events;
  const format = inputProps.format || 'mobile';
  const session = inputProps.session || 'full';
  const xLim = inputProps.xLim || [0, 330];

  const scene1Frames = inputProps.scene1Frames || 0;
  const scene2Frames = inputProps.scene2Frames || 0;
  const scene3Frames = inputProps.scene3Frames || 0;
  const scene4Frames = inputProps.scene4Frames || 0;
  const scene5Frames = inputProps.scene5Frames || 0;
  const baseAnimationFrames = inputProps.baseAnimationFrames || totalFrames;
  const chartNarrationAudios = inputProps.chartNarrationAudios || [];
  const chartNarrationFrames = inputProps.chartNarrationFrames || [];
  const chartNarrationSegments = inputProps.chartNarrationSegments || [];
  const chartNarrationTexts = inputProps.chartNarrationTexts || [];
  const newsPages = inputProps.newsPages || [];
  const newsAudioFiles = inputProps.newsAudioFiles || [];
  const newsAudioFrames = inputProps.newsAudioFrames || [];
  const newsNarrationTexts = inputProps.newsNarrationTexts || [];
  const catalysisResult = inputProps.catalysisResult;
  const mainStructureResult = inputProps.mainStructureResult;
  const mainStructureAudio = inputProps.mainStructureAudio;
  const mainStructureFrames = inputProps.mainStructureFrames || 90;
  const hasVoiceover =
    scene1Frames > 0 ||
    chartNarrationAudios.length > 0 ||
    newsPages.length > 0 ||
    Boolean(mainStructureAudio);

  const sentiment = React.useMemo(() => {
    if (sectorTicks.length === 0) return 'neutral' as const;
    const lastValues = sectorTicks.map(s => s.data[s.data.length - 1] || 0);
    const negativeRatio = lastValues.filter(v => v < 0).length / lastValues.length;
    const topTick = [...sectorTicks].sort((a, b) => Math.abs(b.data.reduce((x, y) => x + y, 0)) - Math.abs(a.data.reduce((x, y) => x + y, 0)))[0];
    const topNet = topTick.data.reduce((x, y) => x + y, 0);
    const totalInflow = sectorTicks.filter(s => s.data.reduce((x, y) => x + y, 0) > 0).reduce((sum, s) => sum + s.data.reduce((x, y) => x + y, 0), 0);
    const mainlineRatio = totalInflow > 0 ? (topNet / totalInflow) : 0;
    if (topNet > 0 && mainlineRatio > 0.4) return 'mainline' as const;
    if (negativeRatio > 0.65) return 'bearish' as const;
    if (negativeRatio < 0.35) return 'bullish' as const;
    return 'neutral' as const;
  }, [sectorTicks]);

  const hookText = React.useMemo(() => {
    if (sectorTicks.length === 0) return undefined;
    const sorted = [...sectorTicks].sort((a, b) => Math.abs(b.data.reduce((x, y) => x + y, 0)) - Math.abs(a.data.reduce((x, y) => x + y, 0)));
    const top = sorted[0];
    const totalNet = sectorTicks.reduce((sum, s) => sum + s.data.reduce((x, y) => x + y, 0), 0);
    if (sentiment === 'mainline') {
      const topNet = top.data.reduce((x, y) => x + y, 0);
      return `${top.name}吸金${Math.abs(topNet).toFixed(0)}亿`;
    }
    return `${totalNet > 0 ? '净流入' : '净流出'}${Math.abs(totalNet).toFixed(0)}亿`;
  }, [sectorTicks, sentiment]);

  // Crossfade: chart starts CHART_OVERLAP frames before scene5 ends,
  // so the narration bridge sentence plays during the transition.
  const CHART_OVERLAP = 15;
  const CUT_SWEEP_FRAMES = 14;
  const scene1End = scene1Frames;
  const scene2End = scene1End + scene2Frames;
  const scene3End = scene2End + scene3Frames;
  const scene4End = scene3End + scene4Frames;
  const scene5End = scene4End + scene5Frames;
  const chartStart = Math.max(0, scene5End - CHART_OVERLAP);
  const chartDuration = baseAnimationFrames + (scene5End - chartStart);
  const animEnd = chartStart + chartDuration;

  const chartNarrationSchedule = React.useMemo(() => {
    type Item = { index: number; from: number; durationInFrames: number };
    const items: Item[] = [];
    let cursor = 0;
    const n = Math.min(chartNarrationAudios.length, chartNarrationFrames.length);
    for (let i = 0; i < n; i++) {
      const audio = chartNarrationAudios[i];
      const frames = chartNarrationFrames[i] || 0;
      if (!audio || frames <= 0) continue;
      const anchor = chartNarrationSegments[i] || 0;
      const from = Math.max(0, Math.min(chartDuration - 1, Math.max(anchor, cursor)));
      const dur = Math.max(1, Math.min(frames, chartDuration - from));
      items.push({ index: i, from, durationInFrames: dur });
      cursor = from + dur;
      if (cursor >= chartDuration) break;
    }
    return items;
  }, [chartDuration, chartNarrationAudios, chartNarrationFrames, chartNarrationSegments]);

  const newsStartFrames: number[] = [];
  let newsOffset = 0;
  for (const frames of newsAudioFrames) {
    newsStartFrames.push(animEnd + newsOffset);
    newsOffset += frames;
  }
  const newsTotalFrames = newsOffset;
  const contentStart = animEnd + newsTotalFrames;

  const sharedSceneProps = { sectorTicks, times, events, displayDate, format, session, sentiment, hookText, width, height, xLim };

  const sectionMeta = React.useMemo(() => {
    const f = Math.max(0, frame);
    const safeTotal = totalFrames > 0 ? totalFrames : durationInFrames;

    const chartEnd = animEnd;
    const newsEnd = contentStart;
    const outroEnd = contentStart + (sectorTicks.length > 0 ? mainStructureFrames : 0);

    let title = '开场';
    let start = 0;
    let end = chartStart;
    if (f >= chartStart && f < chartEnd) {
      title = '行情图谱';
      start = chartStart;
      end = chartEnd;
    } else if (f >= chartEnd && f < newsEnd) {
      title = '资金催化';
      start = chartEnd;
      end = newsEnd;
    } else if (f >= newsEnd && sectorTicks.length > 0) {
      title = '主线收尾';
      start = newsEnd;
      end = outroEnd > newsEnd ? outroEnd : safeTotal;
    }
    const denom = Math.max(1, end - start);
    const progress = (f - start) / denom;
    return { title, progress, sectionFrame: f - start };
  }, [frame, totalFrames, durationInFrames, chartStart, animEnd, contentStart, sectorTicks.length, mainStructureFrames]);

  if (!hasVoiceover) {
    return (
      <AbsoluteFill>
        {chartNarrationSchedule.map((item, j) => {
          const audio = chartNarrationAudios[item.index];
          const dur = item.durationInFrames;
          return (
            <Sequence key={`narration-${item.index}`} from={item.from} durationInFrames={dur}>
              <Audio src={staticFile(audio)} />
            </Sequence>
          );
        })}
        {chartNarrationSchedule.map((item, j) => {
          const text = chartNarrationTexts[item.index] || '';
          const nextStart = chartNarrationSchedule[j + 1]?.from ?? totalFrames;
          const dur = Math.max(1, Math.min(nextStart - item.from, Math.max(18, item.durationInFrames + 4)));
          return (
            <Sequence key={`subtitle-${item.index}`} from={item.from} durationInFrames={dur}>
              <SubtitleOverlay text={text} format={format} width={width} height={height} />
            </Sequence>
          );
        })}
        <TickAnimationScene
          {...sharedSceneProps}
          baseTotalFrames={totalFrames}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <CornerBadge width={width} height={height} format={format} title={sectionMeta.title} progress={sectionMeta.progress} sectionFrame={sectionMeta.sectionFrame} />
      {scene1Frames > 0 && (
        <Sequence from={0} durationInFrames={scene1Frames}>
          <NarrativeScene
            sceneText={inputProps.scene1Text || ''}
            audioFile={inputProps.scene1Audio || ''}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={scene1Frames}
            sceneType="hook1"
          />
        </Sequence>
      )}

      {scene2Frames > 0 && (
        <Sequence from={scene1End} durationInFrames={scene2Frames}>
          <NarrativeScene
            sceneText={inputProps.scene2Text || ''}
            audioFile={inputProps.scene2Audio || ''}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={scene2Frames}
            sceneType="suspense"
          />
        </Sequence>
      )}

      {scene3Frames > 0 && (
        <Sequence from={scene2End} durationInFrames={scene3Frames}>
          <NarrativeScene
            sceneText={inputProps.scene3Text || ''}
            audioFile={inputProps.scene3Audio || ''}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={scene3Frames}
            sceneType="twist"
          />
        </Sequence>
      )}

      {scene4Frames > 0 && (
        <Sequence from={scene3End} durationInFrames={scene4Frames}>
          <NarrativeScene
            sceneText={inputProps.scene4Text || ''}
            audioFile={inputProps.scene4Audio || ''}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={scene4Frames}
            sceneType="answer"
          />
        </Sequence>
      )}

      {scene5Frames > 0 && (
        <Sequence from={scene4End} durationInFrames={scene5Frames}>
          <NarrativeScene
            sceneText={inputProps.scene5Text || ''}
            audioFile={inputProps.scene5Audio || ''}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={scene5Frames}
            sceneType="hook2"
          />
        </Sequence>
      )}

      <Sequence from={chartStart} durationInFrames={chartDuration}>
        {chartNarrationSchedule.map((item, j) => {
          const audio = chartNarrationAudios[item.index];
          const dur = item.durationInFrames;
          return (
            <Sequence key={`narration-${item.index}`} from={item.from} durationInFrames={dur}>
              <Audio src={staticFile(audio)} />
            </Sequence>
          );
        })}
        {chartNarrationSchedule.map((item, j) => {
          const text = chartNarrationTexts[item.index] || '';
          const nextStart = chartNarrationSchedule[j + 1]?.from ?? chartDuration;
          const dur = Math.max(1, Math.min(nextStart - item.from, Math.max(18, item.durationInFrames + 4)));
          return (
            <Sequence key={`subtitle-${item.index}`} from={item.from} durationInFrames={dur}>
              <SubtitleOverlay text={text} format={format} width={width} height={height} />
            </Sequence>
          );
        })}
        <FadeInLayer fadeFrames={scene5End - chartStart}>
          <TickAnimationScene
            {...sharedSceneProps}
            baseTotalFrames={baseAnimationFrames}
          />
        </FadeInLayer>
      </Sequence>

      {newsTotalFrames > 0 && (
        <Sequence from={Math.max(0, animEnd - Math.floor(CUT_SWEEP_FRAMES / 2))} durationInFrames={CUT_SWEEP_FRAMES} layout="none">
          <TransitionSweep durationInFrames={CUT_SWEEP_FRAMES} width={width} height={height} />
        </Sequence>
      )}

      {newsPages.map((page, i) => (
        newsAudioFrames[i] > 0 && newsAudioFiles[i] && (
          <Sequence key={`news-${i}`} from={newsStartFrames[i]} durationInFrames={newsAudioFrames[i]}>
            <NewsScene
              page={page}
              audioFile={newsAudioFiles[i]}
              displayDate={displayDate}
              width={width}
              height={height}
              format={format}
              totalFrames={newsAudioFrames[i]}
              pageIndex={i}
              totalPages={newsPages.length}
              catalysisResult={catalysisResult}
            />
            <SubtitleOverlay text={newsNarrationTexts[i] || ''} format={format} width={width} height={height} />
          </Sequence>
        )
      ))}

      {sectorTicks.length > 0 && newsTotalFrames > 0 && (
        <Sequence from={Math.max(0, contentStart - Math.floor(CUT_SWEEP_FRAMES / 2))} durationInFrames={CUT_SWEEP_FRAMES} layout="none">
          <TransitionSweep durationInFrames={CUT_SWEEP_FRAMES} width={width} height={height} intensity={0.9} />
        </Sequence>
      )}

      {sectorTicks.length > 0 && newsTotalFrames === 0 && (
        <Sequence from={Math.max(0, contentStart - Math.floor(CUT_SWEEP_FRAMES / 2))} durationInFrames={CUT_SWEEP_FRAMES} layout="none">
          <TransitionSweep durationInFrames={CUT_SWEEP_FRAMES} width={width} height={height} intensity={0.9} />
        </Sequence>
      )}

      {sectorTicks.length > 0 && (
        <Sequence from={contentStart} durationInFrames={mainStructureFrames}>
          <MainStructureScene
            sectorTicks={sectorTicks}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={mainStructureFrames}
            mainStructureResult={mainStructureResult}
          />
          {mainStructureAudio ? <Audio src={staticFile(mainStructureAudio)} /> : null}
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
