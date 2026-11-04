import { useMemo } from 'react';

/**
 * PC / Mobile 基金表格共用的「分组 → 设置项」派生逻辑。
 *
 * 两个表格的设置弹窗都需要「当前分组名」和「可同步设置的目标分组列表」，
 * 取值规则完全一致，此前各自复制了一份，规则调整要双改，抽到此处共用。
 *
 * @param {object} options
 * @param {string} options.currentTab 当前分组标识
 * @param {Array}  options.groups     自定义分组列表
 */
export function useFundGroupOptions({ currentTab, groups }) {
  const groupKey = currentTab ?? 'all';

  const currentGroupName = useMemo(() => {
    if (groupKey === 'all') return '全部';
    if (groupKey === 'fav') return '自选';
    return groups.find((g) => g?.id === groupKey)?.name || '当前';
  }, [groupKey, groups]);

  const settingSyncOptions = useMemo(() => {
    const baseOptions = [
      { id: 'all', name: '全部', description: '全部分组' },
      { id: 'fav', name: '自选', description: '自选分组' },
      ...(Array.isArray(groups) ? groups : []).map((group) => ({
        id: group?.id,
        name: group?.name || '未命名',
        description: '自定义分组',
      })),
    ];
    const seen = new Set();
    // 排除当前分组自身，并按 id 去重
    return baseOptions.filter((item) => {
      const id = String(item?.id ?? '').trim();
      if (!id || id === groupKey || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [groupKey, groups]);

  return { groupKey, currentGroupName, settingSyncOptions };
}
