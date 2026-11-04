import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { isNumber, isString, isPlainObject } from 'lodash';
import { SUMMARY_TAB_ID, SUMMARY_SOURCE_GLOBAL, normalizeFundTagTheme } from './fundHelpers';
import { DAILY_EARNINGS_SCOPE_ALL } from './dailyEarnings';

// dayjs 是单例，插件在本模块内注册一次即可（幂等）；timezone 依赖 utc，需先注册 utc。
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 由展示用基金列表派生出「当前分组视图」的基金数组。
 *
 * 逻辑此前内联在 FundPage 的 `displayFundsRaw` useMemo 中（约 250 行），
 * 与组件作用域里的十余个状态耦合，无法单独推理。这里把整条
 * 「分组内搜索 → 分组自定义顺序 → 多字段排序」流水线抽为纯函数，
 * 依赖一律显式入参，调用方只负责传入当前状态。
 *
 * @param {object} params
 * @param {Array} params.scopedFunds 当前分组作用域下的基金
 * @param {string} params.currentTab 当前分组 id
 * @param {Array} params.groups 分组列表（用于取分组内自定义顺序）
 * @param {string} params.sortBy 排序字段
 * @param {'asc'|'desc'} params.sortOrder 排序方向
 * @param {Record<string, object>} params.holdingsForTabWithLinked 当前分组持仓（含关联汇总）
 * @param {(fund: object, holding: object) => object} params.getHoldingProfitForTab 持仓收益计算
 * @param {string} params.deferredGroupFundSearchTerm 分组内搜索词（已 deferred）
 * @param {boolean} params.shouldShowGroupFundSearch 是否启用分组内搜索
 * @param {Record<string, Array>} params.currentFundDailyEarnings 按 code 的每日收益序列
 * @param {Record<string, object>} params.fundExtraDataByCode 按 code 的区间涨幅等附加数据
 * @param {string} params.todayStr 今日日期（YYYY-MM-DD）
 * @param {Record<string, Array>} params.fundTagListsByCode 按 code 的标签列表
 * @returns {Array} 排序后的基金数组
 */
