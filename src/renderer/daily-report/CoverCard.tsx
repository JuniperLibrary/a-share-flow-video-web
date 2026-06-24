import React from 'react';
import { ThematicCard, getThemeTone, toneColor, formatNet } from './types';

const WIDTH = 1080;
const HEIGHT = 1920;

interface CoverCardProps {
  card: ThematicCard;
  date: string;
  netTotal: number;
  inflowCount: number;
  outflowCount: number;
}

/** 封面卡片：大标题 + 核心数据摘要 */
export const CoverCard: React.FC<CoverCardProps> = ({ card, date, netTotal, inflowCount, outflowCount }) => {
  const tone = getThemeTone(card.theme);
  const tc = toneColor(tone);
  const dir = netTotal >= 0 ? '净流入' : '净流出';

  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        background: 'linear-gradient(180deg, #0a0f18 0%, #141b2b 50%, #0d1520 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
      }}
    >
      {/* Top date bar */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ color: '#4a80d0', fontSize: 24, fontWeight: 600, letterSpacing: 4 }}>
          A 股收盘快报
        </div>
        <div style={{ color: '#8899aa', fontSize: 22, fontWeight: 500 }}>
          {date}
        </div>
      </div>

      {/* Decorative gradient line */}
      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 60,
          right: 60,
          height: 1,
          background: 'linear-gradient(90deg, transparent, #2a3550, transparent)',
        }}
      />

      {/* Theme title */}
      <div style={{ textAlign: 'center', marginTop: -80, padding: '0 60px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '6px 24px',
            borderRadius: 20,
            border: `1px solid ${tc}44`,
            backgroundColor: `${tc}11`,
            fontSize: 18,
            color: tc,
            fontWeight: 500,
            letterSpacing: 3,
            marginBottom: 30,
          }}
        >
          {card.theme}
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.3,
            letterSpacing: 3,
            textShadow: `0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          {card.summary}
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            color: '#8899aa',
            letterSpacing: 2,
            lineHeight: 1.6,
          }}
        >
          {card.timeHorizon} · 确信度 {Math.round(card.conviction * 100)}%
        </div>
      </div>

      {/* Key metrics */}
      <div
        style={{
          display: 'flex',
          gap: 30,
          marginTop: 80,
          padding: '0 60px',
        }}
      >
        <MetricBox label="全市场" value={formatNet(netTotal)} note={`${dir}`} tone={tone} />
        <MetricBox label="流入板块" value={`${inflowCount}`} note={`流出 ${outflowCount}`} tone="neutral" />
        <MetricBox label="风格" value={dir} note={netTotal > 100 ? '资金充沛' : netTotal < -100 ? '资金承压' : '窄幅波动'} tone={tone} />
      </div>

      {/* Conviction bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 60,
          right: 60,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#556677', fontSize: 14, letterSpacing: 2 }}>
          <span>AI 确信度</span>
          <span>{Math.round(card.conviction * 100)}%</span>
        </div>
        <div style={{ height: 4, background: '#1a2538', borderRadius: 2 }}>
          <div
            style={{
              width: `${card.conviction * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${tc}66, ${tc})`,
              borderRadius: 2,
              transition: 'width 0.5s',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 60,
          right: 60,
          textAlign: 'center',
          color: '#3a4a5a',
          fontSize: 14,
          letterSpacing: 2,
        }}
      >
        市场有风险，投资需谨慎
      </div>
    </div>
  );
};

const MetricBox: React.FC<{ label: string; value: string; note: string; tone: 'up' | 'down' | 'neutral' }> = ({
  label, value, note, tone,
}) => {
  const tc = toneColor(tone);
  return (
    <div
      style={{
        flex: 1,
        background: 'linear-gradient(180deg, rgba(20,30,50,0.6) 0%, rgba(15,22,36,0.6) 100%)',
        borderRadius: 12,
        border: '1px solid rgba(60,80,120,0.2)',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div style={{ color: '#8899aa', fontSize: 14, letterSpacing: 2 }}>{label}</div>
      <div style={{ color: tc, fontSize: 36, fontWeight: 700, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
        {value}
      </div>
      <div style={{ color: '#5a6a7a', fontSize: 13 }}>{note}</div>
    </div>
  );
};
