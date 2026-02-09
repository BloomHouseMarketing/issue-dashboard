'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilters } from '@/components/providers/FilterProvider';
import ChartCard from '@/components/ui/ChartCard';
import ComparisonBarChart from '@/components/charts/ComparisonBarChart';
import { formatNumber, formatPercent, getChangeColor, getChangeBgColor, getChangeArrow } from '@/lib/utils';
import { FACILITY_STATES } from '@/lib/constants';
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
        : (filterOptions.facilities || []).filter((f: string) =>
            !filters.state || FACILITY_STATES[f] === filters.state
          );

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
  }, [yearA, monthA, yearB, monthB, filters.facility, filters.state, filterOptions.facilities]);

  const years = filterOptions.years?.length ? filterOptions.years : [2024, 2025, 2026];

  const chartData = comparison
    ? [
        { name: 'Total', monthA: comparison.month_a.total, monthB: comparison.month_b.total },
        { name: 'Rounds', monthA: comparison.month_a.rounds, monthB: comparison.month_b.rounds },
        { name: 'Safety', monthA: comparison.month_a.safety, monthB: comparison.month_b.safety },
        { name: 'IT', monthA: comparison.month_a.it, monthB: comparison.month_b.it },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Month Comparison</h2>

      {/* Period Selectors */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary font-medium">Month A:</span>
          <select
            value={yearA}
            onChange={(e) => setYearA(parseInt(e.target.value))}
            className="bg-surface-hover border border-border rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {years.map((y: number) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={monthA}
            onChange={(e) => setMonthA(parseInt(e.target.value))}
            className="bg-surface-hover border border-border rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {SHORT_MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>

        <span className="text-text-muted">vs</span>

        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary font-medium">Month B:</span>
          <select
            value={yearB}
            onChange={(e) => setYearB(parseInt(e.target.value))}
            className="bg-surface-hover border border-border rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {years.map((y: number) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={monthB}
            onChange={(e) => setMonthB(parseInt(e.target.value))}
            className="bg-surface-hover border border-border rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {SHORT_MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Comparison Cards */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <span className="text-sm text-text-secondary font-medium">Total Issues</span>
            <div className="flex items-end gap-3 mt-2">
              <div>
                <div className="text-xs text-text-muted">{comparison.month_a.label}</div>
                <div className="text-2xl font-bold text-text-primary font-mono">{formatNumber(comparison.month_a.total)}</div>
              </div>
              <div className="text-text-muted text-lg">→</div>
              <div>
                <div className="text-xs text-text-muted">{comparison.month_b.label}</div>
                <div className="text-2xl font-bold text-text-primary font-mono">{formatNumber(comparison.month_b.total)}</div>
              </div>
            </div>
            <div className={`mt-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${getChangeColor(comparison.change.total_pct)} ${getChangeBgColor(comparison.change.total_pct)}`}>
              {getChangeArrow(comparison.change.total_pct)} {formatPercent(comparison.change.total_pct)}
            </div>
          </div>

          {[
            { label: 'Rounds', a: comparison.month_a.rounds, b: comparison.month_b.rounds, pct: comparison.change.rounds_pct },
            { label: 'Safety', a: comparison.month_a.safety, b: comparison.month_b.safety, pct: comparison.change.safety_pct },
            { label: 'IT', a: comparison.month_a.it, b: comparison.month_b.it, pct: comparison.change.it_pct },
          ].map((item) => (
            <div key={item.label} className="bg-surface border border-border rounded-xl p-6 shadow-sm">
              <span className="text-sm text-text-secondary font-medium">{item.label} Issues</span>
              <div className="flex items-end gap-3 mt-2">
                <div className="text-2xl font-bold text-text-primary font-mono">{formatNumber(item.a)}</div>
                <div className="text-text-muted">→</div>
                <div className="text-2xl font-bold text-text-primary font-mono">{formatNumber(item.b)}</div>
              </div>
              <div className={`mt-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${getChangeColor(item.pct)} ${getChangeBgColor(item.pct)}`}>
                {getChangeArrow(item.pct)} {formatPercent(item.pct)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Bar Chart */}
      <ChartCard
        title={comparison ? `${comparison.month_a.label} vs ${comparison.month_b.label}` : 'Comparison'}
        loading={loading}
      >
        <ComparisonBarChart
          data={chartData}
          labelA={comparison?.month_a.label || 'Month A'}
          labelB={comparison?.month_b.label || 'Month B'}
        />
      </ChartCard>

      {/* Facility-by-Facility Table */}
      <ChartCard title="Facility Comparison" loading={loading}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border">
                <th className="text-left py-2 px-3">Facility</th>
                <th className="text-right py-2 px-3">{comparison?.month_a.label || 'Month A'}</th>
                <th className="text-right py-2 px-3">{comparison?.month_b.label || 'Month B'}</th>
                <th className="text-right py-2 px-3">Change</th>
                <th className="text-right py-2 px-3">% Change</th>
              </tr>
            </thead>
            <tbody>
              {facilityComparisons
                .sort((a, b) => (b.data.change.total_diff) - (a.data.change.total_diff))
                .map((fc) => (
                  <tr key={fc.facility} className="border-b border-border/50 hover:bg-surface-hover/50">
                    <td className="py-2 px-3 text-text-primary font-medium">{fc.facility}</td>
                    <td className="py-2 px-3 text-right font-mono text-text-primary">{formatNumber(fc.data.month_a.total)}</td>
                    <td className="py-2 px-3 text-right font-mono text-text-primary">{formatNumber(fc.data.month_b.total)}</td>
                    <td className={`py-2 px-3 text-right font-mono ${getChangeColor(fc.data.change.total_diff)}`}>
                      {fc.data.change.total_diff > 0 ? '+' : ''}{fc.data.change.total_diff}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${getChangeColor(fc.data.change.total_pct)} ${getChangeBgColor(fc.data.change.total_pct)}`}>
                        {formatPercent(fc.data.change.total_pct)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
