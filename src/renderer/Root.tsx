import { Composition } from 'remotion';
import { BloombergVideo } from './BloombergVideo.tsx';
import { BloombergVideoTick } from './BloombergVideoTick.tsx';
import { MultiDayVideo } from './MultiDayVideo.tsx';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="BloombergVideoTV"
        component={BloombergVideo}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
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
        durationInFrames={1800}
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
          totalFrames: 1800,
        }}
      />
      <Composition
        id="BloombergVideoTickTV"
        component={BloombergVideoTick}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
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
    </>
  );
};
