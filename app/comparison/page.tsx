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

  const labelA = comparison?.month_a.label ?? `${SHORT_MONTH_NAMES[monthA - 1]} ${yearA}`;
  const labelB = comparison?.month_b.label ?? `${SHORT_MONTH_NAMES[monthB - 1]} ${yearB}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Month-over-Month Comparison</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading comparison data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Month-over-Month Comparison</h1>

      {/* Month Selectors */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Month A</label>
          <div className="flex gap-2">
            <select
              className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm"
              value={yearA}
              onChange={(e) => setYearA(Number(e.target.value))}
            >
              {years.map((y: number) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm"
              value={monthA}
              onChange={(e) => setMonthA(Number(e.target.value))}
            >
              {SHORT_MONTH_NAMES.map((name: string, i: number) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-gray-500 text-lg pb-2">vs</span>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Month B</label>
          <div className="flex gap-2">
            <select
              className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm"
              value={yearB}
              onChange={(e) => setYearB(Number(e.target.value))}
            >
              {years.map((y: number) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm"
              value={monthB}
              onChange={(e) => setMonthB(Number(e.target.value))}
            >
              {SHORT_MONTH_NAMES.map((name: string, i: number) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {comparison && (
        <div className={gridClass}>
          {/* Total Card */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">Total Issues</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">{formatNumber(comparison.month_b.total)}</span>
              {comparison.change.total_pct !== null && (
                <span className={`text-sm font-medium ${getChangeColor(comparison.change.total_pct)}`}>
                  {getChangeArrow(comparison.change.total_pct)} {formatPercent(Math.abs(comparison.change.total_pct))}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {labelA}: {formatNumber(comparison.month_a.total)} → {labelB}: {formatNumber(comparison.month_b.total)}
            </div>
          </div>

          {/* Issue Type Cards */}
          {issueTypeCards.map((card) => (
            <div key={card.label} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">{card.label}</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-white">{formatNumber(card.b)}</span>
                {card.pct !== null && (
                  <span className={`text-sm font-medium ${getChangeColor(card.pct)}`}>
                    {getChangeArrow(card.pct)} {formatPercent(Math.abs(card.pct))}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {labelA}: {formatNumber(card.a)} → {labelB}: {formatNumber(card.b)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Bar Chart */}
      {chartData.length > 0 && (
        <ChartCard title={`${labelA} vs ${labelB}`}>
          <ComparisonBarChart
            data={chartData}
            labelA={labelA}
            labelB={labelB}
          />
        </ChartCard>
      )}

      {/* Facility Breakdown Table */}
      {facilityComparisons.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Facility Breakdown</h2>
            <ColumnSelector
              columns={FACILITY_TABLE_COLUMNS}
              visibleColumns={visibleColumns}
              onChange={setVisibleColumns}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {visibleColumns.includes('facility') && (
                    <th className="text-left p-3 text-gray-400 font-medium">Facility</th>
                  )}
                  {visibleColumns.includes('monthA') && (
                    <th className="text-right p-3 text-gray-400 font-medium">{labelA}</th>
                  )}
                  {visibleColumns.includes('monthB') && (
                    <th className="text-right p-3 text-gray-400 font-medium">{labelB}</th>
                  )}
                  {visibleColumns.includes('change') && (
                    <th className="text-right p-3 text-gray-400 font-medium">Change</th>
                  )}
                  {visibleColumns.includes('pctChange') && (
                    <th className="text-right p-3 text-gray-400 font-medium">% Change</th>
                  )}
                  {visibleColumns.includes('rounds') && (
                    <th className="text-right p-3 text-gray-400 font-medium">Rounds</th>
                  )}
                  {visibleColumns.includes('safety') && (
                    <th className="text-right p-3 text-gray-400 font-medium">Safety</th>
                  )}
                  {visibleColumns.includes('it') && (
                    <th className="text-right p-3 text-gray-400 font-medium">IT</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {facilityComparisons.map((fc) => (
                  <tr key={fc.facility} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    {visibleColumns.includes('facility') && (
                      <td className="p-3 text-white font-medium">{fc.facility}</td>
                    )}
                    {visibleColumns.includes('monthA') && (
                      <td className="p-3 text-right text-gray-300">{formatNumber(fc.data.month_a.total)}</td>
                    )}
                    {visibleColumns.includes('monthB') && (
                      <td className="p-3 text-right text-gray-300">{formatNumber(fc.data.month_b.total)}</td>
                    )}
                    {visibleColumns.includes('change') && (
                      <td className="p-3 text-right">
                        <span className={getChangeColor(fc.data.change.total_diff)}>
                          {fc.data.change.total_diff > 0 ? '+' : ''}{formatNumber(fc.data.change.total_diff)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('pctChange') && (
                      <td className="p-3 text-right">
                        {fc.data.change.total_pct !== null ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getChangeBgColor(fc.data.change.total_pct)}`}>
                            {getChangeArrow(fc.data.change.total_pct)} {formatPercent(Math.abs(fc.data.change.total_pct))}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes('rounds') && (
                      <td className="p-3 text-right text-gray-300">
                        {formatNumber(fc.data.month_a.rounds)} → {formatNumber(fc.data.month_b.rounds)}
                      </td>
                    )}
                    {visibleColumns.includes('safety') && (
                      <td className="p-3 text-right text-gray-300">
                        {formatNumber(fc.data.month_a.safety)} → {formatNumber(fc.data.month_b.safety)}
                      </td>
                    )}
                    {visibleColumns.includes('it') && (
                      <td className="p-3 text-right text-gray-300">
                        {formatNumber(fc.data.month_a.it)} → {formatNumber(fc.data.month_b.it)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!comparison && !loading && (
        <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400">No comparison data available for the selected months.</p>
        </div>
      )}
    </div>
  );
}
