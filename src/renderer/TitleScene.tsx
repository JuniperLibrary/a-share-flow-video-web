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

  const fadeIn = Math.min(1, frame / 20);
  const titleSlide = spring({ frame, fps: 30, config: { damping: 15, stiffness: 80 } });

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
          opacity: fadeIn,
        }}
      >
        <div
          style={{
            fontSize: isTV ? 20 : 28,
            color: '#4a80d0',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 6,
            marginBottom: isTV ? 16 : 24,
            opacity: fadeIn * 0.8,
          }}
        >
          {displayDate} · A股复盘报告
        </div>
        <div
          style={{
            fontSize: isTV ? 42 : 56,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            textAlign: 'center',
            lineHeight: 1.4,
            padding: '0 60px',
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            transform: `translateY(${(1 - titleSlide) * 20}px)`,
          }}
        >
          {titleText}
        </div>
        <div
          style={{
            marginTop: isTV ? 24 : 32,
            fontSize: isTV ? 16 : 20,
            color: '#8899aa',
            fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif',
            letterSpacing: 3,
          }}
        >
          资金不会说谎，主线都会留下痕迹
        </div>
      </div>
    </>
  );
};
