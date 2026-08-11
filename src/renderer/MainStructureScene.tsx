import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Background } from './Background.tsx';
import type { SectorTick, MainStructureResult } from './types.ts';

interface MainStructureSceneProps {
  sectorTicks: SectorTick[];
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  totalFrames: number;
  mainStructureResult?: MainStructureResult;
}

const fontFamily = '"PingFang SC", "Helvetica Neue", sans-serif';
const monoFamily = '"Helvetica Neue", Arial, sans-serif';

const isValidNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const formatSignedYi = (v: unknown) => {
  if (!isValidNumber(v)) return '--';
  if (v === 0) return '0.0亿';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}亿`;
};

const formatAbsYi = (v: unknown) => {
  if (!isValidNumber(v)) return '--';
  return `${Math.abs(v).toFixed(1)}亿`;
};

const formatPct0 = (v: unknown) => {
  if (!isValidNumber(v)) return '--';
  return `${(v * 100).toFixed(0)}%`;
};

const shortText = (text: string, max: number) => {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

const clampText = (text: string, hardLimit: number) => {
  if (!text) return '';
  if (text.length <= hardLimit) return text;
  return `${text.slice(0, hardLimit - 1)}…`;
};

const priorityColor = (p?: string) => {
  if (p === 'high') return { bg: '#ef4444', glow: '#ef444488', text: '#fff1f2', label: '优先' };
  if (p === 'medium') return { bg: '#f59e0b', glow: '#f59e0b88', text: '#fffbeb', label: '次位' };
  return { bg: '#3b82f6', glow: '#3b82f688', text: '#eff6ff', label: '观察' };
};

export const MainStructureScene: React.FC<MainStructureSceneProps> = ({
  sectorTicks,
  displayDate,
  width,
  height,
  format,
  totalFrames,
  mainStructureResult,
}) => {
  const frame = useCurrentFrame();
  const isTV = format === 'tv';

  const top = React.useMemo(() => {
    if (sectorTicks.length === 0) return null;
    return [...sectorTicks].sort(
      (a, b) =>
        Math.abs(b.data.reduce((x, y) => x + y, 0)) -
        Math.abs(a.data.reduce((x, y) => x + y, 0)),
    )[0];
  }, [sectorTicks]);

  const stats = React.useMemo(() => {
    if (sectorTicks.length === 0) return null;
    const rows = sectorTicks.map((s) => ({ ...s, net: s.data.reduce((x, y) => x + y, 0) }));
    const inflows = rows.filter((s) => s.net > 0).sort((a, b) => b.net - a.net);
    const outflows = rows.filter((s) => s.net < 0).sort((a, b) => a.net - b.net);
    const totalInflow = inflows.reduce((sum, s) => sum + s.net, 0);
    const totalOutflowAbs = outflows.reduce((sum, s) => sum + Math.abs(s.net), 0);
    const totalNet = rows.reduce((sum, s) => sum + s.net, 0);
    const topInflow = inflows[0];
    const top2Inflow = inflows[1];
    const topOutflow = outflows[0];
    const top1Share = topInflow && totalInflow > 0 ? topInflow.net / totalInflow : null;
    const top2Share =
      topInflow && totalInflow > 0 ? (topInflow.net + (top2Inflow?.net ?? 0)) / totalInflow : null;
    const topOutflowShare =
      topOutflow && totalOutflowAbs > 0 ? Math.abs(topOutflow.net) / totalOutflowAbs : null;

    return {
      inflows,
      outflows,
      topInflow,
      topOutflow,
      totalInflow,
      totalOutflowAbs,
      totalNet,
      top1Share,
      top2Share,
      topOutflowShare,
    };
  }, [sectorTicks]);

  if (!top || !stats) return null;

  const fadeIn = Math.min(1, frame / 16);
  const fadeOut = Math.min(1, Math.max(0, (totalFrames - 1 - frame) / 12));
  const opacity = fadeIn * fadeOut;
  const numberProgress = Math.min(1, Math.max(0, (frame - 14) / 30));
  const leader = stats.topInflow ?? null;
  const pressure = stats.topOutflow ?? null;
  const targetRateRaw = leader?.mainRate ?? top.mainRate ?? top.rate ?? 0;
  const targetRate = isValidNumber(targetRateRaw) ? targetRateRaw : 0;
  const displayRate = targetRate * numberProgress;
  const isPositive = stats.totalNet >= 0;
  const accentColor = isPositive ? '#f87171' : '#4ade80';
  const leaderShareText = stats.top1Share !== null ? formatPct0(stats.top1Share) : '--';
  const leader2ShareText = stats.top2Share !== null ? formatPct0(stats.top2Share) : '--';
  const riskShareText = stats.topOutflowShare !== null ? formatPct0(stats.topOutflowShare) : '--';

  const superWRaw = leader?.superNet ?? top.superNet;
  const bigWRaw = leader?.bigNet ?? top.bigNet;
  const superDir = isValidNumber(superWRaw) ? (superWRaw > 0 ? '流入' : superWRaw < 0 ? '流出' : '中性') : null;
  const bigDir = isValidNumber(bigWRaw) ? (bigWRaw > 0 ? '流入' : bigWRaw < 0 ? '流出' : '中性') : null;
  const resonance =
    superDir && bigDir
      ? superDir === bigDir
        ? `共振${superDir}`
        : '结构分化'
      : superDir || bigDir
        ? `${superDir ?? bigDir}主导`
        : '--';

  const conclusion = mainStructureResult?.conclusion
    ? mainStructureResult.conclusion
    : leader && leader.net > 0
      ? `${leader.name}成为主线，净流入${formatAbsYi(leader.net)}`
      : pressure
        ? `${pressure.name}承压，净流出${formatAbsYi(pressure.net)}`
        : '主线不明显，资金偏震荡';

  const concentration = mainStructureResult?.concentration
    ? mainStructureResult.concentration
    : stats.top1Share !== null && stats.top1Share >= 0.5
      ? `高度集中，Top1占${leaderShareText}`
      : stats.inflows.length >= 6 && (stats.top1Share ?? 1) <= 0.35
        ? `明显扩散，Top2占${leader2ShareText}`
        : `结构分歧，Top2占${leader2ShareText}`;

  const riskText = mainStructureResult?.risk
    ? mainStructureResult.risk
    : pressure
      ? `${pressure.name}净流出${formatAbsYi(pressure.net)}`
      : '流出压力不突出';

  const structureText = mainStructureResult?.structure
    ? mainStructureResult.structure
    : `${resonance}，超大单${formatSignedYi(superWRaw)}`;

  const signalText = mainStructureResult?.signal
    ? mainStructureResult.signal
    : leader
      ? `${leader.name}资金占优`
      : '资金等待新方向';

  const outlook = mainStructureResult?.outlook
    ? mainStructureResult.outlook
    : leader
      ? `明日盯${leader.name}延续，观察${pressure?.name ?? '流出侧'}是否收敛`
      : '明日等待流出收敛与新主线回流';

  const actions = mainStructureResult?.actions && (mainStructureResult?.actions?.length ?? 0) > 0
    ? mainStructureResult!.actions!
    : mainStructureResult?.action
      ? [{ priority: 'high' as const, text: mainStructureResult.action }]
      : leader
        ? [{ priority: 'high' as const, text: `盯${leader.name}延续` }, { priority: 'medium' as const, text: pressure ? `看${pressure.name}流出收敛` : '看流出侧收敛' }]
        : [];

  const recapLine = (mainStructureResult?.recap && mainStructureResult?.highlight)
    ? `${mainStructureResult.recap}，${mainStructureResult.highlight}`
    : '';
  const planIntro = mainStructureResult?.plan_intro ?? '';
  const planActions = mainStructureResult?.plan_actions ?? '';

  const sidePadding = isTV ? 72 : 54;
  const verticalPadding = isTV ? 54 : 82;
  const contentWidth = width - sidePadding * 2;
  const gap = isTV ? 22 : 18;
  const titleSize = isTV ? 26 : 34;
  const conclusionSize = isTV ? 42 : 50;
  const cardTextSize = isTV ? 22 : 28;
  const metaMaxTV = isTV ? 42 : 40;
  const titleMaxTV = isTV ? 30 : 34;

  const metricItems = [
    { label: '流入', value: formatAbsYi(stats.totalInflow), color: '#f87171' },
    { label: '流出', value: formatAbsYi(stats.totalOutflowAbs), color: '#60a5fa' },
    { label: '净额', value: formatSignedYi(stats.totalNet), color: isPositive ? '#f87171' : '#4ade80' },
  ];

  const flowItems = [
    { label: '集中度', title: concentration, meta: `Top1 ${leaderShareText} / Top2 ${leader2ShareText}`, color: '#facc15' },
    { label: '结构', title: structureText, meta: `超大单 ${formatSignedYi(superWRaw)} / 大单 ${formatSignedYi(bigWRaw)}`, color: '#fb923c' },
    { label: '风险', title: riskText, meta: pressure ? `流出侧占比 ${riskShareText}` : '流出侧压力有限', color: '#60a5fa' },
  ];

  const signalCardMeta = (() => {
    const a = actions[0];
    const b = actions[1];
    if (a && b) return `①${a.text}　②${b.text}`;
    if (a) return `①${a.text}`;
    return outlook;
  })();

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(10, 20, 40, 0.74), rgba(8, 15, 30, 0.68))',
    border: '1px solid rgba(105, 135, 175, 0.25)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
    borderRadius: 8,
  };

  return (
    <>
      <Background
        frame={frame}
        totalFrames={totalFrames}
        sentiment={isPositive ? 'mainline' : 'bearish'}
        width={width}
        height={height}
        format={format}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          opacity,
          padding: `${verticalPadding}px ${sidePadding}px`,
          fontFamily,
          color: '#f8fbff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: contentWidth }}>
          <div>
            <div style={{ color: '#4a80d0', fontSize: titleSize, fontWeight: 800, letterSpacing: 4 }}>主线结构收尾</div>
            <div style={{ marginTop: 8, color: '#8aa4c8', fontSize: isTV ? 16 : 22, letterSpacing: 2 }}>
              TICK FUNDS CLOSE / {displayDate || '--'}
            </div>
          </div>
          <div
            style={{
              ...cardStyle,
              minWidth: isTV ? 210 : 250,
              padding: isTV ? '14px 18px' : '16px 22px',
              textAlign: 'right',
            }}
          >
            <div style={{ color: '#8aa4c8', fontSize: isTV ? 14 : 18, letterSpacing: 2 }}>主力净占比</div>
            <div
              style={{
                marginTop: 4,
                color: accentColor,
                fontSize: isTV ? 52 : 68,
                fontWeight: 800,
                fontFamily: monoFamily,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                textShadow: `0 0 24px ${accentColor}55`,
              }}
            >
              {targetRate >= 0 ? '+' : ''}
              {displayRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isTV ? '1.05fr 1.2fr' : '1fr',
            gridTemplateRows: isTV ? 'auto' : 'auto auto',
            gap,
            marginTop: isTV ? 26 : 34,
            width: contentWidth,
          }}
        >
          <section style={{ ...cardStyle, padding: isTV ? '26px 28px' : '28px 26px' }}>
            <div style={{ color: '#93c5fd', fontSize: isTV ? 18 : 24, fontWeight: 800, letterSpacing: 2 }}>最终判断</div>
            <div
              style={{
                marginTop: 14,
                fontSize: conclusionSize,
                fontWeight: 900,
                lineHeight: 1.16,
                textShadow: '0 8px 28px rgba(0,0,0,0.48)',
              }}
            >
              {clampText(conclusion, isTV ? 38 : 34)}
            </div>
            {recapLine ? (
              <div
                style={{
                  marginTop: isTV ? 14 : 18,
                  color: '#cfe2ff',
                  fontSize: isTV ? 20 : 26,
                  fontWeight: 800,
                  lineHeight: 1.3,
                  letterSpacing: 1,
                }}
              >
                {clampText(recapLine, isTV ? 46 : 40)}
              </div>
            ) : null}
            <div style={{ marginTop: isTV ? 22 : 28, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isTV ? 10 : 12 }}>
              {metricItems.map((item) => (
                <div key={item.label} style={{ borderTop: '1px solid rgba(105, 135, 175, 0.22)', paddingTop: 12 }}>
                  <div style={{ color: '#8aa4c8', fontSize: isTV ? 14 : 18, letterSpacing: 1 }}>{item.label}</div>
                  <div style={{ marginTop: 4, color: item.color, fontSize: isTV ? 24 : 28, fontWeight: 850, fontFamily: monoFamily }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: isTV ? 20 : 24,
                padding: isTV ? '14px 18px' : '16px 20px',
                background: 'rgba(74, 128, 208, 0.10)',
                border: '1px solid rgba(74, 128, 208, 0.24)',
                borderRadius: 8,
                color: '#dce8f7',
                fontSize: isTV ? 21 : 26,
                lineHeight: 1.28,
              }}
            >
              {clampText(signalText, isTV ? 30 : 28)}
            </div>
            {planIntro || planActions ? (
              <div
                style={{
                  marginTop: isTV ? 14 : 18,
                  padding: isTV ? '12px 18px' : '14px 20px',
                  background: 'rgba(52, 211, 153, 0.10)',
                  border: '1px solid rgba(52, 211, 153, 0.26)',
                  borderRadius: 8,
                }}
              >
                {planIntro ? (
                  <div style={{ color: '#34d399', fontSize: isTV ? 16 : 20, fontWeight: 900, letterSpacing: 2 }}>
                    {clampText(planIntro, isTV ? 20 : 18)}
                  </div>
                ) : null}
                {planActions ? (
                  <div style={{ marginTop: planIntro ? 6 : 0, color: '#d1fae5', fontSize: isTV ? 22 : 28, fontWeight: 820, lineHeight: 1.25 }}>
                    {clampText(planActions, isTV ? 38 : 34)}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: isTV ? '1fr 1fr' : '1fr',
              gridAutoRows: 'minmax(0, 1fr)',
              gap,
            }}
          >
            {flowItems.map((item, index) => (
              <div
                key={item.label}
                style={{
                  ...cardStyle,
                  opacity: Math.min(1, Math.max(0, (frame - 24 - index * 7) / 12)),
                  padding: isTV ? '20px 20px' : '22px 24px',
                  minHeight: isTV ? 156 : 148,
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  columnGap: isTV ? 16 : 18,
                  alignItems: 'start',
                }}
              >
                <div
                  style={{
                    width: isTV ? 42 : 48,
                    height: isTV ? 42 : 48,
                    borderRadius: 8,
                    background: `${item.color}1f`,
                    border: `1px solid ${item.color}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    fontSize: isTV ? 18 : 22,
                    fontWeight: 900,
                    fontFamily: monoFamily,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ color: item.color, fontSize: isTV ? 16 : 20, fontWeight: 900, letterSpacing: 2 }}>{item.label}</div>
                  <div style={{ marginTop: 8, color: '#f7fbff', fontSize: cardTextSize, fontWeight: 820, lineHeight: 1.18 }}>
                    {clampText(item.title, titleMaxTV)}
                  </div>
                  <div style={{ marginTop: 10, color: '#91a5bd', fontSize: isTV ? 16 : 20, lineHeight: 1.25 }}>
                    {clampText(item.meta, metaMaxTV)}
                  </div>
                </div>
              </div>
            ))}

            {actions.map((item, index) => {
              const pc = priorityColor(item.priority);
              return (
                <div
                  key={`action-${index}`}
                  style={{
                    ...cardStyle,
                    opacity: Math.min(1, Math.max(0, (frame - 40 - index * 6) / 10)),
                    padding: isTV ? '18px 20px' : '20px 24px',
                    minHeight: isTV ? 136 : 130,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 8,
                    background: `linear-gradient(145deg, rgba(10,20,40,0.74), rgba(${pc.bg === '#ef4444' ? '239,68,68' : pc.bg === '#f59e0b' ? '245,158,11' : '59,130,246'},0.09) rgba(8,15,30,0.68))`,
                    border: `1px solid ${pc.bg}55`,
                    boxShadow: `0 12px 28px ${pc.glow}, inset 0 0 0 1px rgba(255,255,255,0.02)`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        padding: '4px 12px',
                        background: pc.bg,
                        color: pc.text,
                        fontSize: isTV ? 13 : 16,
                        fontWeight: 900,
                        letterSpacing: 3,
                        borderRadius: 999,
                        boxShadow: `0 4px 14px ${pc.glow}`,
                      }}
                    >
                      {pc.label}
                    </div>
                    <div style={{ color: pc.text, fontSize: isTV ? 14 : 18, fontWeight: 900, letterSpacing: 2 }}>
                      ACTION 0{index + 1}
                    </div>
                  </div>
                  <div style={{ color: '#ffffff', fontSize: isTV ? 26 : 32, fontWeight: 900, lineHeight: 1.18, textShadow: '0 6px 20px rgba(0,0,0,0.45)' }}>
                    {clampText(item.text, isTV ? 24 : 22)}
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        <div
          style={{
            ...cardStyle,
            position: 'absolute',
            left: sidePadding,
            right: sidePadding,
            bottom: isTV ? 42 : 48,
            padding: isTV ? '16px 22px' : '18px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 18,
          }}
        >
          <div style={{ color: '#34d399', fontSize: isTV ? 18 : 22, fontWeight: 900, letterSpacing: 2, whiteSpace: 'nowrap', marginTop: 2 }}>明日观察</div>
          <div style={{ flex: 1, color: '#dce8f7', fontSize: isTV ? 24 : 28, fontWeight: 800, lineHeight: 1.22 }}>
            {clampText(outlook, isTV ? 52 : 44)}
          </div>
        </div>
      </div>
    </>
  );
};
