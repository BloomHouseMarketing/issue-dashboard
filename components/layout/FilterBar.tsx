'use client';

import { useFilters } from '@/components/providers/FilterProvider';

export default function FilterBar() {
  const { filters, filterOptions, setFilter, resetFilters, hasActiveFilters } = useFilters();

  return (
    <div className="bg-surface border-b border-border px-4 lg:px-6 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Facility */}
        <select
          value={filters.facility || ''}
          onChange={(e) => setFilter('facility', e.target.value || null)}
          className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Facilities</option>
          {filterOptions.facilities?.map((f: string) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* State */}
        <select
          value={filters.state || ''}
          onChange={(e) => setFilter('state', e.target.value || null)}
          className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All States</option>
          {['California', 'Tennessee', 'Texas', 'Kentucky'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Shift */}
        <select
          value={filters.shift || ''}
          onChange={(e) => setFilter('shift', e.target.value || null)}
          className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
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
          className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Years</option>
          {filterOptions.years?.map((y: number) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
              {filters.facility}
              <button onClick={() => setFilter('facility', null)} className="hover:text-accent-hover">&times;</button>
            </span>
          )}
          {filters.state && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
              {filters.state}
              <button onClick={() => setFilter('state', null)} className="hover:text-accent-hover">&times;</button>
            </span>
          )}
          {filters.shift && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
              {filters.shift}
              <button onClick={() => setFilter('shift', null)} className="hover:text-accent-hover">&times;</button>
            </span>
          )}
          {filters.year && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
              {filters.year}
              <button onClick={() => setFilter('year', null)} className="hover:text-accent-hover">&times;</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
