import React from 'react';
import { useCurrentFrame, Audio, staticFile } from 'remotion';
import { Background } from './Background.tsx';

interface NarrativeSceneProps {
  sceneText: string;
  audioFile: string;
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  totalFrames: number;
  sceneType: 'hook1' | 'suspense' | 'twist' | 'answer' | 'hook2';
}

const SCENE_CONFIG = {
  hook1: {
    color: '#ff6b6b',
    subtitle: '今天有个反常现象',
    fontSize: { mobile: 64, tv: 50 },
  },
  suspense: {
    color: '#feca57',
    subtitle: '为什么会出现这种情况？',
    fontSize: { mobile: 48, tv: 38 },
  },
  twist: {
    color: '#48dbfb',
    subtitle: '更离谱的是...',
    fontSize: { mobile: 50, tv: 40 },
  },
  answer: {
    color: '#1dd1a1',
    subtitle: '真相是...',
    fontSize: { mobile: 46, tv: 36 },
  },
  hook2: {
    color: '#ff9ff3',
    subtitle: '明天会怎样？',
    fontSize: { mobile: 52, tv: 42 },
  },
};

export const NarrativeScene: React.FC<NarrativeSceneProps> = ({
  sceneText,
  audioFile,
  displayDate,
  width,
  height,
  format,
  totalFrames,
  sceneType,
}) => {
  const frame = useCurrentFrame();
  const isTV = format === 'tv';
  const config = SCENE_CONFIG[sceneType];

  const isFirstHook = sceneType === 'hook1';
  const fadeIn = isFirstHook ? 1 : Math.min(1, frame / 15);
  const fadeOut = Math.min(1, (totalFrames - frame) / 3);
  const opacity = fadeIn * fadeOut;
  const textSlide = isFirstHook ? 1 : Math.min(1, Math.max(0, (frame - 10) / 20));
  const subtitleOpacity = isFirstHook ? 1 : Math.min(1, Math.max(0, (frame - 20) / 15));

  return (
    <>
      {audioFile && <Audio src={staticFile(audioFile)} />}
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
          padding: '0 60px',
        }}
      >
        <div
          style={{
            fontSize: isTV ? 24 : 30,
            color: config.color,
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 4,
            marginBottom: isTV ? 24 : 32,
            opacity: subtitleOpacity * fadeOut,
            fontWeight: 600,
          }}
        >
          {config.subtitle}
        </div>
        <div
          style={{
            fontSize: isTV ? config.fontSize.tv : config.fontSize.mobile,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            textAlign: 'center',
            lineHeight: 1.4,
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            opacity: opacity,
            transform: `translateY(${(1 - textSlide) * 30}px)`,
          }}
        >
          {sceneText}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: isTV ? 40 : 60,
            fontSize: isTV ? 14 : 16,
            color: '#667788',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 2,
            opacity: Math.min(1, Math.max(0, (frame - 30) / 10)) * fadeOut,
          }}
        >
          {displayDate}
        </div>
      </div>
    </>
  );
};
