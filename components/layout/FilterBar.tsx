'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useFilters, ISSUE_TYPES } from '@/components/providers/FilterProvider';
import { ISSUE_TYPE_COLORS, SHORT_MONTH_NAMES } from '@/lib/constants';

/** Format "YYYY-MM" → "Mon YYYY" */
function fmtDate(ym: string): string {
  const [y, m] = ym.split('-');
  return `${SHORT_MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

export default function FilterBar() {
  const { filters, filterOptions, setFilter, toggleIssueType, toggleIssueSubType, resetFilters, hasActiveFilters } = useFilters();
  const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
  const [subTypeDropdownOpen, setSubTypeDropdownOpen] = useState(false);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const issueDropdownRef = useRef<HTMLDivElement>(null);
  const subTypeDropdownRef = useRef<HTMLDivElement>(null);
  const dateFromRef = useRef<HTMLDivElement>(null);
  const dateToRef = useRef<HTMLDivElement>(null);

  // Year shown in each picker panel (defaults to current year or the selected value's year)
  const currentYear = new Date().getFullYear();
  const [fromPanelYear, setFromPanelYear] = useState(() =>
    filters.dateFrom ? parseInt(filters.dateFrom.split('-')[0], 10) : currentYear,
  );
  const [toPanelYear, setToPanelYear] = useState(() =>
    filters.dateTo ? parseInt(filters.dateTo.split('-')[0], 10) : currentYear,
  );

  // Sync panel years when filter values change externally (e.g. reset)
  useEffect(() => {
    if (filters.dateFrom) setFromPanelYear(parseInt(filters.dateFrom.split('-')[0], 10));
    else setFromPanelYear(currentYear);
  }, [filters.dateFrom, currentYear]);
  useEffect(() => {
    if (filters.dateTo) setToPanelYear(parseInt(filters.dateTo.split('-')[0], 10));
    else setToPanelYear(currentYear);
  }, [filters.dateTo, currentYear]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(e.target as Node)) {
        setIssueDropdownOpen(false);
      }
      if (subTypeDropdownRef.current && !subTypeDropdownRef.current.contains(e.target as Node)) {
        setSubTypeDropdownOpen(false);
      }
      if (dateFromRef.current && !dateFromRef.current.contains(e.target as Node)) {
        setDateFromOpen(false);
      }
      if (dateToRef.current && !dateToRef.current.contains(e.target as Node)) {
        setDateToOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Build grouped sub-type options based on selected issue types
  const subTypeGroups = useMemo(() => {
    const groups: { type: string; color: string; items: string[] }[] = [];
    const activeTypes = filters.issueTypes.length > 0 ? filters.issueTypes : ISSUE_TYPES;

    if (activeTypes.includes('Rounds') && filterOptions.roundsIssues.length > 0) {
      groups.push({ type: 'Rounds', color: ISSUE_TYPE_COLORS['Rounds'], items: filterOptions.roundsIssues });
    }
    if (activeTypes.includes('Safety') && filterOptions.safetyIssues.length > 0) {
      groups.push({ type: 'Safety', color: ISSUE_TYPE_COLORS['Safety'], items: filterOptions.safetyIssues });
    }
    if (activeTypes.includes('IT') && filterOptions.itIssues.length > 0) {
      groups.push({ type: 'IT', color: ISSUE_TYPE_COLORS['IT'], items: filterOptions.itIssues });
    }

    return groups;
  }, [filters.issueTypes, filterOptions.roundsIssues, filterOptions.safetyIssues, filterOptions.itIssues]);

  const totalSubTypeOptions = subTypeGroups.reduce((sum, g) => sum + g.items.length, 0);

  // Compute a readable label for the sub-type button
  const subTypeLabel = useMemo(() => {
    if (filters.issueSubTypes.length === 0) return 'All Issues';
    if (filters.issueSubTypes.length <= 2) return filters.issueSubTypes.join(', ');
    return `${filters.issueSubTypes.length} selected`;
  }, [filters.issueSubTypes]);

  // Compute date range chip label
  const dateRangeLabel = useMemo(() => {
    if (filters.dateFrom && filters.dateTo) return `${fmtDate(filters.dateFrom)} – ${fmtDate(filters.dateTo)}`;
    if (filters.dateFrom) return `From ${fmtDate(filters.dateFrom)}`;
    if (filters.dateTo) return `To ${fmtDate(filters.dateTo)}`;
    return null;
  }, [filters.dateFrom, filters.dateTo]);

  // Available year range from filterOptions, or fallback
  const minYear = filterOptions.years.length > 0 ? Math.min(...filterOptions.years) : currentYear - 2;
  const maxYear = filterOptions.years.length > 0 ? Math.max(...filterOptions.years) : currentYear + 1;

  const selectClass = 'bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] appearance-none cursor-pointer';

  /** Reusable month+year picker panel */
  function MonthYearPanel({
    panelYear,
    setPanelYear,
    selected,
    onSelect,
    onClear,
    onClose,
  }: {
    panelYear: number;
    setPanelYear: (y: number) => void;
    selected: string | null;
    onSelect: (val: string) => void;
    onClear: () => void;
    onClose: () => void;
  }) {
    const selYear = selected ? parseInt(selected.split('-')[0], 10) : null;
    const selMonth = selected ? parseInt(selected.split('-')[1], 10) : null;

    return (
      <div className="absolute top-full left-0 mt-1 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50 p-2 w-[240px]">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => setPanelYear(Math.max(minYear, panelYear - 1))}
            disabled={panelYear <= minYear}
            className="p-1 rounded hover:bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-[#F8FAFC]">{panelYear}</span>
          <button
            onClick={() => setPanelYear(Math.min(maxYear, panelYear + 1))}
            disabled={panelYear >= maxYear}
            className="p-1 rounded hover:bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {SHORT_MONTH_NAMES.map((m, i) => {
            const monthNum = i + 1;
            const val = `${panelYear}-${String(monthNum).padStart(2, '0')}`;
            const isSelected = selYear === panelYear && selMonth === monthNum;
            // Highlight range between dateFrom and dateTo
            const fromVal = filters.dateFrom || '';
            const toVal = filters.dateTo || '';
            const isInRange = fromVal && toVal && val >= fromVal && val <= toVal && !isSelected;
            return (
              <button
                key={i}
                onClick={() => { onSelect(val); onClose(); }}
                className={`px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#3B82F6] text-white'
                    : isInRange
                      ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                      : 'text-[#F8FAFC] hover:bg-[#334155]'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
        {selected && (
          <button
            onClick={() => { onClear(); onClose(); }}
            className="w-full mt-2 pt-2 border-t border-[#334155] text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors text-left px-1"
          >
            Clear
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border-b border-[#334155] px-4 lg:px-6 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Facility */}
        <select
          value={filters.facility || ''}
          onChange={(e) => setFilter('facility', e.target.value || null)}
          className={selectClass}
        >
          <option value="">All Facilities</option>
          {filterOptions.facilities?.map((f: string) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Shift */}
        <select
          value={filters.shift || ''}
          onChange={(e) => setFilter('shift', e.target.value || null)}
          className={selectClass}
        >
          <option value="">All Shifts</option>
          {filterOptions.shifts?.map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Date From — combined month+year picker */}
        <div className="relative" ref={dateFromRef}>
          <button
            onClick={() => { setDateFromOpen(!dateFromOpen); setDateToOpen(false); }}
            className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer min-w-[130px]"
          >
            <span>{filters.dateFrom ? fmtDate(filters.dateFrom) : 'From'}</span>
            <svg className={`w-4 h-4 text-[#94A3B8] transition-transform ml-auto ${dateFromOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {dateFromOpen && (
            <MonthYearPanel
              panelYear={fromPanelYear}
              setPanelYear={setFromPanelYear}
              selected={filters.dateFrom}
              onSelect={(val) => setFilter('dateFrom', val)}
              onClear={() => setFilter('dateFrom', null)}
              onClose={() => setDateFromOpen(false)}
            />
          )}
        </div>

        <span className="text-[#64748B] text-xs">&ndash;</span>

        {/* Date To — combined month+year picker */}
        <div className="relative" ref={dateToRef}>
          <button
            onClick={() => { setDateToOpen(!dateToOpen); setDateFromOpen(false); }}
            className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer min-w-[130px]"
          >
            <span>{filters.dateTo ? fmtDate(filters.dateTo) : 'To'}</span>
            <svg className={`w-4 h-4 text-[#94A3B8] transition-transform ml-auto ${dateToOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {dateToOpen && (
            <MonthYearPanel
              panelYear={toPanelYear}
              setPanelYear={setToPanelYear}
              selected={filters.dateTo}
              onSelect={(val) => setFilter('dateTo', val)}
              onClear={() => setFilter('dateTo', null)}
              onClose={() => setDateToOpen(false)}
            />
          )}
        </div>

        {/* Issue Type Multi-Select */}
        <div className="relative" ref={issueDropdownRef}>
          <button
            onClick={() => setIssueDropdownOpen(!issueDropdownOpen)}
            className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
          >
            <span>
              {filters.issueTypes.length === 0
                ? 'All Issue Types'
                : filters.issueTypes.length === ISSUE_TYPES.length
                ? 'All Issue Types'
                : filters.issueTypes.join(', ')}
            </span>
            <svg className={`w-4 h-4 text-[#94A3B8] transition-transform ${issueDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {issueDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50 py-1">
              {ISSUE_TYPES.map((type) => {
                const isChecked = filters.issueTypes.includes(type);
                const color = ISSUE_TYPE_COLORS[type] || '#94A3B8';
                return (
                  <label
                    key={type}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#334155] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleIssueType(type)}
                      className="w-4 h-4 rounded border-[#334155]"
                    />
                    <span className="flex items-center gap-2 text-sm text-[#F8FAFC]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {type}
                    </span>
                  </label>
                );
              })}
              <div className="border-t border-[#334155] mt-1 pt-1">
                <button
                  onClick={() => setFilter('issueTypes', [])}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] transition-colors"
                >
                  Clear selection (show all)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Issue Sub-Type Multi-Select (grouped by type) */}
        <div className="relative" ref={subTypeDropdownRef}>
          <button
            onClick={() => setSubTypeDropdownOpen(!subTypeDropdownOpen)}
            className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
          >
            <span>{subTypeLabel}</span>
            <svg className={`w-4 h-4 text-[#94A3B8] transition-transform ${subTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {subTypeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50 py-1 max-h-72 overflow-y-auto">
              {subTypeGroups.length === 0 && (
                <div className="px-3 py-2 text-xs text-[#64748B]">No issue sub-types found</div>
              )}
              {subTypeGroups.map((group) => (
                <div key={group.type}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#334155]/50 mt-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                    {group.type} Issues
                  </div>
                  {group.items.map((item) => {
                    const isChecked = filters.issueSubTypes.includes(item);
                    return (
                      <label
                        key={`${group.type}-${item}`}
                        className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#334155] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIssueSubType(item)}
                          className="w-3.5 h-3.5 rounded border-[#334155]"
                        />
                        <span className="text-sm text-[#F8FAFC]">{item}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
              {totalSubTypeOptions > 0 && (
                <div className="border-t border-[#334155] mt-1 pt-1">
                  <button
                    onClick={() => setFilter('issueSubTypes', [])}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] transition-colors"
                  >
                    Clear selection (show all)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.facility && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full">
              {filters.facility}
              <button onClick={() => setFilter('facility', null)} className="hover:text-[#2563EB] ml-0.5">&times;</button>
            </span>
          )}
          {filters.shift && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full">
              {filters.shift}
              <button onClick={() => setFilter('shift', null)} className="hover:text-[#2563EB] ml-0.5">&times;</button>
            </span>
          )}
          {dateRangeLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full">
              {dateRangeLabel}
              <button onClick={() => { setFilter('dateFrom', null); setFilter('dateTo', null); }} className="hover:text-[#2563EB] ml-0.5">&times;</button>
            </span>
          )}
          {filters.issueTypes.map((type) => (
            <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ISSUE_TYPE_COLORS[type] }} />
              {type}
              <button onClick={() => toggleIssueType(type)} className="hover:text-[#2563EB] ml-0.5">&times;</button>
            </span>
          ))}
          {filters.issueSubTypes.map((subType) => (
            <span key={subType} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs rounded-full">
              {subType}
              <button onClick={() => toggleIssueSubType(subType)} className="hover:text-[#7C3AED] ml-0.5">&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
