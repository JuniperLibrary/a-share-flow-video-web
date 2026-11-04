/**
 * 汇总分组的「账户汇总卡片」数据派生。
 *
 * 逻辑此前内联在 FundPage 的 `summaryCardItems` useMemo 中（约 146 行），
 * 与组件作用域的 8 个状态耦合。这里抽为纯函数，依赖一律显式入参。
 *
 * 产出两类卡片：
 * 1. 全局「全部」卡片（仅当 `hasGlobalPortfolioForSummary` 为真）；
 * 2. 每个有持仓的自定义分组一张。
 * 两者口径一致：持仓金额按分取整累加，当日收益/持仓收益分别累加，
 * 收益率 = 收益 / 成本金额 × 100，并附带按日累计的收益曲线（sparkSeries）。
 */
import { isArray, isNumber, isPlainObject } from 'lodash';
import { SUMMARY_SOURCE_GLOBAL, SUMMARY_TAB_ID } from './fundHelpers';
import { aggregatePortfolioDailyEarnings, DAILY_EARNINGS_SCOPE_ALL } from './dailyEarnings';

/**
 * @param {object} params
 * @param {string} params.currentTab 当前分组 id（非汇总分组时直接返回空数组）
 * @param {Array} params.funds 全部基金
 * @param {Record<string, object>} params.holdings 全局持仓
 * @param {Array} params.groupsWithHoldings 有持仓的自定义分组
 * @param {Record<string, Record<string, object>>} params.groupHoldings 各分组持仓
 * @param {(fund: object, holding: object, scopeGroupIdOverride?: string|null) => object} params.getHoldingProfit 持仓收益计算
 * @param {Record<string, Record<string, Array>>} params.fundDailyEarnings 分桶后的每日收益
 * @param {boolean} params.hasGlobalPortfolioForSummary 是否存在全局持仓（决定是否输出「全部」卡片）
 * @returns {Array} 汇总卡片数据
 */
export function buildSummaryCardItems({
  currentTab,
  funds,
  holdings,
  groupsWithHoldings,
  groupHoldings,
  getHoldingProfit,
  fundDailyEarnings,
  hasGlobalPortfolioForSummary,
}) {
  if (currentTab !== SUMMARY_TAB_ID) return [];
  const items = [];

  if (hasGlobalPortfolioForSummary) {
    let totalAsset = 0;
    let totalHoldingReturn = 0;
    let totalCost = 0;
    let totalProfitToday = 0;
    let totalPrincipalToday = 0;
    let hasAnyTodayData = false;
    let upCount = 0;
    let downCount = 0;

    for (const fund of funds || []) {
      const holding = holdings[fund.code];
      if (!holding) continue;
      const profit = getHoldingProfit(fund, holding, null);
      if (!profit) continue;
      totalAsset += Math.round(profit.amount * 100) / 100;
      if (profit.profitToday != null) {
        totalProfitToday += profit.profitToday;
        totalPrincipalToday += (profit.principalToday || 0);
        hasAnyTodayData = true;
      }
      if (profit.profitTotal !== null) {
        totalHoldingReturn += profit.profitTotal;
        if (typeof holding.cost === 'number' && typeof holding.share === 'number') {
          totalCost += holding.cost * holding.share;
        }
      }
      const ev = fund.noValuation
        ? null
        : (isNumber(fund.gszzl) ? Number(fund.gszzl) : null);
      if (ev != null && Number.isFinite(ev)) {
        if (ev > 0) upCount += 1;
        else if (ev < 0) downCount += 1;
      }
    }

    const roundedToday = Math.round(totalProfitToday * 100) / 100;
    const returnRate = totalCost > 0 ? (totalHoldingReturn / totalCost) * 100 : 0;
    const todayReturnRate = totalPrincipalToday > 0 ? (roundedToday / totalPrincipalToday) * 100 : 0;
    const scopeDaily = isPlainObject(fundDailyEarnings?.[DAILY_EARNINGS_SCOPE_ALL])
      ? fundDailyEarnings[DAILY_EARNINGS_SCOPE_ALL]
      : {};
    const dailySeries = aggregatePortfolioDailyEarnings(scopeDaily);
    let cum = 0;
    const sparkSeries = dailySeries.map((pt) => {
      cum += pt.earnings;
      return { date: pt.date, earnings: cum };
    });

    items.push({
      groupId: SUMMARY_SOURCE_GLOBAL,
      groupName: '全部',
      totalAsset,
      holdingReturn: totalHoldingReturn,
      holdingReturnPercent: returnRate,
      accountReturn: roundedToday,
      accountReturnPercent: todayReturnRate,
      hasAnyTodayData,
      upCount,
      downCount,
      sparkSeries,
    });
  }

  items.push(
    ...groupsWithHoldings.map((g) => {
      const bucket = groupHoldings[g.id] || {};
      const groupFunds = (isArray(funds) ? funds : []).filter((f) => g.codes.includes(f.code));
      let totalAsset = 0;
      let totalHoldingReturn = 0;
      let totalCost = 0;
      let totalProfitToday = 0;
      let totalPrincipalToday = 0;
      let hasAnyTodayData = false;
      let upCount = 0;
      let downCount = 0;

      for (const fund of groupFunds) {
        const holding = bucket[fund.code];
        const profit = getHoldingProfit(fund, holding, g.id);
        if (profit) {
          totalAsset += Math.round(profit.amount * 100) / 100;
          if (profit.profitToday != null) {
            totalProfitToday += profit.profitToday;
            totalPrincipalToday += (profit.principalToday || 0);
            hasAnyTodayData = true;
          }
          if (profit.profitTotal !== null) {
            totalHoldingReturn += profit.profitTotal;
            if (holding && typeof holding.cost === 'number' && typeof holding.share === 'number') {
              totalCost += holding.cost * holding.share;
            }
          }
        }
        const ev = fund.noValuation
          ? null
          : (isNumber(fund.gszzl) ? Number(fund.gszzl) : null);
        if (ev != null && Number.isFinite(ev)) {
          if (ev > 0) upCount += 1;
          else if (ev < 0) downCount += 1;
        }
      }

      const roundedToday = Math.round(totalProfitToday * 100) / 100;
      const returnRate = totalCost > 0 ? (totalHoldingReturn / totalCost) * 100 : 0;
      const todayReturnRate = totalPrincipalToday > 0 ? (roundedToday / totalPrincipalToday) * 100 : 0;

      const scopeDaily = isPlainObject(fundDailyEarnings?.[g.id]) ? fundDailyEarnings[g.id] : {};
      const dailySeries = aggregatePortfolioDailyEarnings(scopeDaily);
      let cum = 0;
      const sparkSeries = dailySeries.map((pt) => {
        cum += pt.earnings;
        return { date: pt.date, earnings: cum };
      });

      return {
        groupId: g.id,
        groupName: g.name || '分组',
        totalAsset,
        holdingReturn: totalHoldingReturn,
        holdingReturnPercent: returnRate,
        accountReturn: roundedToday,
        accountReturnPercent: todayReturnRate,
        hasAnyTodayData,
        upCount,
        downCount,
        sparkSeries,
      };
    })
  );
  return items;
}
