import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * 基金表格（PC / Mobile）共用的批量选择逻辑。
 *
 * 此前两端各维护一份逐字重复的实现：可选基金过滤、失效项清理、
 * 「关联汇总持仓」行剔除、全选/清空、选中列表派生。
 * 规则一旦调整就要双改，容易漏改导致两端行为不一致。
 * 这里把选择规则收敛为单一实现，两端只在 UI 层保留差异
 * （PC 是勾选框 + 批量删除，Mobile 是长按进入编辑模式）。
 *
 * @param {object}  options
 * @param {Array}   options.data       当前分组的基金列表
 * @param {string}  options.currentTab 当前分组标识，切换时清空选择
 * @param {boolean} [options.enabled]  当前分组是否支持批量选择，为 false 时清空选择
 */
export function useFundBatchSelection({ data, currentTab, enabled = true } = {}) {
  const selectableCodes = useMemo(
    () => (Array.isArray(data) ? data.map((d) => d?.code).filter(Boolean) : []),
    [data],
  );

  /** 全部/自选下「关联汇总持仓」行不参与批量选择 */
  const batchSelectableCodes = useMemo(
    () => (Array.isArray(data) ? data.filter((d) => !d?.isHoldingLinked).map((d) => d?.code).filter(Boolean) : []),
    [data],
  );
  const batchSelectableCount = batchSelectableCodes.length;

  const [selectedCodes, setSelectedCodes] = useState(() => new Set());

  // 切换分组时清空选择
  useEffect(() => {
    setSelectedCodes(new Set());
  }, [currentTab]);

  // 当前分组不支持批量操作时清空选择
  useEffect(() => {
    if (!enabled) setSelectedCodes(new Set());
  }, [enabled]);

  // 数据变化后丢弃已不在当前列表中的选中项
  useEffect(() => {
    setSelectedCodes((prev) => {
      if (!prev?.size) return prev;
      const allowed = new Set(selectableCodes);
      let changed = false;
      const next = new Set();
      for (const c of prev) {
        if (allowed.has(c)) next.add(c);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [selectableCodes]);

  // 「关联汇总持仓」行不参与批量选择，需要从已选中集合中剔除
  useEffect(() => {
    const linkedCodes = new Set(
      (Array.isArray(data) ? data : [])
        .filter((d) => d && d.isHoldingLinked && d.code)
        .map((d) => d.code),
    );
    if (!linkedCodes.size) return;
    setSelectedCodes((prev) => {
      if (!prev?.size) return prev;
      let changed = false;
      const next = new Set(prev);
      for (const c of linkedCodes) {
        if (next.delete(c)) changed = true;
      }
      return changed ? next : prev;
    });
  }, [data]);

  const toggleSelected = useCallback((code, checked) => {
    if (!code) return;
    const row = Array.isArray(data) ? data.find((d) => d?.code === code) : null;
    if (row?.isHoldingLinked) return;
    setSelectedCodes((prev) => {
      const next = new Set(prev || []);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  }, [data]);

  const setAllSelected = useCallback((checked) => {
    setSelectedCodes(() => {
      if (!checked) return new Set();
      return new Set(batchSelectableCodes);
    });
  }, [batchSelectableCodes]);

  const clearSelected = useCallback(() => setSelectedCodes(new Set()), []);

  const selectedCount = selectedCodes?.size || 0;
  const selectedCodesList = useMemo(() => Array.from(selectedCodes || []), [selectedCodes]);

  return {
    selectableCodes,
    batchSelectableCodes,
    batchSelectableCount,
    selectedCodes,
    setSelectedCodes,
    selectedCount,
    selectedCodesList,
    toggleSelected,
    setAllSelected,
    clearSelected,
  };
}
