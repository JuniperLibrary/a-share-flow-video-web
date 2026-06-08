import React from 'react';
import { useCurrentFrame, Audio, staticFile, spring } from 'remotion';
import { Background } from './Background.tsx';

interface TitleSceneProps {
  titleText: string;
  titleAudioFile: string;
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  totalFrames: number;
}

export const TitleScene: React.FC<TitleSceneProps> = ({
  titleText,
  titleAudioFile,
  displayDate,
  width,
  height,
  format,
  totalFrames,
}) => {
  const frame = useCurrentFrame();
  const isTV = format === 'tv';

  const dateOpacity = Math.min(1, Math.max(0, (frame - 3) / 10));
  const hookOpacity = Math.min(1, Math.max(0, (frame - 8) / 12));
  const bottomOpacity = Math.min(1, Math.max(0, (frame - 15) / 10));

  return (
    <>
      <Audio src={staticFile(titleAudioFile)} />
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
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontSize: isTV ? 22 : 30,
            color: '#4a80d0',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 6,
            marginBottom: isTV ? 20 : 28,
            opacity: dateOpacity,
          }}
        >
          {displayDate}
        </div>
        <div
          style={{
            fontSize: isTV ? 44 : 60,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            textAlign: 'center',
            lineHeight: 1.3,
            padding: '0 50px',
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            opacity: hookOpacity,
          }}
        >
          {titleText}
        </div>
        <div
          style={{
            marginTop: isTV ? 28 : 40,
            fontSize: isTV ? 16 : 20,
            color: '#8899aa',
            fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif',
            letterSpacing: 3,
            opacity: bottomOpacity,
          }}
        >
          资金流向实录
        </div>
      </div>
    </>
  );
};
