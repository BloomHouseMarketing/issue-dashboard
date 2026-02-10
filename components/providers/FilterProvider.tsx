'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Filters {
  facility: string | null;
  shift: string | null;
  year: number | null;
  monthFrom: number | null;
  monthTo: number | null;
  issueTypes: string[];
  issueSubTypes: string[];
}

interface FilterOptions {
  facilities: string[];
  shifts: string[];
  years: number[];
  groups: string[];
  monitoring_team: string[];
  roundsIssues: string[];
  safetyIssues: string[];
  itIssues: string[];
}

interface FilterContextType {
  filters: Filters;
  filterOptions: FilterOptions;
  setFilter: (key: keyof Filters, value: string | number | string[] | null) => void;
  toggleIssueType: (type: string) => void;
  toggleIssueSubType: (subType: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const ISSUE_TYPES = ['Rounds', 'Safety', 'IT'];

const defaultFilters: Filters = {
  facility: null,
  shift: null,
  year: null,
  monthFrom: null,
  monthTo: null,
  issueTypes: [],
  issueSubTypes: [],
};

const defaultOptions: FilterOptions = {
  facilities: [],
  shifts: [],
  years: [],
  groups: [],
  monitoring_team: [],
  roundsIssues: [],
  safetyIssues: [],
  itIssues: [],
};

const FilterContext = createContext<FilterContextType>({
  filters: defaultFilters,
  filterOptions: defaultOptions,
  setFilter: () => {},
  toggleIssueType: () => {},
  toggleIssueSubType: () => {},
  resetFilters: () => {},
  hasActiveFilters: false,
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultOptions);

  useEffect(() => {
    async function fetchOptions() {
      // Fetch filter options from RPC (includes rounds_issues, safety_issues, it_issues)
      const { data } = await supabase.rpc('get_filter_options');

      if (data) {
        setFilterOptions({
          facilities: data.facilities || [],
          shifts: data.shifts || [],
          years: data.years || [],
          groups: data.groups || [],
          monitoring_team: data.monitoring_team || [],
          roundsIssues: data.rounds_issues || [],
          safetyIssues: data.safety_issues || [],
          itIssues: data.it_issues || [],
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
      // Clear sub-type selections that no longer belong to any selected type
      // (only if we're narrowing the selection)
      return { ...prev, issueTypes: next };
    });
  };

  const toggleIssueSubType = (subType: string) => {
    setFilters((prev) => {
      const current = prev.issueSubTypes;
      const next = current.includes(subType)
        ? current.filter((s) => s !== subType)
        : [...current, subType];
      return { ...prev, issueSubTypes: next };
    });
  };

  const resetFilters = () => setFilters(defaultFilters);

  const hasActiveFilters =
    filters.facility !== null ||
    filters.shift !== null ||
    filters.year !== null ||
    filters.monthFrom !== null ||
    filters.monthTo !== null ||
    filters.issueTypes.length > 0 ||
    filters.issueSubTypes.length > 0;

  return (
    <FilterContext.Provider value={{ filters, filterOptions, setFilter, toggleIssueType, toggleIssueSubType, resetFilters, hasActiveFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}

export { ISSUE_TYPES };
