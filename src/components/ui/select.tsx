import { useState, useRef, useEffect, useCallback } from 'react';
import { IconDown } from '@arco-design/web-react/icon';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options = [],
  placeholder = '请选择',
  className,
  style,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((optionValue: string | number) => {
    onChange?.(optionValue);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div ref={containerRef} className={`relative ${className || ''}`} style={style}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-[34px] rounded-lg text-xs transition-all cursor-pointer"
        style={{
          width: style?.width || '100%',
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isOpen ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.08)'}`,
          color: selectedOption ? '#e5e7eb' : '#6b7280',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span className="flex-1 text-left truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <IconDown
          style={{
            fontSize: 11,
            color: isOpen ? '#22d3ee' : '#6b7280',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          className="absolute z-50 mt-1 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1"
          style={{
            width: '100%',
            minWidth: style?.width || '100%',
            background: 'rgba(15,23,42,0.98)',
            border: '1px solid rgba(34,211,238,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(34,211,238,0.05)',
          }}
        >
          <div className="py-1.5 max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="w-full flex items-center px-3 py-2 text-xs transition-all text-left"
                  style={{
                    color: isSelected ? '#22d3ee' : '#d1d5db',
                    background: isSelected ? 'rgba(34,211,238,0.08)' : 'transparent',
                    fontWeight: isSelected ? 500 : 400,
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span className="flex-1">{option.label}</span>
                  {isSelected && (
                    <span className="text-cyan-400 ml-2">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
