import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconCalendar } from '@arco-design/web-react/icon';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabledDate?: (date: Date) => boolean;
  className?: string;
  style?: React.CSSProperties;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({ value, onChange, placeholder = '选择日期', disabledDate, className, style }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = parseDate(value);
      if (d) return d;
    }
    return new Date();
  });
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseDate(value) : null;

  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      if (d) setViewDate(d);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handlePrevMonth = useCallback(() => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, []);

  const handlePrevYear = useCallback(() => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  }, []);

  const handleNextYear = useCallback(() => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  }, []);

  const handleSelectDate = useCallback((day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (disabledDate && disabledDate(d)) return;
    onChange?.(formatDate(d));
    setIsOpen(false);
  }, [viewDate, disabledDate, onChange]);

  const handleToday = useCallback(() => {
    const today = new Date();
    const todayStr = formatDate(today);
    if (disabledDate && disabledDate(today)) return;
    onChange?.(todayStr);
    setIsOpen(false);
  }, [disabledDate, onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    setIsOpen(false);
  }, [onChange]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date();
  const todayStr = formatDate(today);
  const selectedStr = selectedDate ? formatDate(selectedDate) : '';

  return (
    <div className={`relative ${className || ''}`} style={style}>
      {/* Input */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const panelWidth = 280;
            const panelHeight = 340;
            const left = Math.min(rect.left, window.innerWidth - panelWidth - 8);
            const top = rect.bottom + 4 + panelHeight > window.innerHeight
              ? rect.top - panelHeight - 4
              : rect.bottom + 4;
            setDropdownPos({ top, left });
          }
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3 h-[34px] rounded-lg text-xs transition-all cursor-pointer"
        style={{
          width: style?.width || 140,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${isOpen ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.08)'}`,
          color: value ? '#e5e7eb' : '#6b7280',
        }}
      >
        <IconCalendar style={{ fontSize: 13, color: isOpen ? '#22d3ee' : '#6b7280' }} />
        <span className="flex-1 text-left truncate">{value || placeholder}</span>
        {value && (
          <span
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-300 transition-colors ml-1"
            style={{ fontSize: 11 }}
          >
            ✕
          </span>
        )}
      </button>

      {/* Dropdown rendered at document.body via portal to avoid ancestor overflow clipping */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: 280,
            zIndex: 9999,
            background: 'rgba(15,23,42,0.98)',
            border: '1px solid rgba(34,211,238,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(34,211,238,0.05)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevYear}
                className="p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                style={{ fontSize: 11 }}
              >
                «
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                style={{ fontSize: 13 }}
              >
                ‹
              </button>
            </div>
            <span className="text-sm font-medium text-white">
              {year}年{month + 1}月
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                style={{ fontSize: 13 }}
              >
                ›
              </button>
              <button
                type="button"
                onClick={handleNextYear}
                className="p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                style={{ fontSize: 11 }}
              >
                »
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-[10px] text-gray-500 py-1 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 px-3 pb-2">
            {days.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-8" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const d = new Date(year, month, day);
              const isDisabled = disabledDate ? disabledDate(d) : false;
              const isSelected = dateStr === selectedStr;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(day)}
                  className="h-8 flex items-center justify-center rounded-lg text-xs transition-all"
                  style={{
                    color: isDisabled
                      ? '#374151'
                      : isSelected
                      ? '#fff'
                      : isToday
                      ? '#22d3ee'
                      : '#d1d5db',
                    background: isSelected
                      ? 'linear-gradient(135deg, #0891b2, #0d9488)'
                      : 'transparent',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    fontWeight: isSelected || isToday ? 600 : 400,
                    boxShadow: isSelected ? '0 0 12px rgba(34,211,238,0.2)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isDisabled && !isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              type="button"
              onClick={handleToday}
              className="text-[11px] px-2 py-1 rounded-md transition-colors"
              style={{
                color: '#22d3ee',
                background: 'rgba(34,211,238,0.08)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(34,211,238,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(34,211,238,0.08)';
              }}
            >
              今天
            </button>
            <span className="text-[10px] text-gray-600">
              {selectedStr || '未选择'}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
