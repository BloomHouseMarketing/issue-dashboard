'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useFilters, ISSUE_TYPES } from '@/components/providers/FilterProvider';
import { ISSUE_TYPE_COLORS, SHORT_MONTH_NAMES } from '@/lib/constants';

export default function FilterBar() {
  const { filters, filterOptions, setFilter, toggleIssueType, toggleIssueSubType, resetFilters, hasActiveFilters } = useFilters();
  const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
  const [subTypeDropdownOpen, setSubTypeDropdownOpen] = useState(false);
  const [monthFromOpen, setMonthFromOpen] = useState(false);
  const [monthToOpen, setMonthToOpen] = useState(false);
  const issueDropdownRef = useRef<HTMLDivElement>(null);
  const subTypeDropdownRef = useRef<HTMLDivElement>(null);
  const monthFromRef = useRef<HTMLDivElement>(null);
  const monthToRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(e.target as Node)) {
        setIssueDropdownOpen(false);
      }
      if (subTypeDropdownRef.current && !subTypeDropdownRef.current.contains(e.target as Node)) {
        setSubTypeDropdownOpen(false);
      }
      if (monthFromRef.current && !monthFromRef.current.contains(e.target as Node)) {
        setMonthFromOpen(false);
      }
      if (monthToRef.current && !monthToRef.current.contains(e.target as Node)) {
        setMonthToOpen(false);
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

  // Compute a readable label for the month range
  const monthRangeLabel = useMemo(() => {
    if (filters.monthFrom && filters.monthTo) {
      return `${SHORT_MONTH_NAMES[filters.monthFrom - 1]} – ${SHORT_MONTH_NAMES[filters.monthTo - 1]}`;
    }
    if (filters.monthFrom) return `From ${SHORT_MONTH_NAMES[filters.monthFrom - 1]}`;
    if (filters.monthTo) return `To ${SHORT_MONTH_NAMES[filters.monthTo - 1]}`;
    return null;
  }, [filters.monthFrom, filters.monthTo]);

  const selectClass = 'bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] appearance-none cursor-pointer';

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

        {/* Year */}
        <select
          value={filters.year || ''}
          onChange={(e) => setFilter('year', e.target.value ? parseInt(e.target.value) : null)}
          className={selectClass}
        >
          <option value="">All Years</option>
          {filterOptions.years?.map((y: number) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Month From — custom dropdown */}
        <div className="relative" ref={monthFromRef}>
          <button
            onClick={() => { setMonthFromOpen(!monthFromOpen); setMonthToOpen(false); }}
            className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer min-w-[120px]"
          >
            <span>{filters.monthFrom ? SHORT_MONTH_NAMES[filters.monthFrom - 1] : 'From Month'}</span>
            <svg className={`w-4 h-4 text-[#94A3B8] transition-transform ml-auto ${monthFromOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {monthFromOpen && (
            <div className="absolute top-full left-0 mt-1 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50 p-2 w-[220px]">
              <div className="grid grid-cols-3 gap-1">
                {SHORT_MONTH_NAMES.map((m, i) => {
                  const monthNum = i + 1;
                  const isSelected = filters.monthFrom === monthNum;
                  const isInRange = filters.monthFrom && filters.monthTo && monthNum >= filters.monthFrom && monthNum <= filters.monthTo;
                  return (
                    <button
                      key={i}
                      onClick={() => { setFilter('monthFrom', monthNum); setMonthFromOpen(false); }}
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
              {filters.monthFrom && (
                <button
                  onClick={() => { setFilter('monthFrom', null); setMonthFromOpen(false); }}
                  className="w-full mt-2 pt-2 border-t border-[#334155] text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors text-left px-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        <span className="text-[#64748B] text-xs">–</span>

        {/* Month To — custom dropdown */}
        <div className="relative" ref={monthToRef}>
          <button
            onClick={() => { setMonthToOpen(!monthToOpen); setMonthFromOpen(false); }}
            className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer min-w-[120px]"
          >
            <span>{filters.monthTo ? SHORT_MONTH_NAMES[filters.monthTo - 1] : 'To Month'}</span>
            <svg className={`w-4 h-4 text-[#94A3B8] transition-transform ml-auto ${monthToOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {monthToOpen && (
            <div className="absolute top-full left-0 mt-1 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50 p-2 w-[220px]">
              <div className="grid grid-cols-3 gap-1">
                {SHORT_MONTH_NAMES.map((m, i) => {
                  const monthNum = i + 1;
                  const isSelected = filters.monthTo === monthNum;
                  const isInRange = filters.monthFrom && filters.monthTo && monthNum >= filters.monthFrom && monthNum <= filters.monthTo;
                  return (
                    <button
                      key={i}
                      onClick={() => { setFilter('monthTo', monthNum); setMonthToOpen(false); }}
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
              {filters.monthTo && (
                <button
                  onClick={() => { setFilter('monthTo', null); setMonthToOpen(false); }}
                  className="w-full mt-2 pt-2 border-t border-[#334155] text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors text-left px-1"
                >
                  Clear
                </button>
              )}
            </div>
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
          {filters.year && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full">
              {filters.year}
              <button onClick={() => setFilter('year', null)} className="hover:text-[#2563EB] ml-0.5">&times;</button>
            </span>
          )}
          {monthRangeLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full">
              {monthRangeLabel}
              <button onClick={() => { setFilter('monthFrom', null); setFilter('monthTo', null); }} className="hover:text-[#2563EB] ml-0.5">&times;</button>
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
