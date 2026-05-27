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

  const fadeIn = Math.min(1, frame / 25);
  const lines = contentText.split(/[。！？\n]+/).filter((l) => l.trim().length > 0);

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
          padding: '0 60px',
        }}
      >
        <div
          style={{
            fontSize: isTV ? 18 : 24,
            color: '#4a80d0',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 4,
            marginBottom: isTV ? 20 : 30,
          }}
        >
          板块复盘总结
        </div>
        <div
          style={{
            fontSize: isTV ? 28 : 36,
            fontWeight: 500,
            color: '#e0e8f0',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            textAlign: 'center',
            lineHeight: 1.7,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                opacity: Math.min(1, Math.max(0, (frame - i * 15) / 15)),
                transform: `translateY(${Math.max(0, (1 - Math.min(1, (frame - i * 15) / 15)) * 15)}px)`,
                marginBottom: 8,
              }}
            >
              {line.trim()}
              {['。', '！', '？'].some((p) => line.endsWith(p)) ? '' : '。'}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: isTV ? 30 : 40,
            fontSize: isTV ? 14 : 18,
            color: '#667788',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 2,
          }}
        >
          数据仅供分析参考 · 不构成投资建议
        </div>
      </div>
    </>
  );
};
