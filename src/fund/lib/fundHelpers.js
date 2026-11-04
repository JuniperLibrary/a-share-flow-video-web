import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { isNumber, isString, isPlainObject } from 'lodash';
import { TAG_THEME_OPTIONS } from '../components/AddTagDialog';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

const DEFAULT_TZ = 'Asia/Shanghai';
export const getBrowserTimeZone = () => {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || DEFAULT_TZ;
  }
  return DEFAULT_TZ;
};

export const TZ = getBrowserTimeZone();
dayjs.tz.setDefault(TZ);
export const nowInTz = () => dayjs().tz(TZ);
export const toTz = (input) => (input ? dayjs.tz(input, TZ) : nowInTz());
export const formatDate = (input) => toTz(input).format('YYYY-MM-DD');

/** 定投计划分桶：全局与其它自定义分组 */
export const DCA_SCOPE_GLOBAL = '__global__';
/** 虚拟 Tab：多分组有持仓时的汇总视图（非真实分组 id） */
export const SUMMARY_TAB_ID = '__portfolio_groups_summary__';
/** 汇总合并持仓映射中：表示该笔展示来自「全部」全局持仓（非真实分组 id） */
export const SUMMARY_SOURCE_GLOBAL = '__portfolio_summary_global__';
export const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/** 独立存储的基金标签默认主题（localStorage `tags`） */
export const DEFAULT_FUND_TAG_THEME = 'default';

/** 与 AddTagDialog TAG_THEME_OPTIONS 的 key 一致（单一数据源，避免漏改） */
const ALLOWED_FUND_TAG_THEMES = new Set(TAG_THEME_OPTIONS.map((o) => o.key));

export function normalizeFundTagTheme(t) {
  const s = String(t ?? '').trim();
  return ALLOWED_FUND_TAG_THEMES.has(s) ? s : DEFAULT_FUND_TAG_THEME;
}

/**
 * 单只基金已选标签实例（允许同名多枚）。
 * @returns {{ id: string, name: string, theme: string }[]}
 */
export function normalizeFundTagInstanceListFromInput(rows) {
  const out = [];
  const usedIds = new Set();
  for (const r of rows || []) {
    if (!r || typeof r !== 'object') continue;
    const name = String(r.name ?? '').trim();
    if (!name || name.length > 24) continue;
    let id = String(r.id ?? '').trim();
    if (!id || usedIds.has(id)) id = uuidv4();
    usedIds.add(id);
    out.push({
      id,
      name,
      theme: normalizeFundTagTheme(r.theme),
    });
    if (out.length >= 30) break;
  }
  return out;
}

/** 从基金对象中移除旧版内联字段 `tags`（已迁移到独立 `tags` 存储） */
export function stripLegacyTagsFromFundObject(f) {
  if (!f || typeof f !== 'object' || !hasOwn(f, 'tags')) return f;
  const { tags: _removed, ...rest } = f;
  return rest;
}

/** 从标签记录读取基金代码列表（仅 `fundCodes`） */
export function getFundCodesFromTagRecord(r) {
  if (!r || typeof r !== 'object' || !Array.isArray(r.fundCodes)) return [];
  return [...new Set(r.fundCodes.map((c) => String(c).trim()).filter(Boolean))];
}

/** 仅保留 id / name / theme / fundCodes（fundCodes 可为空：仅存在于可选池、尚未挂到任何基金） */
export function sanitizeTagRowForStorage(r) {
  if (!r || typeof r !== 'object') return null;
  const name = String(r.name ?? '').trim();
  const codes = getFundCodesFromTagRecord(r);
  if (!name) return null;
  return {
    id: String(r.id ?? '').trim() || uuidv4(),
    name,
    theme: String(r.theme ?? '').trim() || DEFAULT_FUND_TAG_THEME,
    fundCodes: codes.sort(),
  };
}

