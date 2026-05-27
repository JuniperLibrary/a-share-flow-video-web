import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, getInputProps, Sequence } from 'remotion';
import { Background } from './Background.tsx';
import { Header } from './Header.tsx';
import { RankingPanel } from './RankingPanel.tsx';
import { Particles } from './Particles.tsx';
import { Disclaimer } from './Disclaimer.tsx';
import { TickChart } from './TickChart.tsx';
import { TitleScene } from './TitleScene.tsx';
import { ConclusionScene } from './ConclusionScene.tsx';
import { NewsScene } from './NewsScene.tsx';
import type { BloombergVideoProps, SectorTick } from './types.ts';

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

  const titleAudioFrames = inputProps.titleAudioFrames || 0;
  const contentAudioFrames = inputProps.contentAudioFrames || 0;
  const baseAnimationFrames = inputProps.baseAnimationFrames || totalFrames;
  const newsPages = inputProps.newsPages || [];
  const newsAudioFiles = inputProps.newsAudioFiles || [];
  const newsAudioFrames = inputProps.newsAudioFrames || [];
  const hasVoiceover = (inputProps.titleAudioFrames ?? 0) > 0 || newsPages.length > 0;

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

  const titleEnd = titleAudioFrames;
  const animEnd = titleAudioFrames + baseAnimationFrames;

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
        <TickAnimationScene
          {...sharedSceneProps}
          baseTotalFrames={totalFrames}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {titleAudioFrames > 0 && (
        <Sequence from={0} durationInFrames={titleAudioFrames}>
          <TitleScene
            titleText={inputProps.titleText || ''}
            titleAudioFile={inputProps.titleAudioFile || ''}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={titleAudioFrames}
          />
        </Sequence>
      )}

      <Sequence from={titleEnd} durationInFrames={baseAnimationFrames}>
        <TickAnimationScene
          {...sharedSceneProps}
          baseTotalFrames={baseAnimationFrames}
        />
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
          </Sequence>
        )
      ))}

      {contentAudioFrames > 0 && (
        <Sequence from={contentStart} durationInFrames={contentAudioFrames}>
          <ConclusionScene
            contentText={inputProps.contentText || ''}
            contentAudioFile={inputProps.contentAudioFile || ''}
            displayDate={displayDate}
            width={width}
            height={height}
            format={format}
            totalFrames={contentAudioFrames}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
