'use client';

import { ChevronRight } from 'lucide-react';

export default function MineTab({
  visible = true,
  onMyEarnings,
  onTutorial,
  onUpdateLog,
  onFeedback,
  onSponsorSupport,
}) {
  return (
    <div
      className="mine-tab"
      style={{ display: visible ? undefined : 'none' }}
      aria-hidden={!visible || undefined}
    >
      <section className="mine-profile-card glass" aria-label="个人信息">
        <div className="mine-profile-row">
          <div className="mine-profile-avatar">
            <span className="mine-profile-avatar-fallback muted">?</span>
          </div>
          <div className="mine-profile-text">
            <div className="mine-profile-title">基金宝</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              数据仅保存在本机
            </div>
          </div>
        </div>
      </section>

      <ul className="mine-menu-list" role="list">
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onMyEarnings}>
            <span className="mine-menu-label">我的收益</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onTutorial}>
            <span className="mine-menu-label">使用帮助</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onUpdateLog}>
            <span className="mine-menu-label">更新日志</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onFeedback}>
            <span className="mine-menu-label">问题反馈</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
        <li>
          <button type="button" className="mine-menu-row glass" onClick={onSponsorSupport}>
            <span className="mine-menu-label">赞助支持</span>
            <ChevronRight className="mine-menu-chevron" aria-hidden strokeWidth={2} />
          </button>
        </li>
      </ul>
    </div>
  );
}
