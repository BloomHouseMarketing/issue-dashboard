'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Filters {
  facility: string | null;
  shift: string | null;
  year: number | null;
  month: number | null;
  issueTypes: string[];
  statuses: string[];
}

interface FilterOptions {
  facilities: string[];
  shifts: string[];
  years: number[];
  groups: string[];
  monitoring_team: string[];
  statuses: string[];
}

interface FilterContextType {
  filters: Filters;
  filterOptions: FilterOptions;
  setFilter: (key: keyof Filters, value: string | number | string[] | null) => void;
  toggleIssueType: (type: string) => void;
  toggleStatus: (status: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const ISSUE_TYPES = ['Rounds', 'Safety', 'IT'];

const defaultFilters: Filters = {
  facility: null,
  shift: null,
  year: null,
  month: null,
  issueTypes: [],
  statuses: [],
};

const defaultOptions: FilterOptions = {
  facilities: [],
  shifts: [],
  years: [],
  groups: [],
  monitoring_team: [],
  statuses: [],
};

const FilterContext = createContext<FilterContextType>({
  filters: defaultFilters,
  filterOptions: defaultOptions,
  setFilter: () => {},
  toggleIssueType: () => {},
  toggleStatus: () => {},
  resetFilters: () => {},
  hasActiveFilters: false,
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultOptions);

  useEffect(() => {
    async function fetchOptions() {
      // Fetch filter options from RPC
      const { data } = await supabase.rpc('get_filter_options');

      // Fetch distinct issue_status values directly
      const { data: statusData } = await supabase
        .from('issues')
        .select('issue_status')
        .not('issue_status', 'is', null)
        .limit(1000);

      const distinctStatuses = statusData
        ? Array.from(new Set(statusData.map((r: { issue_status: string }) => r.issue_status))).filter(Boolean).sort()
        : [];

      if (data) {
        setFilterOptions({
          facilities: data.facilities || [],
          shifts: data.shifts || [],
          years: data.years || [],
          groups: data.groups || [],
          monitoring_team: data.monitoring_team || [],
          statuses: distinctStatuses as string[],
        });
      }
    }
    fetchOptions();
  }, []);

  const setFilter = (key: keyof Filters, value: string | number | string[] | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleIssueType = (type: string) => {
    setFilters((prev) => {
      const current = prev.issueTypes;
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...prev, issueTypes: next };
    });
  };

  const toggleStatus = (status: string) => {
    setFilters((prev) => {
      const current = prev.statuses;
      const next = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      return { ...prev, statuses: next };
    });
  };

  const resetFilters = () => setFilters(defaultFilters);

  const hasActiveFilters =
    filters.facility !== null ||
    filters.shift !== null ||
    filters.year !== null ||
    filters.month !== null ||
    filters.issueTypes.length > 0 ||
    filters.statuses.length > 0;

  return (
    <FilterContext.Provider value={{ filters, filterOptions, setFilter, toggleIssueType, toggleStatus, resetFilters, hasActiveFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}

export { ISSUE_TYPES };
