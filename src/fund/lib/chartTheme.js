/**
 * 基金图表统一的亮/暗主题色板。
 *
 * 此前 FundTrendChart / FundIntradayChart / FundDailyEarnings 各存一份完全相同的
 * CHART_COLORS（趋势图额外带 grandLine / grandLegend）。调一个颜色要改三处、极易漏改，
 * 这里收敛为单一数据源；未用到的大类多线配色对其它图表无副作用。
 */

const CHART_COLORS = {
  dark: {
    danger: '#f87171',
    success: '#34d399',
    primary: '#22d3ee',
    muted: '#9ca3af',
    border: '#1f2937',
    text: '#e5e7eb',
    crosshairText: '#0f172a',
    grandLine: [
      'rgba(34,211,238,0.55)',
      'rgba(156,163,175,0.55)',
      'rgba(251,146,60,0.55)',
      'rgba(229,231,235,0.45)',
    ],
    grandLegend: [
      'rgba(34,211,238,0.55)',
      'rgba(156,163,175,0.55)',
      'rgba(251,146,60,0.55)',
      'rgba(229,231,235,0.45)',
    ],
  },
  light: {
    danger: '#dc2626',
    success: '#059669',
    primary: '#0891b2',
    muted: '#475569',
    border: '#e2e8f0',
    text: '#0f172a',
    crosshairText: '#ffffff',
    grandLine: [
      'rgba(8,145,178,0.5)',
      'rgba(71,85,105,0.45)',
      'rgba(249,115,22,0.5)',
      'rgba(15,23,42,0.35)',
    ],
    grandLegend: [
      'rgba(8,145,178,0.5)',
      'rgba(71,85,105,0.45)',
      'rgba(249,115,22,0.5)',
      'rgba(15,23,42,0.35)',
    ],
  },
};

/** 取主题色板，未知主题回退暗色 */
export function getChartThemeColors(theme) {
  return CHART_COLORS[theme] || CHART_COLORS.dark;
}
