import React from 'react';
import { ReportImageProps, ThematicCard, getThemeTone } from './types';
import { CoverCard } from './CoverCard';
import { DetailCard } from './DetailCard';

interface ReportSceneProps {
  report: ReportImageProps;
  /** 渲染哪张 ThematicCard（从 0 开始），-1 表示渲染封面摘要 */
  cardIndex?: number;
}

/** 日报场景入口：-1 = 封面，>=0 = 对应专题卡片的详情 */
export const ReportScene: React.FC<ReportSceneProps> = ({ report, cardIndex = -1 }) => {
  const { date, report: r, thematicCards } = report;

  if (cardIndex < 0 || cardIndex >= thematicCards.length) {
    // 封面模式：合并所有主题首张卡片的摘要
    const primary = thematicCards[0];
    if (!primary) {
      return <div style={{ width: 1080, height: 1920, background: '#0a0f18', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
        暂无数据
      </div>;
    }
    return (
      <CoverCard
        card={primary}
        date={date}
        netTotal={r.netTotal}
        inflowCount={r.inflowCount}
        outflowCount={r.outflowCount}
      />
    );
  }

  const tc = thematicCards[cardIndex];
  const themeTone = getThemeTone(tc.theme);

  return (
    <>
      {/* 如果该专题有推理，先在顶部展示精简摘要 */}
      {tc.reasoning && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: '50px 50px 0',
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              background: 'rgba(20,30,50,0.7)',
              border: '1px solid rgba(60,80,120,0.2)',
              fontSize: 16,
              color: '#8899aa',
              lineHeight: 1.6,
              letterSpacing: 1,
            }}
          >
            💡 {tc.reasoning.substring(0, 120)}…
          </div>
        </div>
      )}

      {/* 该主题下的子卡片 */}
      {tc.cards.map((card, ci) => (
        <div key={ci} style={{ display: ci === 0 ? 'block' : 'none' }}>
          <DetailCard card={card} themeTone={themeTone} />
        </div>
      ))}
    </>
  );
};

/** 便捷导出：渲染指定主题的第 N 个子卡 */
export const ReportScene0: React.FC<{ report: ReportImageProps }> = ({ report }) => (
  <ReportScene report={report} cardIndex={0} />
);
export const ReportScene1: React.FC<{ report: ReportImageProps }> = ({ report }) => (
  <ReportScene report={report} cardIndex={1} />
);