/** 用于判断标签列表是否实质变化（避免无意义的 setItem） */
export function serializeTagRecordsForCompare(rows) {
  return JSON.stringify(
    [...(rows || [])]
      .map((r) => ({
        id: String(r?.id ?? ''),
        name: String(r?.name ?? '').trim(),
        theme: String(r?.theme ?? '').trim(),
        fundCodes: getFundCodesFromTagRecord(r).slice().sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

/** 同名标签合并为一条，基金代码取并集（用于迁移与保存去重） */
export function mergeTagRowsByName(rows) {
  const byName = new Map();
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const nm = String(row.name ?? '').trim();
    if (!nm) continue;
    const codes = getFundCodesFromTagRecord(row);
    const ex = byName.get(nm);
    if (ex) {
      ex.fundCodes = [...new Set([...ex.fundCodes, ...codes])].sort();
    } else {
      byName.set(nm, {
        id: String(row.id ?? '').trim(),
        name: nm,
        theme: String(row.theme ?? '').trim() || DEFAULT_FUND_TAG_THEME,
        fundCodes: [...codes].sort(),
      });
    }
  }
  return Array.from(byName.values());
}

export function cloneHoldingDeep(src) {
  if (!isPlainObject(src)) return null;
  try {
    return typeof structuredClone === 'function' ? structuredClone(src) : JSON.parse(JSON.stringify(src));
  } catch {
    return { ...src };
  }
}

/** 规范化单条持仓（与 collectLocalPayload 清洗逻辑对齐） */
export function normalizeHoldingEntryForSeed(value) {
  if (!isPlainObject(value)) return null;
  const parsedShare = isNumber(value.share)
    ? value.share
    : isString(value.share)
      ? Number(value.share)
      : NaN;
  const parsedCost = isNumber(value.cost)
    ? value.cost
    : isString(value.cost)
      ? Number(value.cost)
      : NaN;
  const nextShare = Number.isFinite(parsedShare) ? parsedShare : null;
  const nextCost = Number.isFinite(parsedCost) ? parsedCost : null;
  if (nextShare === null && nextCost === null) return null;
  return { ...value, share: nextShare, cost: nextCost };
}

/**
 * 幂等：按分组用全局持仓填空槽；剔除已删除分组的 key；多分组各得深拷贝。
 */
export function seedGroupHoldingsFromGlobal(globalHoldings, groups, prevGroupHoldings) {
  const prev = isPlainObject(prevGroupHoldings) ? prevGroupHoldings : {};
  const groupIdSet = new Set(groups.map((g) => g?.id).filter(Boolean));
  const next = {};
  for (const id of groupIdSet) {
    next[id] = { ...(isPlainObject(prev[id]) ? prev[id] : {}) };
  }
  let changed = Object.keys(prev).some((id) => !groupIdSet.has(id));
  if (!changed && Object.keys(next).length !== Object.keys(prev).filter((id) => groupIdSet.has(id)).length) {
    changed = true;
  }
  if (isPlainObject(globalHoldings)) {
    for (const g of groups) {
      if (!g?.id || !groupIdSet.has(g.id)) continue;
      const bucket = next[g.id];
      for (const code of g.codes || []) {
        if (!code || bucket[code] !== undefined) continue;
        const norm = normalizeHoldingEntryForSeed(globalHoldings[code]);
        if (!norm) continue;
        const cloned = cloneHoldingDeep(norm);
        if (cloned) {
          bucket[code] = cloned;
          changed = true;
        }
      }
    }
  }
  if (!changed) {
    const prevKeys = Object.keys(prev).sort();
    const nextKeys = Object.keys(next).sort();
    if (prevKeys.join(',') !== nextKeys.join(',')) changed = true;
    else {
      for (const id of nextKeys) {
        if (JSON.stringify(next[id]) !== JSON.stringify(prev[id])) {
          changed = true;
          break;
        }
      }
    }
  }
  return { next, changed };
}

/** 旧版扁平 dcaPlans（code -> plan）→ { __global__: { ... } } */
export function migrateDcaPlansToScoped(raw) {
  if (!isPlainObject(raw)) return { [DCA_SCOPE_GLOBAL]: {} };
  if (raw[DCA_SCOPE_GLOBAL] !== undefined && isPlainObject(raw[DCA_SCOPE_GLOBAL])) {
    return raw;
  }
  return { [DCA_SCOPE_GLOBAL]: { ...raw } };
}

/**
 * 把拖拽事件里的 active / over id（即基金代码）解析为重排所需的索引对。
 * 行标识统一使用 `code`，PC 与 Mobile 表格共用同一规则。
 * @returns {{ oldIndex: number, newIndex: number } | null} 无效拖拽返回 null
 */
export function resolveReorderIndexes(data, activeId, overId) {
  if (!activeId || !overId || activeId === overId) return null;
  const list = Array.isArray(data) ? data : [];
  const oldIndex = list.findIndex((item) => item.code === activeId);
  const newIndex = list.findIndex((item) => item.code === overId);
  if (oldIndex === -1 || newIndex === -1) return null;
  return { oldIndex, newIndex };
}

/** dnd-kit sortable 会给节点 tabIndex=0，拖拽聚焦时浏览器会把页面滚到该元素 */
export function sortableRowA11yProps(attributes) {
  if (!attributes) return {};
  const { tabIndex: _ignored, ...rest } = attributes;
  return { ...rest, tabIndex: -1 };
}

/** 拖拽期间锁死页面滚动，避免 dnd-kit 自动滚动与页面滚动叠加 */
export function beginDragScrollLock(scrollYRef, rafRef) {
  scrollYRef.current = window.scrollY;
  const tick = () => {
    if (window.scrollY !== scrollYRef.current) {
      window.scrollTo(0, scrollYRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  };
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  rafRef.current = requestAnimationFrame(tick);
}

/** 结束拖拽滚动锁并复位滚动位置 */
export function endDragScrollLock(scrollYRef, rafRef) {
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  rafRef.current = null;
  if (window.scrollY !== scrollYRef.current) {
    window.scrollTo(0, scrollYRef.current);
  }
}

/**
 * 创建单只基金的持仓收益计算器。
 *
 * 逻辑此前内联在 FundPage 的 `getHoldingProfit` useCallback 中（约 105 行），
 * 与组件作用域的 4 个状态耦合。这里改为「先绑定上下文、再逐次调用」的工厂：
 * 返回的函数签名与原 useCallback 完全一致 `(fund, holding, scopeGroupIdOverride)`，
 * 因此调用方（含循环内的高频调用）无需改动，也不会产生额外的临时对象。
 *
 * 几个关键口径（保持与原实现一致）：
 * - 当日收益按「昨日收盘时持有份额」计算：份额基数 = 当前份额 - 当日买入 + 当日卖出；
 * - 持仓金额与总收益一律使用确权净值 dwjz，估值只用于「当日」收益；
 * - 交易日且今日净值未出时，强制走估值口径（`useValuation`）。
 *
 * @param {object} ctx
 * @param {string} ctx.todayStr 今日日期（YYYY-MM-DD）
 * @param {boolean} ctx.isTradingDay 今日是否为交易日
 * @param {Record<string, Array>} ctx.transactions 交易流水：{ [code]: Tx[] }
 * @param {string|null} ctx.activeGroupId 当前分组 id（非 all/fav/汇总时为分组 id）
 * @returns {(fund: object, holding: object, scopeGroupIdOverride?: string|null) => ({ amount: number, nav: number, profitToday: number|null, profitTotal: number|null, principalToday: number } | null)}
 */
export function createHoldingProfitCalculator({ todayStr, isTradingDay, transactions, activeGroupId }) {
  return function getHoldingProfit(fund, holding, scopeGroupIdOverride) {
    if (!holding || !isNumber(holding.share)) return null;

    const txScope = scopeGroupIdOverride !== undefined ? scopeGroupIdOverride : activeGroupId;

    const hasTodayData = fund.jzrq === todayStr;
    const hasTodayValuation = isString(fund.gztime) && fund.gztime.startsWith(todayStr);
    const canCalcTodayProfit = hasTodayData || hasTodayValuation;

    // 如果是交易日且9点以后，且今日净值未出，则强制使用估值（隐藏涨跌幅列模式）
    const useValuation = isTradingDay && !hasTodayData;

    let currentNav;
    let profitToday;
    let shareForTodayProfit = holding.share;

    if (canCalcTodayProfit) {
      // 当日收益口径：按“昨日收盘时持有份额”计算，避免把当日买入份额算进当日收益。
      // 份额基数 = 当前份额 - 当日买入份额 + 当日卖出份额（卖出份额在开盘前仍持有，应计入当日涨跌）
      let buyToday = 0;
      let sellToday = 0;
      const list = transactions && fund?.code ? (transactions[fund.code] || []) : [];
      for (const tx of list) {
        if (!tx || tx.date !== todayStr) continue;
        const gid = tx.groupId || null;
        if (txScope) {
          if (gid !== txScope) continue;
        } else {
          if (gid) continue;
        }
        if (tx.isHistoryOnly) continue;
        const s = Number(tx.share);
        if (!Number.isFinite(s) || s <= 0) continue;
        if (tx.type === 'buy') buyToday += s;
        else if (tx.type === 'sell') sellToday += s;
      }
      shareForTodayProfit = Math.max(0, holding.share - buyToday + sellToday);
    }

    if (!useValuation) {
      // 使用确权净值 (dwjz)
      currentNav = Number(fund.dwjz);
      if (!currentNav) return null;

      if (canCalcTodayProfit) {
        const amount = shareForTodayProfit * currentNav;
        // 优先使用昨日净值直接计算（更精确，避免涨跌幅四舍五入误差）
        const lastNav = fund.lastNav != null && fund.lastNav !== '' ? Number(fund.lastNav) : null;
        if (lastNav && Number.isFinite(lastNav) && lastNav > 0) {
          profitToday = (currentNav - lastNav) * shareForTodayProfit;
        } else {
          const gz = isString(fund.gztime) ? toTz(fund.gztime) : null;
          const jz = isString(fund.jzrq) ? toTz(fund.jzrq) : null;
          const preferGszzl =
            !!gz &&
            !!jz &&
            gz.isValid() &&
            jz.isValid() &&
            gz.startOf('day').isAfter(jz.startOf('day'));

          let rate;
          if (preferGszzl) {
            rate = Number(fund.gszzl);
          } else {
            const zzl = fund.zzl !== undefined ? Number(fund.zzl) : Number.NaN;
            rate = Number.isFinite(zzl) ? zzl : Number(fund.gszzl);
          }
          if (!Number.isFinite(rate)) rate = 0;
          profitToday = amount - (amount / (1 + rate / 100));
        }
      } else {
        profitToday = null;
      }
    } else {
      // 否则使用估值
      currentNav = isNumber(fund.gsz) ? fund.gsz : Number(fund.dwjz);

      if (!currentNav) return null;

      if (canCalcTodayProfit) {
        const amount = shareForTodayProfit * currentNav;
        // 估算涨幅
        const gzChange = Number(fund.gszzl) || 0;
        profitToday = amount - (amount / (1 + gzChange / 100));
      } else {
        profitToday = null;
      }
    }

    // 持仓金额强制使用确权净值
    const exactNav = Number(fund.dwjz) || currentNav;
    const amount = holding.share * exactNav;

    // 总收益 = (确权净值 - 成本价) * 份额
    const profitTotal = isNumber(holding.cost)
      ? (exactNav - holding.cost) * holding.share
      : null;

    return {
      amount,
      nav: exactNav,
      profitToday,
      profitTotal,
      principalToday: isNumber(holding.cost) ? holding.cost * shareForTodayProfit : 0
    };
  };
}
