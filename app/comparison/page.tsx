'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilters } from '@/components/providers/FilterProvider';
import ChartCard from '@/components/ui/ChartCard';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import ColumnSelector, { ColumnDef } from '@/components/ui/ColumnSelector';
import { formatNumber, formatPercent, getChangeColor, getChangeBgColor, getChangeArrow } from '@/lib/utils';
import { SHORT_MONTH_NAMES } from '@/lib/constants';

interface MonthComparison {
  month_a: {
    year: number;
    month: number;
    label: string;
    total: number;
    rounds: number;
    safety: number;
    it: number;
  };
  month_b: {
    year: number;
    month: number;
    label: string;
    total: number;
    rounds: number;
    safety: number;
    it: number;
  };
  change: {
    total_pct: number | null;
    rounds_pct: number | null;
    safety_pct: number | null;
    it_pct: number | null;
    total_diff: number;
    rounds_diff: number;
    safety_diff: number;
    it_diff: number;
  };
}

interface FacilityComparison {
  facility: string;
  data: MonthComparison;
}

const FACILITY_TABLE_COLUMNS: ColumnDef[] = [
  { key: 'facility', label: 'Facility', defaultVisible: true },
  { key: 'monthA', label: 'Month A', defaultVisible: true },
  { key: 'monthB', label: 'Month B', defaultVisible: true },
  { key: 'change', label: 'Change', defaultVisible: true },
  { key: 'pctChange', label: '% Change', defaultVisible: true },
  { key: 'rounds', label: 'Rounds', defaultVisible: false },
  { key: 'safety', label: 'Safety', defaultVisible: false },
  { key: 'it', label: 'IT', defaultVisible: false },
];

export default function ComparisonPage() {
  const { filters, filterOptions } = useFilters();
  const currentDate = new Date();
  const [yearA, setYearA] = useState(currentDate.getFullYear());
  const [monthA, setMonthA] = useState(currentDate.getMonth()); // prev month
  const [yearB, setYearB] = useState(currentDate.getFullYear());
  const [monthB, setMonthB] = useState(currentDate.getMonth() + 1); // current month

  const [comparison, setComparison] = useState<MonthComparison | null>(null);
  const [facilityComparisons, setFacilityComparisons] = useState<FacilityComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    FACILITY_TABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Main comparison
      const { data: mainData } = await supabase.rpc('get_month_comparison', {
        p_facility: filters.facility || null,
        p_group_name: null,
        p_year_a: yearA,
        p_month_a: monthA,
        p_year_b: yearB,
        p_month_b: monthB,
      });

      if (mainData) setComparison(mainData);

      // Per-facility comparisons
      const facilities = filters.facility
        ? [filters.facility]
        : (filterOptions.facilities || []);

      const facilityPromises = facilities.map(async (facility: string) => {
        const { data } = await supabase.rpc('get_month_comparison', {
          p_facility: facility,
          p_group_name: null,
          p_year_a: yearA,
          p_month_a: monthA,
          p_year_b: yearB,
          p_month_b: monthB,
        });
        return { facility, data: data as MonthComparison };
      });

      const results = await Promise.all(facilityPromises);
      setFacilityComparisons(results.filter((r) => r.data));

      setLoading(false);
    }

    fetchData();
  }, [yearA, monthA, yearB, monthB, filters.facility, filterOptions.facilities]);

  const years = filterOptions.years?.length ? filterOptions.years : [2024, 2025, 2026];

  // Issue type filter helpers
  const activeIssueTypes = filters.issueTypes;
  const showRounds = activeIssueTypes.length === 0 || activeIssueTypes.includes('Rounds');
  const showSafety = activeIssueTypes.length === 0 || activeIssueTypes.includes('Safety');
  const showIT = activeIssueTypes.length === 0 || activeIssueTypes.includes('IT');

  const chartData = comparison
    ? [
        { name: 'Total', monthA: comparison.month_a.total, monthB: comparison.month_b.total },
        ...(showRounds ? [{ name: 'Rounds', monthA: comparison.month_a.rounds, monthB: comparison.month_b.rounds }] : []),
        ...(showSafety ? [{ name: 'Safety', monthA: comparison.month_a.safety, monthB: comparison.month_b.safety }] : []),
        ...(showIT ? [{ name: 'IT', monthA: comparison.month_a.it, monthB: comparison.month_b.it }] : []),
      ]
    : [];

  // Build the filtered issue type cards
  const issueTypeCards = [
    { label: 'Rounds', a: comparison?.month_a.rounds ?? 0, b: comparison?.month_b.rounds ?? 0, pct: comparison?.change.rounds_pct ?? null, visible: showRounds },
    { label: 'Safety', a: comparison?.month_a.safety ?? 0, b: comparison?.month_b.safety ?? 0, pct: comparison?.change.safety_pct ?? null, visible: showSafety },
    { label: 'IT', a: comparison?.month_a.it ?? 0, b: comparison?.month_b.it ?? 0, pct: comparison?.change.it_pct ?? null, visible: showIT },
  ].filter((card) => card.visible);

  // Determine grid columns based on visible cards (1 Total + filtered types)
  const totalCards = 1 + issueTypeCards.length;
  const gridClass =
    totalCards === 4
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
      : totalCards === 3
        ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
        : totalCards === 2
          ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
          : 'grid grid-cols-1 gap-4';

  return (
    </div>
  );
}
