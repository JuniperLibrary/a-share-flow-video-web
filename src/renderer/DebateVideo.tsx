import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  getInputProps,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { DebateTurn, DebateAudioTurn, DebateSpeaker, DebatePhase } from './types.ts';
import { PersonaIcon } from '../components/debate/persona-icon';
import { PHASE_LABEL, PHASE_SUBTITLE } from '../components/debate/persona-config';

interface DebateVideoProps {
  taskId: string;
  moderatorName: string;
  bullName: string;
  bearName: string;
  sectorName: string;
  riskName: string;
  synthesizerName: string;
  stockName?: string;
  reportPeriod?: string;
  reportTitle: string;
  turns: DebateTurn[];
  audioTurns: DebateAudioTurn[];
  totalFrames: number;
  width: number;
  height: number;
  format: string;
}

const INTRO_FRAMES = 90;
const PHASE_TITLE_FRAMES = 30;

const COLORS: Record<DebateSpeaker, { primary: string; deep: string }> = {
  moderator: { primary: '#94a3b8', deep: '#475569' },
  bull: { primary: '#22d3ee', deep: '#0e7490' },
  bear: { primary: '#fbbf24', deep: '#b45309' },
  sector: { primary: '#34d399', deep: '#047857' },
  risk: { primary: '#fb923c', deep: '#c2410c' },
  synthesizer: { primary: '#a78bfa', deep: '#6d28d9' },
};

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

type Speaker = DebateSpeaker;
type Phase = DebatePhase;