export function buildDisplayFunds({
  scopedFunds,
  currentTab,
  groups,
  sortBy,
  sortOrder,
  holdingsForTabWithLinked,
  getHoldingProfitForTab,
  deferredGroupFundSearchTerm,
  shouldShowGroupFundSearch,
  currentFundDailyEarnings,
  fundExtraDataByCode,
  todayStr,
  fundTagListsByCode,
}) {
  let filtered = [...scopedFunds];

  const q = String(shouldShowGroupFundSearch ? (deferredGroupFundSearchTerm ?? '') : '').trim();
  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter((f) => {
      const name = String(f?.name ?? '').toLowerCase();
      const code = String(f?.code ?? '').toLowerCase();
      return name.includes(qLower) || code.includes(qLower);
    });
  }

  if (currentTab !== 'all' && currentTab !== 'fav' && currentTab !== SUMMARY_TAB_ID && sortBy === 'default') {
    const group = groups.find((g) => g.id === currentTab);
    if (group && group.codes) {
      const codeMap = new Map(group.codes.map((code, index) => [code, index]));
      filtered.sort((a, b) => {
        const indexA = codeMap.get(a.code) ?? Number.MAX_SAFE_INTEGER;
        const indexB = codeMap.get(b.code) ?? Number.MAX_SAFE_INTEGER;
        return indexA - indexB;
      });
    }
  }

  const profitByCode =
    sortBy === 'holdingAmount' || sortBy === 'holdingRatio' || sortBy === 'todayProfit' || sortBy === 'holding'
      ? new Map(filtered.map((f) => [f.code, getHoldingProfitForTab(f, holdingsForTabWithLinked[f.code])]))
      : null;

  return filtered.sort((a, b) => {
    if (sortBy === 'yield') {
      const getYieldValue = (fund) => {
        // 与 estimateChangePercent 展示逻辑对齐：
        // - noValuation 为 true 一律视为无“估算涨幅”
        // - 仅在 gszzl 为数字时使用 gszzl
        if (fund.noValuation) {
          return { value: 0, hasValue: false };
        }
        if (isNumber(fund.gszzl)) {
          return { value: Number(fund.gszzl), hasValue: true };
        }
        return { value: 0, hasValue: false };
      };

      const { value: valA, hasValue: hasA } = getYieldValue(a);
      const { value: valB, hasValue: hasB } = getYieldValue(b);

      // 无“估算涨幅”展示值（界面为 `—`）的基金统一排在最后
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'holdingAmount') {
      const pa = profitByCode?.get(a.code);
      const pb = profitByCode?.get(b.code);
      const amountA = pa?.amount ?? Number.NEGATIVE_INFINITY;
      const amountB = pb?.amount ?? Number.NEGATIVE_INFINITY;
      return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
    }
    if (sortBy === 'holdingRatio') {
      const pa = profitByCode?.get(a.code);
      const pb = profitByCode?.get(b.code);
      const amountA = pa?.amount;
      const amountB = pb?.amount;
      const hasA = amountA != null && Number.isFinite(amountA) && amountA > 0;
      const hasB = amountB != null && Number.isFinite(amountB) && amountB > 0;
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      // holdingRatio sort is equivalent to holdingAmount sort (same denominator within group)
      return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
    }
    if (sortBy === 'yesterdayIncrease') {
      const valA = Number(a.zzl);
      const valB = Number(b.zzl);
      const hasA = Number.isFinite(valA);
      const hasB = Number.isFinite(valB);

      // 无最新涨幅数据（界面展示为 `—`）的基金统一排在最后
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'todayProfit') {
      const pa = profitByCode?.get(a.code);
      const pb = profitByCode?.get(b.code);
      const valA = pa?.profitToday;
      const valB = pb?.profitToday;
      const hasA = valA != null && Number.isFinite(valA);
      const hasB = valB != null && Number.isFinite(valB);

      // 无当日收益数据的基金统一排在最后
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'holding') {
      const pa = profitByCode?.get(a.code);
      const pb = profitByCode?.get(b.code);
      const valA = pa?.profitTotal;
      const valB = pb?.profitTotal;
      const hasA = valA != null && Number.isFinite(valA);
      const hasB = valB != null && Number.isFinite(valB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'estimateProfit') {
      const getEstimateProfitValue = (f) => {
        const hasTodayData = f.jzrq === todayStr;
        const holding = holdingsForTabWithLinked[f.code];
        const profit = getHoldingProfitForTab(f, holding);
        const total = profit ? profit.profitTotal : null;
        if (hasTodayData) return total;

        const principal = holding && isNumber(holding.cost) && isNumber(holding.share) ? holding.cost * holding.share : 0;
        const hasTodayEstimate = !f.noValuation && isString(f.gztime) && f.gztime.startsWith(todayStr);
        const estimateChangeValue = f.noValuation ? null : (isNumber(f.gszzl) ? Number(f.gszzl) : null);
        const holdingProfitPercentValue = total != null && principal > 0 ? (total / principal) * 100 : null;
        const hasEstimatePercent = hasTodayEstimate && estimateChangeValue != null;
        const hasHoldingPercent = holdingProfitPercentValue != null;
        const fallbackEstimateProfitPercentValue = hasEstimatePercent || hasHoldingPercent ? (hasEstimatePercent ? estimateChangeValue : 0) + (hasHoldingPercent ? holdingProfitPercentValue : 0) : null;

        return fallbackEstimateProfitPercentValue != null && principal > 0 ? principal * (fallbackEstimateProfitPercentValue / 100) : null;
      };
      const valA = getEstimateProfitValue(a);
      const valB = getEstimateProfitValue(b);
      const hasA = valA != null && Number.isFinite(valA);
      const hasB = valB != null && Number.isFinite(valB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'yesterdayProfit') {
      const getYesterdayProfit = (code, jzrq) => {
        const list = currentFundDailyEarnings?.[code];
        if (!Array.isArray(list) || list.length === 0) return null;
        let matchedDaily = null;
        if (typeof jzrq === 'string') {
          for (const item of list) {
            if (item?.date === jzrq) {
              matchedDaily = item;
              break;
            }
          }
        }
        if (!matchedDaily) matchedDaily = list[list.length - 1];
        return matchedDaily && Number.isFinite(Number(matchedDaily.earnings)) ? Number(matchedDaily.earnings) : null;
      };
      const valA = getYesterdayProfit(a.code, a.jzrq);
      const valB = getYesterdayProfit(b.code, b.jzrq);
      const hasA = valA != null && Number.isFinite(valA);
      const hasB = valB != null && Number.isFinite(valB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'holdingDays') {
      const ha = holdingsForTabWithLinked[a.code];
      const hb = holdingsForTabWithLinked[b.code];
      const valA = ha?.firstPurchaseDate ? dayjs(todayStr).diff(dayjs(ha.firstPurchaseDate), 'day') : null;
      const valB = hb?.firstPurchaseDate ? dayjs(todayStr).diff(dayjs(hb.firstPurchaseDate), 'day') : null;
      const hasA = valA != null && Number.isFinite(valA);
      const hasB = valB != null && Number.isFinite(valB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'holdingCost') {
      const getCost = (h) => h?.cost != null && h?.share != null && Number.isFinite(Number(h.cost)) && Number.isFinite(Number(h.share)) ? Number(h.cost) * Number(h.share) : null;
      const valA = getCost(holdingsForTabWithLinked[a.code]);
      const valB = getCost(holdingsForTabWithLinked[b.code]);
      const hasA = valA != null && Number.isFinite(valA);
      const hasB = valB != null && Number.isFinite(valB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'sinceAddedChangePercent') {
      const getSinceAddedChangeValue = (f) => {
        const addBaseNavRaw = f.addBaseNav != null && f.addBaseNav !== '' ? Number(f.addBaseNav) : null;
        const addBaseNav = addBaseNavRaw != null && Number.isFinite(addBaseNavRaw) && addBaseNavRaw > 0 ? addBaseNavRaw : null;
        const sinceAddedCurrentNav = (() => {
          if (f.noValuation) {
            const v = Number(f.dwjz);
            return Number.isFinite(v) && v > 0 ? v : null;
          }
          const v = Number(f.gsz);
          return Number.isFinite(v) && v > 0 ? v : null;
        })();
        return addBaseNav != null && sinceAddedCurrentNav != null
          ? ((sinceAddedCurrentNav / addBaseNav) - 1) * 100
          : null;
      };
      const valA = getSinceAddedChangeValue(a);
      const valB = getSinceAddedChangeValue(b);
      const hasA = valA != null && Number.isFinite(valA);
      const hasB = valB != null && Number.isFinite(valB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (['last1Week', 'last1Month', 'last3Months', 'last6Months', 'last1Year'].includes(sortBy)) {
      const keyMap = { last1Week: 'week', last1Month: 'month', last3Months: 'month3', last6Months: 'month6', last1Year: 'year1' };
      const key = keyMap[sortBy];
      const valA = fundExtraDataByCode[a.code]?.[key];
      const valB = fundExtraDataByCode[b.code]?.[key];
      const hasA = valA != null && Number.isFinite(valA);
      const hasB = valB != null && Number.isFinite(valB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    if (sortBy === 'tags') {
      const getTagKey = (fund) => {
        const code = String(fund?.code ?? '').trim();
        const list = code ? fundTagListsByCode?.[code] : null;
        if (!Array.isArray(list) || list.length === 0) return '';
        return list
          .map((t) => (t?.name != null ? String(t.name).trim() : ''))
          .filter(Boolean)
          .join('、');
      };
      const keyA = getTagKey(a);
      const keyB = getTagKey(b);
      const hasA = !!keyA;
      const hasB = !!keyB;
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return sortOrder === 'asc'
        ? keyA.localeCompare(keyB, 'zh-CN')
        : keyB.localeCompare(keyA, 'zh-CN');
    }
    if (sortBy === 'name') {
      const nameA = a.name ?? '';
      const nameB = b.name ?? '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'zh-CN') : nameB.localeCompare(nameA, 'zh-CN');
    }
    return 0;
  });
}

/**
 * 由展示用基金列表派生 PC 端表格行数据（用于 PcFundTable）。
 *
 * 逻辑此前内联在 FundPage 的 `pcFundTableData` useMemo 中（约 265 行），
 * 与组件作用域里的十余个状态耦合，无法单独推理。这里抽为纯函数，
 * 依赖一律显式入参，调用方只负责传入当前状态。
 *
 * @param {object} params
 * @param {Array} params.displayFunds 已过滤排序的基金列表
 * @param {Record<string, object>} params.holdingsForTabWithLinked 当前分组持仓（含关联汇总）
 * @param {(fund: object, holding: object) => object} params.getHoldingProfitForTab 持仓收益计算
 * @param {string} params.currentTab 当前分组 id
 * @param {object} params.linkedHoldingsForAllFav 全部/自选分组的关联持仓索引
 * @param {Record<string, object>} params.latestDailyByCode 按 code 的最新每日收益（含日期索引）
 * @param {string} params.todayStr 今日日期（YYYY-MM-DD）
 * @param {string} params.TZ 时区
 * @param {Record<string, Array>} params.fundTagListsByCode 按 code 的标签列表
 * @param {Record<string, object>} params.dcaPlansForTab 当前分组的定投计划
 * @param {Record<string, string>} params.summaryHoldingSourceGroupByCode 汇总分组下每个 code 的来源分组
 * @returns {Array} 表格行数据
 */
export function buildPcFundTableData({
  displayFunds,
  holdingsForTabWithLinked,
  getHoldingProfitForTab,
  currentTab,
  linkedHoldingsForAllFav,
  latestDailyByCode,
  todayStr,
  TZ,
  fundTagListsByCode,
  dcaPlansForTab,
  summaryHoldingSourceGroupByCode,
}) {
  // 计算分组内所有基金持仓金额之和，用于持仓占比
  let groupTotalHoldingAmount = 0;
  for (const ff of displayFunds) {
    const h = holdingsForTabWithLinked[ff.code];
    const p = getHoldingProfitForTab(ff, h);
    if (p && p.amount != null && Number.isFinite(p.amount) && p.amount > 0) groupTotalHoldingAmount += p.amount;
  }
  return displayFunds.map((f) => {
    const hasTodayData = f.jzrq === todayStr;
    const latestNav = f.dwjz != null && f.dwjz !== '' ? (typeof f.dwjz === 'number' ? Number(f.dwjz).toFixed(4) : String(f.dwjz)) : '—';
    const estimateNav = f.noValuation
      ? '—'
      : (f.gsz != null ? (typeof f.gsz === 'number' ? Number(f.gsz).toFixed(4) : String(f.gsz)) : '—');

    const yesterdayChangePercent =
      f.zzl != null && f.zzl !== ''
        ? `${f.zzl > 0 ? '+' : ''}${Number(f.zzl).toFixed(2)}%`
        : '—';
    const yesterdayChangeValue =
      f.zzl != null && f.zzl !== '' ? Number(f.zzl) : null;
    const yesterdayDate = f.jzrq || '-';

    const estimateChangePercent = f.noValuation
      ? '—'
      : (isNumber(f.gszzl)
        ? `${f.gszzl > 0 ? '+' : ''}${Number(f.gszzl).toFixed(2)}%`
        : (f.gszzl ?? '—'));
    const estimateChangeValue = f.noValuation
      ? null
      : (isNumber(f.gszzl) ? Number(f.gszzl) : null);
    const estimateTime = f.noValuation ? (f.jzrq || '-') : (f.gztime || f.time || '-');
    const hasTodayEstimate = !f.noValuation && isString(f.gztime) && f.gztime.startsWith(todayStr);

    const holding = holdingsForTabWithLinked[f.code];
    const isHoldingLinked =
      (currentTab === 'all' || currentTab === 'fav') &&
      linkedHoldingsForAllFav.linked?.has?.(f.code);
    const profit = getHoldingProfitForTab(f, holding);
    const amount = profit ? profit.amount : null;
    const holdingAmount =
      amount == null ? '未设置' : `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const holdingAmountValue = amount;
    const holdingRatioValue =
      amount != null && Number.isFinite(amount) && amount > 0 && groupTotalHoldingAmount > 0
        ? amount / groupTotalHoldingAmount
        : null;
    const holdingDaysValue = holding?.firstPurchaseDate
      ? dayjs.tz(todayStr, TZ).diff(dayjs.tz(holding.firstPurchaseDate, TZ), 'day')
      : null;

    const profitToday = profit ? profit.profitToday : null;
    const todayProfit =
      profitToday == null
        ? ''
        : `${profitToday > 0 ? '+' : profitToday < 0 ? '-' : ''}${Math.abs(profitToday).toFixed(2)}`;
    const todayProfitValue = profitToday;

    const total = profit ? profit.profitTotal : null;
    const principal =
      holding && isNumber(holding.cost) && isNumber(holding.share)
        ? holding.cost * holding.share
        : 0;
    const holdingCostValue =
      holding && isNumber(holding.cost) && isNumber(holding.share)
        ? holding.cost * holding.share
        : null;
    const holdingCost =
      holdingCostValue == null
        ? '-'
        : Number(holdingCostValue).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const costNavValue =
      holding && isNumber(holding.cost) ? holding.cost : null;
    const costNav =
      costNavValue == null ? '—' : Number(costNavValue).toFixed(4);
    const todayProfitPercent =
      profitToday != null && profit?.principalToday > 0
        ? `${profitToday > 0 ? '+' : profitToday < 0 ? '-' : ''}${Math.abs((profitToday / profit.principalToday) * 100).toFixed(2)}%`
        : '';

    const latestNavDateStr = isString(f.jzrq) ? f.jzrq : '';
    const dailyMeta = latestDailyByCode?.[f.code];
    const matchedDaily =
      (latestNavDateStr ? (dailyMeta?.byDate?.get(latestNavDateStr) || null) : null)
      || dailyMeta?.last
      || null;
    const yesterdayProfitVal =
      matchedDaily && Number.isFinite(Number(matchedDaily.earnings))
        ? Number(matchedDaily.earnings)
        : null;
    const yesterdayProfit =
      yesterdayProfitVal == null
        ? ''
        : `${yesterdayProfitVal > 0 ? '+' : yesterdayProfitVal < 0 ? '-' : ''}${Math.abs(yesterdayProfitVal).toFixed(2)}`;
    const dailyBaseCostAmount =
      matchedDaily && matchedDaily.baseCostAmount != null && matchedDaily.baseCostAmount !== '' && Number.isFinite(Number(matchedDaily.baseCostAmount))
        ? Number(matchedDaily.baseCostAmount)
        : null;
    const derivedRateFromSnapshot =
      yesterdayProfitVal != null && dailyBaseCostAmount != null && dailyBaseCostAmount > 0
        ? (yesterdayProfitVal / dailyBaseCostAmount) * 100
        : null;
    const dailyRate =
      matchedDaily && matchedDaily.rate != null && matchedDaily.rate !== '' && Number.isFinite(Number(matchedDaily.rate))
        ? Number(matchedDaily.rate)
        : derivedRateFromSnapshot;
    const yesterdayProfitPercentLine =
      dailyRate != null
        ? `${dailyRate > 0 ? '+' : dailyRate < 0 ? '-' : ''}${Math.abs(dailyRate).toFixed(2)}%`
        : (yesterdayProfitVal != null && principal > 0
          ? `${yesterdayProfitVal > 0 ? '+' : yesterdayProfitVal < 0 ? '-' : ''}${Math.abs((yesterdayProfitVal / principal) * 100).toFixed(2)}%`
          : '');
    const yesterdaySecondLinePctValue =
      dailyRate != null
        ? dailyRate
        : (yesterdayProfitVal != null && principal > 0
          ? (yesterdayProfitVal / principal) * 100
          : null);

    const holdingProfit =
      total == null
        ? ''
        : `${total > 0 ? '+' : total < 0 ? '-' : ''}${Math.abs(total).toFixed(2)}`;
    const holdingProfitPercent =
      total != null && principal > 0
        ? `${total > 0 ? '+' : total < 0 ? '-' : ''}${Math.abs((total / principal) * 100).toFixed(2)}%`
        : '';
    const holdingProfitValue = total;

    const holdingProfitPercentValue =
      total != null && principal > 0 ? (total / principal) * 100 : null;
    const hasEstimatePercent = hasTodayEstimate && estimateChangeValue != null;
    const hasHoldingPercent = holdingProfitPercentValue != null;
    const fallbackEstimateProfitPercentValue = hasEstimatePercent || hasHoldingPercent
      ? (hasEstimatePercent ? estimateChangeValue : 0) + (hasHoldingPercent ? holdingProfitPercentValue : 0)
      : null;
    const estimateProfitPercentValue = hasTodayData
      ? holdingProfitPercentValue
      : fallbackEstimateProfitPercentValue;
    const estimateProfitValue = hasTodayData
      ? total
      : (estimateProfitPercentValue != null && principal > 0
        ? principal * (estimateProfitPercentValue / 100)
        : null);
    const estimateProfit =
      estimateProfitValue == null
        ? ''
        : `${estimateProfitValue > 0 ? '+' : estimateProfitValue < 0 ? '-' : ''}${Math.abs(estimateProfitValue).toFixed(2)}`;
    const estimateProfitPercent =
      estimateProfitPercentValue == null
        ? ''
        : `${estimateProfitPercentValue > 0 ? '+' : ''}${estimateProfitPercentValue.toFixed(2)}%`;

    const addBaseNavRaw = f.addBaseNav != null && f.addBaseNav !== '' ? Number(f.addBaseNav) : null;
    const addBaseNav = addBaseNavRaw != null && Number.isFinite(addBaseNavRaw) && addBaseNavRaw > 0 ? addBaseNavRaw : null;
    const sinceAddedCurrentNav = (() => {
      if (f.noValuation) {
        const v = Number(f.dwjz);
        return Number.isFinite(v) && v > 0 ? v : null;
      }
      const v = Number(f.gsz);
      return Number.isFinite(v) && v > 0 ? v : null;
    })();
    const sinceAddedChangeValue =
      addBaseNav != null && sinceAddedCurrentNav != null
        ? ((sinceAddedCurrentNav / addBaseNav) - 1) * 100
        : null;
    const sinceAddedChangePercent =
      sinceAddedChangeValue == null
        ? '—'
        : `${sinceAddedChangeValue > 0 ? '+' : ''}${sinceAddedChangeValue.toFixed(2)}%`;
    const sinceAddedDateRaw = (() => {
      const raw = f.addBaseDate;
      const rawStr = raw != null ? String(raw) : '';
      if (/^\d{4}-\d{2}-\d{2}/.test(rawStr)) return rawStr.slice(0, 10);
      const ts = Number(f.addedAt);
      if (Number.isFinite(ts) && ts > 0) return dayjs.tz(ts, TZ).format('YYYY-MM-DD');
      return '';
    })();
    const sinceAddedDate = (() => {
      const raw = sinceAddedDateRaw || '';
      if (!raw) return '';
      const currentYear = typeof todayStr === 'string' && todayStr.length >= 4 ? todayStr.slice(0, 4) : '';
      if (currentYear && raw.startsWith(`${currentYear}-`) && raw.length >= 10) return raw.slice(5);
      return raw;
    })();

    const fc = String(f.code ?? '').trim();
    const listFromDerived = fundTagListsByCode[fc];
    const fundTags = Array.isArray(listFromDerived)
      ? listFromDerived.map(({ name, theme }) => ({
          name: String(name ?? '').trim(),
          theme: normalizeFundTagTheme(theme),
        }))
      : [];

    return {
      rawFund: f,
      code: f.code,
      fundName: f.name,
      fundTags,
      isHoldingLinked: !!isHoldingLinked,
      isUpdated: f.jzrq === todayStr,
      hasDca: dcaPlansForTab[f.code]?.enabled === true,
      latestNav,
      latestNavDate: yesterdayDate,
      estimateNav,
      estimateNavDate: estimateTime,
      yesterdayChangePercent,
      yesterdayChangeValue,
      yesterdayDate,
      estimateChangePercent,
      estimateChangeValue,
      estimateChangeMuted: f.noValuation,
      estimateTime,
      hasTodayEstimate,
      totalChangePercent: estimateProfitPercent,
      estimateProfit,
      estimateProfitValue,
      estimateProfitPercent,
      sinceAddedChangePercent,
      sinceAddedChangeValue,
      sinceAddedDate,
      sinceAddedDateRaw: sinceAddedDateRaw || undefined,
      holdingAmount,
      holdingAmountValue,
      holdingRatioValue,
      holdingCost,
      holdingCostValue,
      costNav,
      costNavValue,
      holdingDaysValue,
      todayProfit,
      todayProfitPercent,
      todayProfitValue,
      yesterdayProfit,
      yesterdayProfitValue: yesterdayProfitVal,
      yesterdayProfitPercent: yesterdayProfitPercentLine,
      yesterdaySecondLinePctValue,
      holdingProfit,
      holdingProfitPercent,
      holdingProfitValue,
      holdingTargetGroupId:
        currentTab === SUMMARY_TAB_ID ? summaryHoldingSourceGroupByCode[f.code] : undefined,
    };
  });
}

/**
 * 按当前分组作用域，把「按 scope 分桶的每日收益」派生成 `{ [code]: 序列 }`。
 *
 * 逻辑此前内联在 FundPage 的 `currentFundDailyEarnings` useMemo 中（约 108 行）。
 * 作用域解析顺序：
 * 1. 自定义分组 → 直接取该分组桶；
 * 2. 汇总分组 → 按每个 code 的来源分组逐个取桶（来源为全局时映射到 `all` 桶）；
 * 3. 其余（全部 / 自选）→ 全局桶打底，再把关联分组的同 code 记录按日期合并覆盖。
 *
 * 合并时同一天多条记录会累加 earnings，并按以下优先级确定 rate：
 * 成本快照金额 > 单条记录自带的 rate > 当前关联持仓成本兜底（兼容缺少快照的旧数据）。
 *
 * @param {object} params
 * @param {Record<string, Record<string, Array>>} params.fundDailyEarnings 分桶后的每日收益
 * @param {string|null} params.activeGroupId 当前自定义分组 id（非自定义分组时为 null）
 * @param {string} params.currentTab 当前分组 id
 * @param {Record<string, string>} params.summaryHoldingSourceGroupByCode 汇总分组下每个 code 的来源分组
 * @param {{ linked?: Set<string>, groupIdsByCode?: Record<string, string[]> }|null} params.linkedHoldingsForAllFav
 * @param {Record<string, Record<string, object>>} params.groupHoldings 各分组持仓（算兜底成本用）
 * @returns {Record<string, Array>} 当前作用域下按 code 的每日收益序列
 */
export function buildScopedDailyEarnings({
  fundDailyEarnings,
  activeGroupId,
  currentTab,
  summaryHoldingSourceGroupByCode,
  linkedHoldingsForAllFav,
  groupHoldings,
}) {
  if (!isPlainObject(fundDailyEarnings)) return {};

  const getScopeBucket = (scopeKey) => {
    const scoped = fundDailyEarnings[scopeKey];
    return isPlainObject(scoped) ? scoped : {};
  };

  if (activeGroupId) {
    return getScopeBucket(activeGroupId);
  }

  if (currentTab === SUMMARY_TAB_ID) {
    const out = {};
    Object.entries(summaryHoldingSourceGroupByCode || {}).forEach(([code, source]) => {
      const scopeKey = source === SUMMARY_SOURCE_GLOBAL ? DAILY_EARNINGS_SCOPE_ALL : source;
      const bucket = getScopeBucket(scopeKey);
      const list = bucket[code];
      if (Array.isArray(list) && list.length > 0) out[code] = list;
    });
    return out;
  }

  const globalBucket = getScopeBucket(DAILY_EARNINGS_SCOPE_ALL);

  if (currentTab !== 'all' && currentTab !== 'fav') {
    return globalBucket;
  }

  const linkedCodes = linkedHoldingsForAllFav?.linked;
  if (!(linkedCodes instanceof Set) || linkedCodes.size === 0) {
    return globalBucket;
  }

  const out = { ...globalBucket };
  const groupIdsByCode = linkedHoldingsForAllFav?.groupIdsByCode || {};

  for (const code of linkedCodes) {
    const groupIds = Array.isArray(groupIdsByCode[code]) ? groupIdsByCode[code] : [];
    if (groupIds.length === 0) continue;

    let fallbackPrincipalCurrent = 0;
    for (const gid of groupIds) {
      const h = groupHoldings?.[gid]?.[code];
      if (!h) continue;
      const share = Number(h.share);
      const cost = Number(h.cost);
      if (!Number.isFinite(share) || share <= 0) continue;
      if (!Number.isFinite(cost) || cost <= 0) continue;
      fallbackPrincipalCurrent += cost * share;
    }

    const byDate = new Map();
    for (const gid of groupIds) {
      const bucket = getScopeBucket(gid);
      const list = bucket[code];
      if (!Array.isArray(list) || list.length === 0) continue;

      for (const item of list) {
        const date = item?.date ? String(item.date) : '';
        const earnings = Number(item?.earnings);
        const rate = Number(item?.rate);
        const baseCostAmount = Number(item?.baseCostAmount);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        if (!Number.isFinite(earnings)) continue;
        const prev = byDate.get(date) || { earnings: 0, rowCount: 0, singleRate: null, rateCount: 0, baseCostAmount: 0 };
        prev.earnings += earnings;
        prev.rowCount += 1;
        if (Number.isFinite(rate)) {
          prev.rateCount += 1;
          if (prev.singleRate == null) prev.singleRate = rate;
        }
        if (Number.isFinite(baseCostAmount) && baseCostAmount > 0) {
          prev.baseCostAmount += baseCostAmount;
        }
        byDate.set(date, prev);
      }
    }

    if (byDate.size > 0) {
      out[code] = [...byDate.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, row]) => {
          const earnings = row.earnings;
          const baseCostAmount = Number.isFinite(row.baseCostAmount) && row.baseCostAmount > 0
            ? row.baseCostAmount
            : null;
          let rate = null;
          if (baseCostAmount != null) {
            rate = (earnings / baseCostAmount) * 100;
          } else if (row.rowCount === 1 && row.rateCount === 1 && Number.isFinite(row.singleRate)) {
            rate = row.singleRate;
          } else if (Number.isFinite(fallbackPrincipalCurrent) && fallbackPrincipalCurrent > 0) {
            // 兼容旧数据：历史记录缺少快照且无 rate 时，用当前关联持仓成本兜底展示
            rate = (earnings / fallbackPrincipalCurrent) * 100;
          }
          return { date, earnings, rate, baseCostAmount };
        });
    }
  }

  return out;
}

/**
 * 把当前作用域下的每日收益转换成「按 code 的最新一条 + 日期索引」，
 * 供 PC 表格快速按日期取当日收益。
 *
 * 逻辑此前内联在 FundPage 的 `latestDailyByCode` useMemo 中。
 *
 * @param {Record<string, Array>} dailyEarningsByCode 当前作用域下的每日收益
 * @param {Array} displayFunds 展示用基金列表（只对这些 code 建索引）
 * @returns {Record<string, { byDate: Map<string, object>, last: object }>}
 */
export function buildLatestDailyByCode(dailyEarningsByCode, displayFunds) {
  const out = {};
  if (!isPlainObject(dailyEarningsByCode)) return out;
  for (const f of displayFunds) {
    const code = f?.code;
    if (!code) continue;
    const list = dailyEarningsByCode[code];
    if (!Array.isArray(list) || list.length === 0) continue;
    const byDate = new Map();
    for (const item of list) {
      const date = item?.date ? String(item.date) : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      byDate.set(date, item);
    }
    out[code] = { byDate, last: list[list.length - 1] };
  }
  return out;
}
