'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Filters {
  facility: string | null;
  state: string | null;
  shift: string | null;
  year: number | null;
  issueTypes: string[];  // multi-select: 'Rounds', 'Safety', 'IT'
}

interface FilterOptions {
  facilities: string[];
  shifts: string[];
  years: number[];
  groups: string[];
  monitoring_team: string[];
}

interface FilterContextType {
  filters: Filters;
  filterOptions: FilterOptions;
  setFilter: (key: keyof Filters, value: string | number | string[] | null) => void;
  toggleIssueType: (type: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const ISSUE_TYPES = ['Rounds', 'Safety', 'IT'];

const defaultFilters: Filters = {
  facility: null,
  state: null,
  shift: null,
  year: null,
  issueTypes: [],
};

const defaultOptions: FilterOptions = {
  facilities: [],
  shifts: [],
  years: [],
  groups: [],
  monitoring_team: [],
};

const FilterContext = createContext<FilterContextType>({
  filters: defaultFilters,
  filterOptions: defaultOptions,
  setFilter: () => {},
  toggleIssueType: () => {},
  resetFilters: () => {},
  hasActiveFilters: false,
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultOptions);

  useEffect(() => {
    async function fetchOptions() {
      const { data } = await supabase.rpc('get_filter_options');
      if (data) {
        setFilterOptions({
          facilities: data.facilities || [],
          shifts: data.shifts || [],
          years: data.years || [],
          groups: data.groups || [],
          monitoring_team: data.monitoring_team || [],
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

  const resetFilters = () => setFilters(defaultFilters);

  const hasActiveFilters =
    filters.facility !== null ||
    filters.state !== null ||
    filters.shift !== null ||
    filters.year !== null ||
    filters.issueTypes.length > 0;

  return (
    <FilterContext.Provider value={{ filters, filterOptions, setFilter, toggleIssueType, resetFilters, hasActiveFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}

export { ISSUE_TYPES };
