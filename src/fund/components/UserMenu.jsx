'use client';
import { useIsMobile } from '@fund/hooks/useIsMobile';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { CalendarIcon, SettingsIcon, ListIcon } from './Icons';

export default function UserMenu({navbarHeight,
  onOpenSettings,
  onOpenPortfolioEarnings,
  onTutorial,
  onUpdateLog}) {
  const isMobile = useIsMobile();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <div className="user-menu-container" ref={userMenuRef}>
      <button
        className="icon-button user-menu-trigger"
        aria-label="菜单"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        title="菜单"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      <AnimatePresence>
        {userMenuOpen && (
          <motion.div
            className="user-menu-dropdown glass"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ transformOrigin: 'top right', top: navbarHeight + (isMobile ? -20 : 10) }}
          >
            <button
              className="user-menu-item"
              onClick={() => {
                setUserMenuOpen(false);
                onOpenPortfolioEarnings?.();
              }}
            >
              <CalendarIcon width="16" height="16" />
              <span>我的收益</span>
            </button>
            <button
              className="user-menu-item"
              onClick={() => {
                setUserMenuOpen(false);
                onTutorial?.();
              }}
            >
              <HelpCircle width="16" height="16" />
              <span>使用帮助</span>
            </button>
            <button
              className="user-menu-item"
              onClick={() => {
                setUserMenuOpen(false);
                onUpdateLog?.();
              }}
            >
              <ListIcon width="16" height="16" />
              <span>更新日志</span>
            </button>
            <button
              className="user-menu-item"
              onClick={() => {
                setUserMenuOpen(false);
                onOpenSettings?.();
              }}
            >
              <SettingsIcon width="16" height="16" />
              <span>设置</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
