import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  getInputProps,
  Sequence,
  spring,
} from 'remotion';
import { Background } from './Background.tsx';
import { Header } from './Header.tsx';
import { Chart } from './Chart.tsx';
import { RankingPanel } from './RankingPanel.tsx';
import { Particles } from './Particles.tsx';
import { Disclaimer } from './Disclaimer.tsx';
import { NarrativeScene } from './NarrativeScene.tsx';
import type { BloombergVideoProps } from './types.ts';
import { computeCurrentSectorValues } from './chart-utils.ts';

const AnimationScene: React.FC<{
  sectors: BloombergVideoProps['sectors'];
  events: BloombergVideoProps['events'];
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'mainline';
  mainLineId: string | null;
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  session: 'morning' | 'full';
  hookText: string | undefined;
  xLim: [number, number];
}> = ({ sectors, events, sentiment, mainLineId, displayDate, width, height, format, session, hookText, xLim }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const totalFrames = durationInFrames;
  const progress = frame / totalFrames;

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

  const currentSectors = React.useMemo(
    () => computeCurrentSectorValues(sectors, frame, totalFrames),
    [sectors, frame, totalFrames],
  );

  return (
    <>
      <Background frame={frame} totalFrames={totalFrames} sentiment={sentiment} width={width} height={height} format={format} />
      <Header displayDate={displayDate} frame={frame} totalFrames={totalFrames} sentiment={sentiment} width={width} height={height} format={format} session={session} hookText={hookText} />
      <Particles frame={frame} width={width} height={height} />
      <Chart
        sectors={sectors}
        mainLineId={mainLineId}
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
        sectors={currentSectors}
        frame={frame}
        totalFrames={totalFrames}
        highlightId={mainLineId || undefined}
        width={width}
        height={height}
        format={format}
      />
      <Disclaimer frame={frame} totalFrames={totalFrames} width={width} height={height} format={format} />
    </>
  );
};

export const BloombergVideo: React.FC = () => {
  const { durationInFrames, width, height } = useVideoConfig();
  const inputProps = (getInputProps() ?? {}) as unknown as BloombergVideoProps;

  const displayDate = inputProps.displayDate || '05-11';
  const sectors = inputProps.sectors || [];
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
  const hasVoiceover = scene1Frames > 0;

  const mainLineId = React.useMemo(() => {
    if (sectors.length === 0) return null;
    let maxAbs = 0;
    let main = sectors[0].name;
    for (const s of sectors) {
      if (Math.abs(s.net) > maxAbs) {
        maxAbs = Math.abs(s.net);
        main = s.name;
      }
    }
    return main;
  }, [sectors]);

  const sentiment = React.useMemo(() => {
    if (sectors.length === 0) return 'neutral' as const;
    const negativeRatio = sectors.filter((s) => s.net < 0).length / sectors.length;
    const topSector = [...sectors].sort((a, b) => Math.abs(b.net) - Math.abs(a.net))[0];
    const totalInflow = sectors.filter((s) => s.net > 0).reduce((sum, s) => sum + s.net, 0);
    const mainlineRatio = totalInflow > 0 ? topSector.net / totalInflow : 0;
    if (topSector.net > 0 && mainlineRatio > 0.4) return 'mainline' as const;
    if (negativeRatio > 0.65) return 'bearish' as const;
    if (negativeRatio < 0.35) return 'bullish' as const;
    return 'neutral' as const;
  }, [sectors]);

  const hookText = React.useMemo(() => {
    if (sectors.length === 0) return undefined;
    const sorted = [...sectors].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
    const top = sorted[0];
    if (sentiment === 'mainline') {
      return `${top.name}吸金${Math.abs(top.net).toFixed(0)}亿`;
    }
    const totalNet = sectors.reduce((sum, s) => sum + s.net, 0);
    return `${totalNet > 0 ? '净流入' : '净流出'}${Math.abs(totalNet).toFixed(0)}亿`;
  }, [sectors, sentiment]);

  const scene1End = scene1Frames;
  const scene2End = scene1End + scene2Frames;
  const scene3End = scene2End + scene3Frames;
  const scene4End = scene3End + scene4Frames;
  const scene5End = scene4End + scene5Frames;
  const sharedSceneProps = { sectors, events, sentiment, mainLineId, displayDate, width, height, format, session, hookText, xLim };

  if (!hasVoiceover) {
    return (
      <AbsoluteFill>
        <AnimationScene {...sharedSceneProps} />
      </AbsoluteFill>
    );
  }

  const sceneTypes: Array<'hook1' | 'suspense' | 'twist' | 'answer' | 'hook2'> = ['hook1', 'suspense', 'twist', 'answer', 'hook2'];
  const sceneTexts = [inputProps.scene1Text, inputProps.scene2Text, inputProps.scene3Text, inputProps.scene4Text, inputProps.scene5Text];
  const sceneAudios = [inputProps.scene1Audio, inputProps.scene2Audio, inputProps.scene3Audio, inputProps.scene4Audio, inputProps.scene5Audio];
  const sceneFrames = [scene1Frames, scene2Frames, scene3Frames, scene4Frames, scene5Frames];
  const sceneStarts = [0, scene1End, scene2End, scene3End, scene4End];

  return (
    <AbsoluteFill>
      {sceneFrames.map((frames, i) => (
        frames > 0 && (
          <Sequence key={`scene-${i}`} from={sceneStarts[i]} durationInFrames={frames}>
            <NarrativeScene
              sceneText={sceneTexts[i] || ''}
              audioFile={sceneAudios[i] || ''}
              displayDate={displayDate}
              width={width}
              height={height}
              format={format}
              totalFrames={frames}
              sceneType={sceneTypes[i]}
            />
          </Sequence>
        )
      ))}

      <Sequence from={scene5End} durationInFrames={baseAnimationFrames}>
        <AnimationScene {...sharedSceneProps} />
      </Sequence>
    </AbsoluteFill>
  );
};
