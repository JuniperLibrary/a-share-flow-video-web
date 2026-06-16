/** 移动端 / TV 端图表与右侧排行榜的共享布局，避免曲线标签与排行榜重叠。 */
export function getVideoLayout(width: number, height: number, format: 'mobile' | 'tv') {
  const isTV = format === 'tv';

  if (isTV) {
    const chartLeft = 80;
    const rankingPanelLeft = width * 0.76;
    const chartRight = width * 0.72;
    return {
      chartLeft,
      chartRight,
      chartTop: 150,
      chartBottom: height * 0.86,
      rankingPanelLeft,
      rankingPanelTop: 110,
      rankingPanelWidth: width * 0.22,
      labelMaxX: rankingPanelLeft - 20,
    };
  }

  const rankingPanelLeft = width * 0.72;
  const chartLeft = 50;
  const chartRight = Math.min(560, rankingPanelLeft - 48);
  return {
    chartLeft,
    chartRight,
    chartTop: 180,
    chartBottom: height * 0.83,
    rankingPanelLeft,
    rankingPanelTop: 180,
    rankingPanelWidth: width * 0.27,
    labelMaxX: rankingPanelLeft - 16,
  };
}
