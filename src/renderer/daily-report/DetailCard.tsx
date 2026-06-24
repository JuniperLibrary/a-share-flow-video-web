import React from 'react';
import { ReportCard, toneColor, valueColor } from './types';

const WIDTH = 1080;
const HEIGHT = 1920;

interface DetailCardProps {
  card: ReportCard;
  themeTone: 'up' | 'down' | 'neutral';
}

/** 详情卡片：资金数据、领涨板块、要点解读 */
export const DetailCard: React.FC<DetailCardProps> = ({ card, themeTone }) => {
  const tc = toneColor(themeTone);

  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        background: 'linear-gradient(180deg, #0a0f18 0%, #111927 50%, #0d1520 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
        padding: '60px 50px',
      }}
    >
      {/* Tag badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: '4px 16px',
            borderRadius: 4,
            backgroundColor: `${tc}15`,
            border: `1px solid ${tc}33`,
            fontSize: 16,
            color: tc,
            fontWeight: 600,
            letterSpacing: 2,
          }}
        >
          {card.tag}
        </div>
        <div style={{ color: '#556677', fontSize: 14, letterSpacing: 1 }}>
          {card.index}/{card.total}
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 38,
          fontWeight: 700,
          color: '#ffffff',
          lineHeight: 1.3,
          letterSpacing: 3,
          marginBottom: 10,
        }}
      >
        {card.title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 18,
          color: '#8899aa',
          letterSpacing: 2,
          lineHeight: 1.5,
          marginBottom: 30,
          paddingBottom: 20,
          borderBottom: '1px solid rgba(42,53,80,0.5)',
        }}
      >
        {card.subtitle}
      </div>

      {/* Metrics row */}
      {card.metrics.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 30 }}>
          {card.metrics.map((m, i) => (
            <div
              key={i}
              style={{
                flex: '1 0 calc(50% - 6px)',
                background: 'linear-gradient(135deg, rgba(20,30,50,0.5) 0%, rgba(15,22,36,0.5) 100%)',
                borderRadius: 10,
                border: '1px solid rgba(60,80,120,0.2)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ color: '#6a7a8a', fontSize: 14, letterSpacing: 1 }}>{m.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: valueColor(m.value), fontSize: 30, fontWeight: 700 }}>{m.value}</span>
                <span style={{ color: m.tone ? toneColor(m.tone) : '#8899aa', fontSize: 16 }}>{m.note}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Highlights */}
      {card.highlights.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#6a7a8a', fontSize: 15, letterSpacing: 2, marginBottom: 10 }}>领涨 / 活跃</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {card.highlights.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: 'rgba(20,30,50,0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: h.tone ? toneColor(h.tone) : '#556677',
                    }}
                  />
                  <span style={{ color: '#e0e0e0', fontSize: 18, fontWeight: 500 }}>{h.title}</span>
                </div>
                <span
                  style={{
                    color: h.tone ? toneColor(h.tone) : '#8899aa',
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  {h.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bullets */}
      {card.bullets.length > 0 && (
        <div style={{ flex: 1 }}>
          <div style={{ color: '#6a7a8a', fontSize: 15, letterSpacing: 2, marginBottom: 10 }}>深度解读</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {card.bullets.map((b, i) => (
              <div key={i}>
                <div style={{ color: tc, fontSize: 16, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
                  ▸ {b.title}
                </div>
                <div style={{ color: '#b0b8c8', fontSize: 16, lineHeight: 1.6, paddingLeft: 16 }}>
                  {b.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(42,53,80,0.4)',
          color: '#4a5a6a',
          fontSize: 14,
          textAlign: 'center',
          letterSpacing: 2,
        }}
      >
        {card.footer || '市场有风险，投资需谨慎'}
      </div>
    </div>
  );
};
