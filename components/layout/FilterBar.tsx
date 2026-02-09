'use client';

import { useState, useRef, useEffect } from 'react';
import { useFilters, ISSUE_TYPES } from '@/components/providers/FilterProvider';
import { ISSUE_TYPE_COLORS, SHORT_MONTH_NAMES } from '@/lib/constants';

export default function FilterBar() {
  const { filters, filterOptions, setFilter, toggleIssueType, toggleStatus, resetFilters, hasActiveFilters } = useFilters();
  const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const issueDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(e.target as Node)) {
        setIssueDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

        {/* Month */}
        <select
          value={filters.month || ''}
          onChange={(e) => setFilter('month', e.target.value ? parseInt(e.target.value) : null)}
          className={selectClass}
        >
          <option value="">All Months</option>
          {SHORT_MONTH_NAMES.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

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

        {/* Status Multi-Select */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
          >
            <span>
              {filters.statuses.length === 0
                ? 'All Statuses'
                : filters.statuses.length === filterOptions.statuses.length
                ? 'All Statuses'
                : filters.statuses.join(', ')}
            </span>
            <svg className={`w-4 h-4 text-[#94A3B8] transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {statusDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#1E293B] border border-[#334155] rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
              {filterOptions.statuses.map((status) => {
                const isChecked = filters.statuses.includes(status);
                return (
                  <label
                    key={status}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#334155] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 rounded border-[#334155]"
                    />
                    <span className="text-sm text-[#F8FAFC]">{status}</span>
                  </label>
                );
              })}
              {filterOptions.statuses.length === 0 && (
                <div className="px-3 py-2 text-xs text-[#64748B]">No statuses found</div>
              )}
              <div className="border-t border-[#334155] mt-1 pt-1">
                <button
                  onClick={() => setFilter('statuses', [])}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] transition-colors"
                >
                  Clear selection (show all)
                </button>
              </div>
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
          {filters.month && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full">
              {SHORT_MONTH_NAMES[filters.month - 1]}
              <button onClick={() => setFilter('month', null)} className="hover:text-[#2563EB] ml-0.5">&times;</button>
            </span>
          )}
          {filters.issueTypes.map((type) => (
            <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs rounded-full">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ISSUE_TYPE_COLORS[type] }} />
              {type}
              <button onClick={() => toggleIssueType(type)} className="hover:text-[#2563EB] ml-0.5">&times;</button>
            </span>
          ))}
          {filters.statuses.map((status) => (
            <span key={status} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs rounded-full">
              {status}
              <button onClick={() => toggleStatus(status)} className="hover:text-[#7C3AED] ml-0.5">&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
