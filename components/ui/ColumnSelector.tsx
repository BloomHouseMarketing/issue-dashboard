'use client';

import { useState, useRef, useEffect } from 'react';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface Props {
  columns: ColumnDef[];
  visibleColumns: string[];
  onChange: (visibleKeys: string[]) => void;
}

export default function ColumnSelector({ columns, visibleColumns, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (key: string) => {
    if (visibleColumns.includes(key)) {
      // Don't allow removing all columns
      if (visibleColumns.length <= 1) return;
      onChange(visibleColumns.filter((k) => k !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  const showAll = () => onChange(columns.map((c) => c.key));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg transition-colors border border-[#334155]"
        title="Select columns"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Columns
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50 py-1">
          <div className="px-3 py-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Visible Columns
          </div>
          {columns.map((col) => {
            const isVisible = visibleColumns.includes(col.key);
            return (
              <label
                key={col.key}
                className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#334155] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggle(col.key)}
                  className="w-3.5 h-3.5 rounded border-[#334155]"
                />
                <span className={`text-sm ${isVisible ? 'text-[#F8FAFC]' : 'text-[#64748B]'}`}>
                  {col.label}
                </span>
              </label>
            );
          })}
          <div className="border-t border-[#334155] mt-1 pt-1">
            <button
              onClick={showAll}
              className="w-full text-left px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] transition-colors"
            >
              Show all columns
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
