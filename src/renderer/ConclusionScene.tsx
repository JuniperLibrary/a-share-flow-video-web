import React from 'react';
import { useCurrentFrame, Audio, staticFile } from 'remotion';
import { Background } from './Background.tsx';

interface ConclusionSceneProps {
  contentText: string;
  contentAudioFile: string;
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  totalFrames: number;
}

export const ConclusionScene: React.FC<ConclusionSceneProps> = ({
  contentText,
  contentAudioFile,
  displayDate,
  width,
  height,
  format,
  totalFrames,
}) => {
  const frame = useCurrentFrame();
  const isTV = format === 'tv';

  const fadeIn = Math.min(1, frame / 15);

  return (
    <>
      <Audio src={staticFile(contentAudioFile)} />
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
          padding: '0 50px',
        }}
      >
        <div
          style={{
            fontSize: isTV ? 28 : 38,
            fontWeight: 500,
            color: '#e0e8f0',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            textAlign: 'center',
            lineHeight: 1.6,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          关注我
        </div>
        <div
          style={{
            marginTop: isTV ? 16 : 20,
            fontSize: isTV ? 18 : 24,
            color: '#8899aa',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
          }}
        >
          每天看主力动向
        </div>
        <div
          style={{
            marginTop: isTV ? 40 : 56,
            fontSize: isTV ? 14 : 16,
            color: '#667788',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 2,
            opacity: Math.min(1, Math.max(0, (frame - 20) / 10)),
          }}
        >
          {displayDate}
        </div>
      </div>
    </>
  );
};
