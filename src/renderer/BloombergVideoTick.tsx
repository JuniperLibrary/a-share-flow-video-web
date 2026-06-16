import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, getInputProps, Sequence, Audio, staticFile } from 'remotion';
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

const TickAnimationScene: React.FC<{
  sectorTicks: SectorTick[];
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
}> = ({ sectorTicks, baseTotalFrames, displayDate, format, session, sentiment, hookText, width, height, events, xLim }) => {
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

  const sectorsForRanking = React.useMemo(() => {
    if (sectorTicks.length === 0) return [];
    const numPoints = sectorTicks[0].data.length;
    if (numPoints === 0) return [];
    const currentIdx = Math.min(Math.floor(progress * numPoints), numPoints - 1);

    return sectorTicks.map(s => {
      let cum = 0;
      for (let i = 0; i <= currentIdx; i++) {
        cum += s.data[i] || 0;
      }
      return {
        name: s.name,
        net: cum,
        rate: s.rate,
        color: s.color || '#888888',
        superNet: s.superNet,
        bigNet: s.bigNet,
      };
    });
  }, [sectorTicks, progress]);

  const currentTickTime = React.useMemo(() => {
    if (sectorTicks.length === 0) return undefined;
    const numPoints = sectorTicks[0].data.length;
    if (numPoints === 0) return undefined;
    const currentIdx = Math.min(Math.floor(progress * numPoints), numPoints - 1);
    return sectorTicks[0].times[currentIdx];
  }, [sectorTicks, progress]);

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
  const inputProps = (getInputProps() ?? {}) as unknown as BloombergVideoProps & { sectorTicks?: SectorTick[] };

  const displayDate = inputProps.displayDate || '05-11';
  const sectorTicks = inputProps.sectorTicks || [];
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
  const chartNarrationSegments = inputProps.chartNarrationSegments || [];
  const chartNarrationTexts = inputProps.chartNarrationTexts || [];
  const newsPages = inputProps.newsPages || [];
  const newsAudioFiles = inputProps.newsAudioFiles || [];
  const newsAudioFrames = inputProps.newsAudioFrames || [];
  const newsNarrationTexts = inputProps.newsNarrationTexts || [];
  const hasVoiceover = scene1Frames > 0 || newsPages.length > 0;

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
  const scene1End = scene1Frames;
  const scene2End = scene1End + scene2Frames;
  const scene3End = scene2End + scene3Frames;
  const scene4End = scene3End + scene4Frames;
  const scene5End = scene4End + scene5Frames;
  const chartStart = Math.max(0, scene5End - CHART_OVERLAP);
  const chartDuration = baseAnimationFrames + (scene5End - chartStart);
  const animEnd = chartStart + chartDuration;

  const newsStartFrames: number[] = [];
  let newsOffset = 0;
  for (const frames of newsAudioFrames) {
    newsStartFrames.push(animEnd + newsOffset);
    newsOffset += frames;
  }
  const newsTotalFrames = newsOffset;
  const contentStart = animEnd + newsTotalFrames;

  const sharedSceneProps = { sectorTicks, events, displayDate, format, session, sentiment, hookText, width, height, xLim };

  if (!hasVoiceover) {
    return (
      <AbsoluteFill>
        {chartNarrationAudios.map((audio, i) => {
          const from = chartNarrationSegments[i] || 0;
          const next = chartNarrationSegments[i + 1] || totalFrames;
          return (
            <Sequence key={`narration-${i}`} from={from} durationInFrames={Math.max(1, next - from)}>
              <Audio src={staticFile(audio)} />
            </Sequence>
          );
        })}
        {chartNarrationTexts.map((text, i) => {
          const from = chartNarrationSegments[i] || 0;
          const next = chartNarrationSegments[i + 1] || totalFrames;
          return (
            <Sequence key={`subtitle-${i}`} from={from} durationInFrames={Math.max(45, next - from)}>
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
        {chartNarrationAudios.map((audio, i) => {
          const from = chartNarrationSegments[i] || 0;
          const next = chartNarrationSegments[i + 1] || chartDuration;
          return (
            <Sequence key={`narration-${i}`} from={from} durationInFrames={Math.max(1, next - from)}>
              <Audio src={staticFile(audio)} />
            </Sequence>
          );
        })}
        {chartNarrationTexts.map((text, i) => {
          const from = chartNarrationSegments[i] || 0;
          const next = chartNarrationSegments[i + 1] || chartDuration;
          return (
            <Sequence key={`subtitle-${i}`} from={from} durationInFrames={Math.max(45, next - from)}>
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
            />
            <SubtitleOverlay text={newsNarrationTexts[i]} format={format} width={width} height={height} />
          </Sequence>
        )
      ))}

      {sectorTicks.length > 0 && (
        <Sequence from={contentStart} durationInFrames={90}>
          <MainStructureScene
            sectorTicks={sectorTicks}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={90}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
