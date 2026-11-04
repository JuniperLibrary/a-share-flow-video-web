import { isPlainObject } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { dedupeByCode } from './normalize';
import {
  DEFAULT_FUND_TAG_THEME,
  getFundCodesFromTagRecord,
  migrateDcaPlansToScoped,
  sanitizeTagRowForStorage,
  stripLegacyTagsFromFundObject,
} from './fundHelpers';

/**
 * 本地数据导入（FundPage 的 `handleImportFileChange`）所用的纯合并函数。
 *
 * 这些合并规则此前内联在导入处理函数里，与 setState 交织在一起，单函数超过 300 行，
 * 难以单独推理与验证。这里把「纯计算」部分抽出来，只做 输入 → 输出，
 * 调用方负责把结果写回状态。合并语义与原实现逐条对齐。
 */

/**
 * 基金列表合并：保留当前基金，仅追加导入数据中尚不存在的新基金。
 * @returns {{ mergedFunds: Array, appendedCodes: string[] }}
 */
export function mergeFundsForImport(currentFunds, incomingFunds) {
  const current = Array.isArray(currentFunds) ? currentFunds : [];
  const incoming = dedupeByCode(
    (Array.isArray(incomingFunds) ? incomingFunds : []).map(stripLegacyTagsFromFundObject),
  );
  const existingCodes = new Set(current.map((f) => f?.code));
  const newItems = incoming.filter((f) => f && f.code && !existingCodes.has(f.code));
  return { mergedFunds: [...current, ...newItems], appendedCodes: newItems.map((f) => f.code) };
}

/** 分组合并：同 id 合并 codes 取并集，新 id 直接追加 */
export function mergeGroupsForImport(currentGroups, incomingGroups) {
  const merged = [...(Array.isArray(currentGroups) ? currentGroups : [])];
  for (const incomingGroup of Array.isArray(incomingGroups) ? incomingGroups : []) {
    const idx = merged.findIndex((g) => g?.id === incomingGroup?.id);
    if (idx > -1) {
      merged[idx] = {
        ...merged[idx],
        codes: Array.from(new Set([...(merged[idx].codes || []), ...(incomingGroup.codes || [])])),
      };
    } else {
      merged.push(incomingGroup);
    }
  }
  return merged;
}

/** code 列表合并去重（自选、折叠态等标记集合共用） */
export function mergeUniqueCodeList(current, incoming) {
  return Array.from(
    new Set([...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])]),
  );
}

/** 交易流水合并：按 id 去重，按 timestamp 倒序 */
export function mergeTransactionsForImport(currentTransactions, incomingTransactions) {
  const merged = { ...(isPlainObject(currentTransactions) ? currentTransactions : {}) };
  if (!isPlainObject(incomingTransactions)) return merged;
  Object.entries(incomingTransactions).forEach(([code, txs]) => {
    if (!Array.isArray(txs)) return;
    const existing = merged[code] || [];
    const existingIds = new Set(existing.map((t) => t.id));
    const newTxs = txs.filter((t) => !existingIds.has(t.id));
    merged[code] = [...existing, ...newTxs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  });
  return merged;
}

/** 待确认交易的去重键：优先用 id，缺 id 时按业务字段拼合 */
function pendingTradeKey(trade) {
  if (trade?.id) return `id:${trade.id}`;
  return `k:${trade?.groupId || ''}:${trade?.fundCode || ''}:${trade?.type || ''}:${trade?.date || ''}:${trade?.share || ''}:${trade?.amount || ''}:${trade?.isAfter3pm ? 1 : 0}`;
}

/** 待确认交易合并：仅保留仍存在于基金列表中的数据，按去重键覆盖 */
export function mergePendingTradesForImport(existingPending, incomingPending, validCodes) {
  const codeSet = validCodes instanceof Set ? validCodes : new Set(validCodes || []);
  const merged = new Map();
  const put = (trade) => {
    if (!trade || !codeSet.has(trade.fundCode)) return;
    merged.set(pendingTradeKey(trade), trade);
  };
  (Array.isArray(existingPending) ? existingPending : []).forEach(put);
  (Array.isArray(incomingPending) ? incomingPending : []).forEach(put);
  return Array.from(merged.values());
}

/** 分组持仓合并：按分组 id 浅合并，导入值覆盖本地值 */
export function mergeGroupHoldingsForImport(currentGroupHoldings, incomingGroupHoldings) {
  const merged = { ...(isPlainObject(currentGroupHoldings) ? currentGroupHoldings : {}) };
  if (!isPlainObject(incomingGroupHoldings)) return merged;
  Object.entries(incomingGroupHoldings).forEach(([gid, bucket]) => {
    if (!isPlainObject(bucket)) return;
    merged[gid] = { ...(merged[gid] || {}), ...bucket };
  });
  return merged;
}

/** 定投计划合并：先迁移到分组作用域结构，再按作用域浅合并 */
export function mergeDcaPlansForImport(currentDcaPlans, incomingDcaPlans) {
  const merged = { ...migrateDcaPlansToScoped(currentDcaPlans) };
  const incomingScoped = migrateDcaPlansToScoped(incomingDcaPlans);
  Object.keys(incomingScoped).forEach((scope) => {
    merged[scope] = {
      ...(isPlainObject(merged[scope]) ? merged[scope] : {}),
      ...(isPlainObject(incomingScoped[scope]) ? incomingScoped[scope] : {}),
    };
  });
  return merged;
}

/**
 * 标签合并：同 id 合并 fundCodes 取并集，新 id 直接加入；
 * 仅保留仍存在于基金列表中的 code，最后按 id 排序。
 */
export function mergeTagRecordsForImport(currentTags, incomingTags, validCodes) {
  const codeSet = validCodes instanceof Set ? validCodes : new Set(validCodes || []);
  const byId = new Map(
    (Array.isArray(currentTags) ? currentTags : []).map((r) => [String(r.id), r]),
  );
  for (const r of Array.isArray(incomingTags) ? incomingTags : []) {
    if (!r || typeof r !== 'object') continue;
    const codes = getFundCodesFromTagRecord(r).filter((c) => codeSet.has(c));
    const name = String(r.name ?? '').trim();
    if (!name) continue;
    const id = String(r.id ?? '').trim() || uuidv4();
    const existing = byId.get(id);
    const mergedCodes = existing
      ? [...new Set([...getFundCodesFromTagRecord(existing), ...codes])].sort()
      : codes.sort();
    const row = sanitizeTagRowForStorage({
      id,
      name,
      theme: String(r.theme ?? '').trim() || DEFAULT_FUND_TAG_THEME,
      fundCodes: mergedCodes,
    });
    if (row) byId.set(id, row);
  }
  return Array.from(byId.values())
    .map(sanitizeTagRowForStorage)
    .filter(Boolean)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}
