import { Composition } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { BloombergVideo } from './BloombergVideo.tsx';
import { BloombergVideoTick } from './BloombergVideoTick.tsx';
import { MultiDayVideo } from './MultiDayVideo.tsx';
import { DebateVideo } from './DebateVideo.tsx';

const tickCalculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = ({ props }) => {
  const total = props.totalFrames as number | undefined;
  if (typeof total === 'number' && total > 0) {
    return { durationInFrames: total };
  }

  const toNum = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const toNumArray = (v: unknown) => (Array.isArray(v) ? v.map(toNum) : []);

  const scene1 = toNum(props.scene1Frames);
  const scene2 = toNum(props.scene2Frames);
  const scene3 = toNum(props.scene3Frames);
  const scene4 = toNum(props.scene4Frames);
  const scene5 = toNum(props.scene5Frames);
  const baseAnimationFrames = toNum(props.baseAnimationFrames);
  const newsAudioFrames = toNumArray(props.newsAudioFrames);
  const sectorTicks = Array.isArray(props.sectorTicks) ? props.sectorTicks : [];
  const mainStructureFramesFromProps = toNum(props.mainStructureFrames);

  const hasVoiceover = scene1 > 0 || newsAudioFrames.some((x) => x > 0);
  if (!hasVoiceover) {
    const fallback = baseAnimationFrames > 0 ? baseAnimationFrames : 2700;
    return { durationInFrames: fallback };
  }

  const scene5End = scene1 + scene2 + scene3 + scene4 + scene5;
  const animEnd = scene5End + baseAnimationFrames;
  const newsTotal = newsAudioFrames.reduce((sum, x) => sum + x, 0);
  const mainStructureFrames = sectorTicks.length > 0 ? (mainStructureFramesFromProps > 0 ? mainStructureFramesFromProps : 90) : 0;

  const computed = animEnd + newsTotal + mainStructureFrames;
  return { durationInFrames: computed > 0 ? computed : 2700 };
};

const videoCalculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = ({ props }) => {
  const total = props.totalFrames as number | undefined;
  if (typeof total === 'number' && total > 0) {
    return { durationInFrames: total };
  }
  return { durationInFrames: 6000 };
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="BloombergVideo"
        component={BloombergVideo}
        durationInFrames={6000}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={videoCalculateMetadata}
        defaultProps={{
          dateStr: '2026-05-11',
          displayDate: '05-11',
          sectors: [],
          timelineEvents: [],
          tickerItems: [],
          events: [],
          format: 'mobile',
          width: 1080,
          height: 1920,
        }}
      />
      <Composition
        id="BloombergVideoTV"
        component={BloombergVideo}
        durationInFrames={6000}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={videoCalculateMetadata}
        defaultProps={{
          dateStr: '2026-05-11',
          displayDate: '05-11',
          sectors: [],
          timelineEvents: [],
          tickerItems: [],
          events: [],
          format: 'tv',
          width: 1920,
          height: 1080,
        }}
      />
      <Composition
        id="BloombergVideo3DayTV"
        component={MultiDayVideo}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          dates: [],
          fullDates: [],
          snapshots: [],
          analysis: { trendInsights: [], rankingChanges: [], summaryText: { title: '', content: '', key_sectors: [] }, tickerItems: [] },
          format: 'tv',
          width: 1920,
          height: 1080,
          totalFrames: 2700,
        }}
      />
      <Composition
        id="BloombergVideoTick"
        component={BloombergVideoTick}
        durationInFrames={2700}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={tickCalculateMetadata}
        defaultProps={{
          dateStr: '2026-05-11',
          displayDate: '05-11',
          sectorTicks: [],
          timelineEvents: [],
          tickerItems: [],
          events: [],
          format: 'mobile',
          width: 1080,
          height: 1920,
        }}
      />
      <Composition
        id="BloombergVideoTickTV"
        component={BloombergVideoTick}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={tickCalculateMetadata}
        defaultProps={{
          dateStr: '2026-05-11',
          displayDate: '05-11',
          sectorTicks: [],
          timelineEvents: [],
          tickerItems: [],
          events: [],
          format: 'tv',
          width: 1920,
          height: 1080,
        }}
      />
      <Composition
        id="DebateVideo"
        component={DebateVideo}
        durationInFrames={2700}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={videoCalculateMetadata}
        defaultProps={{
          taskId: 'preview',
          bullName: '乐观派',
          bearName: '谨慎派',
          reportTitle: '财报辩论',
          turns: [],
          audioTurns: [],
          totalFrames: 2700,
          width: 1080,
          height: 1920,
          format: 'mobile',
        }}
      />
    </>
  );
};
