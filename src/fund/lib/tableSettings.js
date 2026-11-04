import { storageStore } from '@fund/stores';

/**
 * 读取 `customSettings`，并把历史遗留的顶层表格设置迁移到 `all` 分组下。
 *
 * 早期版本把 PC / Mobile 的列顺序、列可见性、列宽直接存在 `customSettings` 顶层，
 * 之后改为按分组存储（`parsed[groupKey]`）。这里是读取侧的幂等迁移：
 * 首次读到旧结构时会回写存储，之后调用不再触发写入。
 *
 * PC 与 Mobile 表格读取的是同一份配置，此前各自复制了一份实现，
 * 故抽到此处共用，避免两端迁移规则出现分歧。
 */
export function getCustomSettingsWithMigration() {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = storageStore.getItem('customSettings') || {};
    if (!parsed || typeof parsed !== 'object') return {};
    if (parsed.pcTableColumnOrder != null || parsed.pcTableColumnVisibility != null || parsed.pcTableColumns != null || parsed.mobileTableColumnOrder != null || parsed.mobileTableColumnVisibility != null) {
      const all = {
        ...(parsed.all && typeof parsed.all === 'object' ? parsed.all : {}),
        pcTableColumnOrder: parsed.pcTableColumnOrder,
        pcTableColumnVisibility: parsed.pcTableColumnVisibility,
        pcTableColumns: parsed.pcTableColumns,
        mobileTableColumnOrder: parsed.mobileTableColumnOrder,
        mobileTableColumnVisibility: parsed.mobileTableColumnVisibility,
      };
      delete parsed.pcTableColumnOrder;
      delete parsed.pcTableColumnVisibility;
      delete parsed.pcTableColumns;
      delete parsed.mobileTableColumnOrder;
      delete parsed.mobileTableColumnVisibility;
      parsed.all = all;
      storageStore.setItem('customSettings', JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return {};
  }
}