function speakerName(speaker: Speaker, props: Partial<DebateVideoProps>): string {
  switch (speaker) {
    case 'moderator': return props.moderatorName ?? '主持人';
    case 'bull': return props.bullName ?? '乐观派';
    case 'bear': return props.bearName ?? '谨慎派';
    case 'sector': return props.sectorName ?? '行业专家';
    case 'risk': return props.riskName ?? '风控官';
    case 'synthesizer': return props.synthesizerName ?? '总结';
  }
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let current = '';
  for (const ch of text) {
    current += ch;
    if (current.length >= maxCharsPerLine) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface PhaseEntry {
  turnIdx: number;
  phase: Phase;
  startFrame: number;
}

function buildPhaseEntries(turns: DebateTurn[], startFrames: number[]): PhaseEntry[] {
  const out: PhaseEntry[] = [];
  let last: Phase | null = null;
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const p = t.phase;
    if (p && p !== last) {
      out.push({ turnIdx: i, phase: p, startFrame: startFrames[i] });
      last = p;
    }
  }
  return out;
}

export const DebateVideo: React.FC = () => {
  const { width, height, durationInFrames } = useVideoConfig();
  const inputProps = (getInputProps() ?? {}) as unknown as Partial<DebateVideoProps>;

  const reportTitle = inputProps.reportTitle ?? '财报辩论';
  const stockName = inputProps.stockName ?? '';
  const reportPeriod = inputProps.reportPeriod ?? '';
  const turns = inputProps.turns ?? [];
  const audioTurns = inputProps.audioTurns ?? [];
  const totalFrames = inputProps.totalFrames ?? durationInFrames;
  const format = inputProps.format ?? 'mobile';
  const isTV = format === 'tv';

  const startFrames: number[] = [];
  let acc = INTRO_FRAMES;
  for (const at of audioTurns) {
    startFrames.push(acc);
    acc += at.frames;
  }

  const phaseEntries = buildPhaseEntries(turns, startFrames);

  return (
    <AbsoluteFill style={{ background: '#060b1a', fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif', color: 'white', overflow: 'hidden' }}>
      {audioTurns.map((at, i) => (
        <Sequence key={`audio-${i}`} from={startFrames[i]}>
          <Audio src={staticFile(at.audioFile)} />
        </Sequence>
      ))}

      <Sequence from={0} durationInFrames={INTRO_FRAMES}>
        <TopicIntroCard
          stockName={stockName}
          reportPeriod={reportPeriod}
          reportTitle={reportTitle}
          width={width}
          height={height}
          isTV={isTV}
        />
      </Sequence>

      {phaseEntries.map((entry) => (
        <Sequence
          key={`phase-${entry.turnIdx}-${entry.phase}`}
          from={entry.startFrame}
          durationInFrames={PHASE_TITLE_FRAMES}
        >
          <PhaseTitleCard phase={entry.phase} width={width} height={height} isTV={isTV} />
        </Sequence>
      ))}

      {turns.map((turn, i) => {
        const color = COLORS[turn.speaker] ?? COLORS.moderator;
        const isModerator = turn.speaker === 'moderator';
        const turnFrames = audioTurns[i]?.frames ?? 90;
        return (
          <Sequence
            key={`turn-${i}`}
            from={startFrames[i]}
            durationInFrames={turnFrames}
          >
            <TurnGlow color={color} width={width} height={height} />
            <TopStrip
              title={reportTitle}
              turnIdx={i}
              totalTurns={turns.length}
              phase={turn.phase}
              isTV={isTV}
              width={width}
            />
            {isModerator ? (
              <ModeratorStage
                name={speakerName(turn.speaker, inputProps)}
                color={color}
                text={turn.text}
                turnFrames={turnFrames}
                isTV={isTV}
                width={width}
                height={height}
              />
            ) : (
              <SpeakerStage
                speaker={turn.speaker}
                name={speakerName(turn.speaker, inputProps)}
                color={color}
                text={turn.text}
                turnFrames={turnFrames}
                isTV={isTV}
                width={width}
                height={height}
              />
            )}
            <BottomStrip
              turnIdx={i}
              totalTurns={turns.length}
              speakers={turns.map((t) => t.speaker)}
              currentColor={color}
              isTV={isTV}
              width={width}
              height={height}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const TurnGlow: React.FC<{ color: { primary: string; deep: string }; width: number; height: number }> = ({ color, width, height }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.04) * 0.05 + 0.5;
  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: width * 0.5,
          top: height * drift,
          width: width * 1.4,
          height: width * 1.4,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${color.primary}26 0%, ${color.primary}0a 35%, transparent 70%)`,
          filter: 'blur(20px)',
          opacity: fadeIn,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: width * 0.5,
          top: height * 0.55,
          width,
          height: width * 0.4,
          transform: 'translateX(-50%)',
          background: `linear-gradient(180deg, transparent 0%, ${color.deep}1a 100%)`,
          opacity: fadeIn,
        }}
      />
    </>
  );
};

const TopStrip: React.FC<{
  title: string;
  turnIdx: number;
  totalTurns: number;
  phase: Phase | undefined;
  isTV: boolean;
  width: number;
}> = ({ title, turnIdx, totalTurns, phase, isTV, width }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const fontSize = isTV ? 28 : 36;
  const subSize = isTV ? 14 : 20;
  const padX = isTV ? 48 : 48;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: `${isTV ? 32 : 56}px ${padX}px`,
        opacity: fade,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: 700,
          color: '#e2e8f0',
          letterSpacing: 1,
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: subSize,
          color: '#64748b',
          fontWeight: 500,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}
      >
        {`${turnIdx + 1} / ${totalTurns} 轮`}
        {phase ? ` · ${PHASE_LABEL[phase] ?? phase}` : ''}
      </div>
    </div>
  );
};

const SpeakerStage: React.FC<{
  speaker: Speaker;
  name: string;
  color: { primary: string; deep: string };
  text: string;
  turnFrames: number;
  isTV: boolean;
  width: number;
  height: number;
}> = ({ speaker, name, color, text, turnFrames, isTV, width, height }) => {
  const frame = useCurrentFrame();

  const enterOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const enterY = interpolate(frame, [0, 18], [24, 0], { extrapolateRight: 'clamp', easing: EASE });
  const exitOpacity = interpolate(frame, [turnFrames - 12, turnFrames], [1, 0], { extrapolateRight: 'clamp' });

  const ringScale = 1 + Math.sin(frame * 0.15) * 0.04;
  const ringInnerScale = 1 + Math.sin(frame * 0.15 + 1) * 0.06;

  const avatarSize = isTV ? 140 : 200;
  const ringOuter = avatarSize * 1.5;
  const ringInner = avatarSize * 1.25;
  const nameSize = isTV ? 36 : 56;
  const quoteSize = isTV ? 32 : 64;
  const sidePad = isTV ? 80 : 60;

  const lines = wrapText(text, isTV ? 22 : 14);
  const revealWindow = Math.max(turnFrames - 18, 12);
  const charsShown = Math.min(text.length, Math.floor((frame / revealWindow) * text.length));

  const waveBars = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const phase = frame * 0.3 + i * 0.7;
    return 12 + Math.abs(Math.sin(phase)) * 22;
  });

  let consumed = 0;
  const visibleLines = lines.map((line) => {
    const lineStart = consumed;
    consumed += line.length;
    const visibleInLine = Math.max(0, Math.min(charsShown - lineStart, line.length));
    return line.slice(0, visibleInLine);
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: isTV ? 140 : 220,
        left: sidePad,
        right: sidePad,
        bottom: isTV ? 200 : 280,
        opacity: Math.min(enterOpacity, exitOpacity),
        transform: `translateY(${enterY}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: ringOuter,
          height: ringOuter,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isTV ? 16 : 28,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${color.primary}55`,
            transform: `scale(${ringInnerScale})`,
            boxShadow: `0 0 40px ${color.primary}66, inset 0 0 30px ${color.primary}33`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `3px solid ${color.primary}`,
            transform: `scale(${ringScale})`,
            boxShadow: `0 0 60px ${color.primary}aa`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color.primary}33 0%, transparent 60%)`,
            transform: `scale(${ringInnerScale})`,
          }}
        />
        <div
          style={{
            width: ringInner,
            height: ringInner,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PersonaIcon name={speaker} size={avatarSize} color={color.primary} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isTV ? 10 : 14,
          marginBottom: isTV ? 24 : 40,
        }}
      >
        <div
          style={{
            width: isTV ? 32 : 56,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${color.primary})`,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontSize: nameSize,
            fontWeight: 800,
            color: color.primary,
            letterSpacing: 4,
            textShadow: `0 0 20px ${color.primary}66`,
          }}
        >
          {name}
        </div>
        <div
          style={{
            width: isTV ? 32 : 56,
            height: 3,
            background: `linear-gradient(90deg, ${color.primary}, transparent)`,
            borderRadius: 2,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isTV ? 6 : 10,
          marginBottom: isTV ? 24 : 40,
          height: isTV ? 28 : 40,
        }}
      >
        {waveBars.map((h, i) => (
          <div
            key={i}
            style={{
              width: isTV ? 4 : 6,
              height: h,
              background: color.primary,
              borderRadius: 3,
              boxShadow: `0 0 8px ${color.primary}88`,
              opacity: enterOpacity,
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'relative',
          maxWidth: width - sidePad * 2,
          padding: isTV ? '20px 28px' : '32px 36px',
          background: `linear-gradient(135deg, ${color.primary}14 0%, transparent 100%)`,
          border: `1px solid ${color.primary}33`,
          borderRadius: isTV ? 12 : 20,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: isTV ? -16 : -24,
            left: isTV ? 20 : 28,
            fontSize: isTV ? 80 : 140,
            lineHeight: 1,
            color: color.primary,
            opacity: 0.5,
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
          }}
        >
          "
        </div>
        <p
          style={{
            fontSize: quoteSize,
            lineHeight: 1.5,
            color: '#f1f5f9',
            fontWeight: 600,
            margin: 0,
            textAlign: 'center',
            letterSpacing: 1,
            minHeight: `${lines.length * quoteSize * 1.5}px`,
          }}
        >
          {visibleLines.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < visibleLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  );
};

const ModeratorStage: React.FC<{
  name: string;
  color: { primary: string; deep: string };
  text: string;
  turnFrames: number;
  isTV: boolean;
  width: number;
  height: number;
}> = ({ name, color, text, turnFrames, isTV, width, height }) => {
  const frame = useCurrentFrame();

  const enterOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const enterY = interpolate(frame, [0, 18], [-12, 0], { extrapolateRight: 'clamp', easing: EASE });
  const exitOpacity = interpolate(frame, [turnFrames - 12, turnFrames], [1, 0], { extrapolateRight: 'clamp' });

  const avatarSize = isTV ? 90 : 120;
  const nameSize = isTV ? 28 : 42;
  const quoteSize = isTV ? 24 : 36;
  const topY = isTV ? 110 : 160;
  const sidePad = isTV ? 120 : 100;

  const lines = wrapText(text, isTV ? 28 : 18);
  const revealWindow = Math.max(turnFrames - 24, 12);
  const charsShown = Math.min(text.length, Math.floor((frame / revealWindow) * text.length));

  let consumed = 0;
  const visibleLines = lines.map((line) => {
    const lineStart = consumed;
    consumed += line.length;
    const visibleInLine = Math.max(0, Math.min(charsShown - lineStart, line.length));
    return line.slice(0, visibleInLine);
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: topY,
        left: sidePad,
        right: sidePad,
        opacity: Math.min(enterOpacity, exitOpacity),
        transform: `translateY(${enterY}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isTV ? 16 : 24,
          marginBottom: isTV ? 18 : 28,
        }}
      >
        <div
          style={{
            width: isTV ? 40 : 64,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color.primary})`,
          }}
        />
        <div
          style={{
            fontSize: isTV ? 12 : 16,
            fontWeight: 600,
            letterSpacing: isTV ? 4 : 6,
            color: color.primary,
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          主持 · {name}
        </div>
        <div
          style={{
            width: isTV ? 40 : 64,
            height: 2,
            background: `linear-gradient(90deg, ${color.primary}, transparent)`,
          }}
        />
      </div>

      <div style={{ marginBottom: isTV ? 16 : 24, opacity: 0.9 }}>
        <PersonaIcon name="moderator" size={avatarSize} color={color.primary} />
      </div>

      <p
        style={{
          fontSize: quoteSize,
          lineHeight: 1.55,
          color: '#cbd5e1',
          fontWeight: 500,
          margin: 0,
          letterSpacing: 1,
          maxWidth: width - sidePad * 2,
          minHeight: `${lines.length * quoteSize * 1.55}px`,
          fontStyle: 'italic',
        }}
      >
        {visibleLines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < visibleLines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
};

const BottomStrip: React.FC<{
  turnIdx: number;
  totalTurns: number;
  speakers: Speaker[];
  currentColor: { primary: string; deep: string };
  isTV: boolean;
  width: number;
  height: number;
}> = ({ turnIdx, totalTurns, speakers, currentColor, isTV, width }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const dotSize = isTV ? 10 : 14;
  const dotGap = isTV ? 10 : 16;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: `${isTV ? 40 : 60}px ${isTV ? 60 : 60}px`,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isTV ? 20 : 28,
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isTV ? 12 : 18,
          padding: isTV ? '8px 16px' : '14px 24px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${currentColor.primary}33`,
          borderRadius: 100,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            fontSize: isTV ? 10 : 14,
            color: '#64748b',
            letterSpacing: 2,
            fontWeight: 500,
          }}
        >
          当前发言
        </div>
        <div
          style={{
            width: isTV ? 8 : 12,
            height: isTV ? 8 : 12,
            borderRadius: '50%',
            background: currentColor.primary,
            boxShadow: `0 0 8px ${currentColor.primary}`,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: dotGap,
        }}
      >
        {speakers.map((sp, i) => {
          const isPast = i < turnIdx;
          const isCurrent = i === turnIdx;
          const color = isCurrent
            ? currentColor.primary
            : isPast
              ? (COLORS[sp]?.primary ?? COLORS.moderator.primary)
              : '#1e293b';
          return (
            <div
              key={i}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: color,
                boxShadow: isCurrent ? `0 0 12px ${color}` : 'none',
                opacity: isPast ? 0.7 : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const PhaseTitleCard: React.FC<{ phase: Phase; width: number; height: number; isTV: boolean }> = ({ phase, width, height, isTV }) => {
  const frame = useCurrentFrame();
  const opacityIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const opacityHold = 1;
  const opacityOut = interpolate(frame, [22, 30], [1, 0], { extrapolateRight: 'clamp', easing: EASE });
  const opacity = Math.min(opacityIn, opacityHold) * (frame > 22 ? opacityOut : 1);
  const y = interpolate(frame, [0, 12], [12, 0], { extrapolateRight: 'clamp', easing: EASE });

  return (
    <div
      style={{
        position: 'absolute',
        top: isTV ? '38%' : '34%',
        left: 0,
        right: 0,
        opacity,
        transform: `translateY(${y}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: isTV ? 14 : 18,
          fontWeight: 500,
          color: '#64748b',
          letterSpacing: 8,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        SCRIPT
      </div>
      <div
        style={{
          position: 'relative',
          padding: isTV ? '12px 36px' : '20px 56px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.4), transparent)',
            transform: 'translateY(-50%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontSize: isTV ? 56 : 96,
            fontWeight: 800,
            color: '#e2e8f0',
            letterSpacing: 12,
            textAlign: 'center',
            textShadow: '0 0 40px rgba(0, 212, 255, 0.4)',
          }}
        >
          {PHASE_LABEL[phase]}
        </div>
      </div>
      <div
        style={{
          fontSize: isTV ? 16 : 22,
          color: '#94a3b8',
          letterSpacing: 2,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        {PHASE_SUBTITLE[phase]}
      </div>
    </div>
  );
};

const TopicIntroCard: React.FC<{
  stockName: string;
  reportPeriod: string;
  reportTitle: string;
  width: number;
  height: number;
  isTV: boolean;
}> = ({ stockName, reportPeriod, reportTitle, width, height, isTV }) => {
  const frame = useCurrentFrame();

  const opacityIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const opacityHold = 1;
  const opacityOut = interpolate(frame, [INTRO_FRAMES - 20, INTRO_FRAMES], [1, 0], { extrapolateRight: 'clamp', easing: EASE });
  const opacity = Math.min(opacityIn, opacityHold) * (frame > INTRO_FRAMES - 20 ? opacityOut : 1);

  const titleY = interpolate(frame, [0, 24], [30, 0], { extrapolateRight: 'clamp', easing: EASE });
  const lineScale = interpolate(frame, [10, 28], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const subY = interpolate(frame, [16, 36], [20, 0], { extrapolateRight: 'clamp', easing: EASE });

  const bubble1Y = Math.sin(frame * 0.02) * 8;
  const bubble2Y = Math.sin(frame * 0.025 + 1.5) * 12;
  const bubble3Y = Math.sin(frame * 0.02 + 3) * 6;

  const accentColor = '#22d3ee';

  return (
    <AbsoluteFill style={{ background: '#060b1a' }}>
      <div
        style={{
          position: 'absolute',
          left: width * 0.5,
          top: height * 0.35,
          width: width * 1.2,
          height: width * 1.2,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 60%)`,
          filter: 'blur(40px)',
          opacity: opacityIn,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: width * 0.2 + bubble1Y,
          bottom: '25%',
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: `${accentColor}33`,
          opacity: 0.3 + Math.sin(frame * 0.03) * 0.15,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '30%',
          top: '20%',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: `${accentColor}22`,
          opacity: 0.2 + Math.sin(frame * 0.04 + 1) * 0.1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '35%',
          top: '60%',
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: `${accentColor}44`,
          opacity: 0.2 + Math.sin(frame * 0.035 + 2) * 0.1,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: isTV ? '30%' : '28%',
          left: 0,
          right: 0,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: isTV ? 64 : 96,
            fontWeight: 800,
            color: '#f1f5f9',
            letterSpacing: isTV ? 6 : 8,
            transform: `translateY(${titleY}px)`,
            textShadow: `0 0 60px ${accentColor}33`,
            marginBottom: isTV ? 16 : 24,
          }}
        >
          {stockName || '财报辩论'}
        </div>

        {reportPeriod && (
          <div
            style={{
              fontSize: isTV ? 18 : 28,
              fontWeight: 500,
              color: '#94a3b8',
              letterSpacing: isTV ? 4 : 6,
              transform: `translateY(${subY}px)`,
              marginBottom: isTV ? 24 : 40,
            }}
          >
            {reportPeriod}
          </div>
        )}

        <div
          style={{
            width: isTV ? 0 : 80,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            transform: `scaleX(${lineScale})`,
            marginBottom: isTV ? 20 : 36,
            opacity: 0.7,
          }}
        />

        <div
          style={{
            fontSize: isTV ? 20 : 32,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: isTV ? 8 : 12,
            transform: `translateY(${subY}px)`,
            textShadow: `0 0 30px ${accentColor}44`,
          }}
        >
          多空辩论
        </div>

        <div
          style={{
            fontSize: isTV ? 13 : 18,
            color: '#64748b',
            letterSpacing: 3,
            marginTop: isTV ? 10 : 16,
            transform: `translateY(${subY}px)`,
          }}
        >
          财报多视角 · 数据攻防
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default DebateVideo;
