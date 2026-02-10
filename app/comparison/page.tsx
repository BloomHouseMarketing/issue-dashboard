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

// Normalize RPC response — handles both flat (DB reference) and nested formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeComparison(raw: any, yA: number, mA: number, yB: number, mB: number): MonthComparison {
  if (raw.month_a && typeof raw.month_a === 'object') return raw as MonthComparison;

  const aTotal = raw.month_a_total ?? 0;
  const bTotal = raw.month_b_total ?? 0;
  const aRounds = raw.month_a_rounds ?? 0;
  const bRounds = raw.month_b_rounds ?? 0;
  const aSafety = raw.month_a_safety ?? 0;
  const bSafety = raw.month_b_safety ?? 0;
  const aIt = raw.month_a_it ?? 0;
  const bIt = raw.month_b_it ?? 0;
  const dTotal = raw.diff_total ?? (bTotal - aTotal);
  const dRounds = raw.diff_rounds ?? (bRounds - aRounds);
  const dSafety = raw.diff_safety ?? (bSafety - aSafety);
  const dIt = raw.diff_it ?? (bIt - aIt);

  return {
    month_a: {
      year: yA,
      month: mA,
      label: `${SHORT_MONTH_NAMES[(mA - 1 + 12) % 12]} ${yA}`,
      total: aTotal,
      rounds: aRounds,
      safety: aSafety,
      it: aIt,
    },
    month_b: {
      year: yB,
      month: mB,
      label: `${SHORT_MONTH_NAMES[(mB - 1 + 12) % 12]} ${yB}`,
      total: bTotal,
      rounds: bRounds,
      safety: bSafety,
      it: bIt,
    },
    change: {
      total_pct: aTotal > 0 ? (dTotal / aTotal) * 100 : null,
      rounds_pct: aRounds > 0 ? (dRounds / aRounds) * 100 : null,
      safety_pct: aSafety > 0 ? (dSafety / aSafety) * 100 : null,
      it_pct: aIt > 0 ? (dIt / aIt) * 100 : null,
      total_diff: dTotal,
      rounds_diff: dRounds,
      safety_diff: dSafety,
      it_diff: dIt,
    },
  };
}

export default function ComparisonPage() {
  const { filters, filterOptions } = useFilters();
  const currentDate = new Date();
  const [yearA, setYearA] = useState(currentDate.getFullYear());
  const [monthA, setMonthA] = useState(currentDate.getMonth()); // prev month (0-indexed getMonth gives 1-indexed prev)
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

      const { data: mainData } = await supabase.rpc('get_month_comparison', {
        p_facility: filters.facility || null,
        p_group: null,
        p_year_a: yearA,
        p_month_a: monthA,
        p_year_b: yearB,
        p_month_b: monthB,
      });

      if (mainData) setComparison(normalizeComparison(mainData, yearA, monthA, yearB, monthB));
      else setComparison(null);

      // Per-facility comparisons
      const facilities = filters.facility
        ? [filters.facility]
        : (filterOptions.facilities || []);

      const facilityPromises = facilities.map(async (facility: string) => {
        const { data } = await supabase.rpc('get_month_comparison', {
          p_facility: facility,
          p_group: null,
          p_year_a: yearA,
          p_month_a: monthA,
          p_year_b: yearB,
          p_month_b: monthB,
        });
        return data
          ? { facility, data: normalizeComparison(data, yearA, monthA, yearB, monthB) }
          : null;
      });

      const results = await Promise.all(facilityPromises);
      setFacilityComparisons(results.filter((r): r is FacilityComparison => r !== null));

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

  const labelA = `${SHORT_MONTH_NAMES[(monthA - 1 + 12) % 12]} ${yearA}`;
  const labelB = `${SHORT_MONTH_NAMES[(monthB - 1 + 12) % 12]} ${yearB}`;

  const chartData = comparison
    ? [
        { name: 'Total', monthA: comparison.month_a.total, monthB: comparison.month_b.total },
        ...(showRounds ? [{ name: 'Rounds', monthA: comparison.month_a.rounds, monthB: comparison.month_b.rounds }] : []),
        ...(showSafety ? [{ name: 'Safety', monthA: comparison.month_a.safety, monthB: comparison.month_b.safety }] : []),
        ...(showIT ? [{ name: 'IT', monthA: comparison.month_a.it, monthB: comparison.month_b.it }] : []),
      ]
    : [];

  const issueTypeCards = [
    { label: 'Rounds', a: comparison?.month_a.rounds ?? 0, b: comparison?.month_b.rounds ?? 0, pct: comparison?.change.rounds_pct ?? null, diff: comparison?.change.rounds_diff ?? 0, visible: showRounds },
    { label: 'Safety', a: comparison?.month_a.safety ?? 0, b: comparison?.month_b.safety ?? 0, pct: comparison?.change.safety_pct ?? null, diff: comparison?.change.safety_diff ?? 0, visible: showSafety },
    { label: 'IT', a: comparison?.month_a.it ?? 0, b: comparison?.month_b.it ?? 0, pct: comparison?.change.it_pct ?? null, diff: comparison?.change.it_diff ?? 0, visible: showIT },
  ].filter((card) => card.visible);

  const totalCards = 1 + issueTypeCards.length;
  const gridClass =
    totalCards === 4
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
      : totalCards === 3
        ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
        : totalCards === 2
          ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
          : 'grid grid-cols-1 gap-4';

  const selectClass =
    'bg-[#0F172A] border border-[#334155] rounded-lg px-2.5 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer';

  return (
    <div className="space-y-6">
      {/* Header with month pickers */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Month Comparison</h1>
          <p className="text-sm text-[#64748B] mt-1">Compare issue counts between two months</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month A selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#60A5FA] bg-[#60A5FA]/10 px-2 py-0.5 rounded">A</span>
            <select value={yearA} onChange={(e) => setYearA(Number(e.target.value))} className={selectClass}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select value={monthA} onChange={(e) => setMonthA(Number(e.target.value))} className={selectClass}>
              {SHORT_MONTH_NAMES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          <span className="text-[#475569] text-sm font-medium">vs</span>

          {/* Month B selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded">B</span>
            <select value={yearB} onChange={(e) => setYearB(Number(e.target.value))} className={selectClass}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select value={monthB} onChange={(e) => setMonthB(Number(e.target.value))} className={selectClass}>
              {SHORT_MONTH_NAMES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 animate-pulse">
                <div className="h-3 w-20 bg-[#334155] rounded mb-4" />
                <div className="h-8 w-32 bg-[#334155] rounded" />
              </div>
            ))}
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 animate-pulse">
            <div className="h-5 w-48 bg-[#334155] rounded mb-6" />
            <div className="h-[300px] bg-[#334155]/50 rounded" />
          </div>
        </div>
      ) : !comparison ? (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-16 text-center">
          <svg className="w-12 h-12 text-[#334155] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <p className="text-[#64748B] text-sm">No comparison data available for the selected months.</p>
          <p className="text-[#475569] text-xs mt-1">Try selecting different months or adjusting filters.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className={gridClass}>
            {/* Total card */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
              <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3">Total Issues</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-[#F8FAFC]">{formatNumber(comparison.month_a.total)}</span>
                <svg className="w-4 h-4 text-[#475569] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span className="text-2xl font-bold text-[#F8FAFC]">{formatNumber(comparison.month_b.total)}</span>
              </div>
              {comparison.change.total_pct !== null && (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${getChangeBgColor(comparison.change.total_pct)} ${getChangeColor(comparison.change.total_pct)}`}>
                  {getChangeArrow(comparison.change.total_pct)} {formatPercent(comparison.change.total_pct)}
                </span>
              )}
            </div>

            {/* Per-type cards */}
            {issueTypeCards.map((card) => (
              <div key={card.label} className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3">{card.label}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-[#F8FAFC]">{formatNumber(card.a)}</span>
                  <svg className="w-4 h-4 text-[#475569] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <span className="text-2xl font-bold text-[#F8FAFC]">{formatNumber(card.b)}</span>
                </div>
                {card.pct !== null && (
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${getChangeBgColor(card.pct)} ${getChangeColor(card.pct)}`}>
                    {getChangeArrow(card.pct)} {formatPercent(card.pct)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Comparison Bar Chart */}
          <ChartCard title={`${labelA} vs ${labelB}`}>
            <ComparisonBarChart data={chartData} labelA={labelA} labelB={labelB} />
          </ChartCard>

          {/* Facility Breakdown Table */}
          {facilityComparisons.length > 0 && (
            <ChartCard
              title="Facility Breakdown"
              action={
                <ColumnSelector
                  columns={FACILITY_TABLE_COLUMNS}
                  visibleColumns={visibleColumns}
                  onChange={setVisibleColumns}
                />
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#334155]">
                      {visibleColumns.includes('facility') && (
                        <th className="text-left py-3 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Facility</th>
                      )}
                      {visibleColumns.includes('monthA') && (
                        <th className="text-right py-3 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{labelA}</th>
                      )}
                      {visibleColumns.includes('monthB') && (
                        <th className="text-right py-3 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{labelB}</th>
                      )}
                      {visibleColumns.includes('change') && (
                        <th className="text-right py-3 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Change</th>
                      )}
                      {visibleColumns.includes('pctChange') && (
                        <th className="text-right py-3 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">% Change</th>
                      )}
                      {visibleColumns.includes('rounds') && (
                        <th className="text-right py-3 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Rounds</th>
                      )}
                      {visibleColumns.includes('safety') && (
                        <th className="text-right py-3 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Safety</th>
                      )}
                      {visibleColumns.includes('it') && (
                        <th className="text-right py-3 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">IT</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {facilityComparisons.map((fc) => {
                      const d = fc.data;
                      return (
                        <tr key={fc.facility} className="border-b border-[#334155]/50 hover:bg-[#334155]/30 transition-colors">
                          {visibleColumns.includes('facility') && (
                            <td className="py-3 px-3 text-[#F8FAFC] font-medium">{fc.facility}</td>
                          )}
                          {visibleColumns.includes('monthA') && (
                            <td className="py-3 px-3 text-right text-[#94A3B8]">{formatNumber(d.month_a.total)}</td>
                          )}
                          {visibleColumns.includes('monthB') && (
                            <td className="py-3 px-3 text-right text-[#94A3B8]">{formatNumber(d.month_b.total)}</td>
                          )}
                          {visibleColumns.includes('change') && (
                            <td className={`py-3 px-3 text-right font-medium ${getChangeColor(d.change.total_diff)}`}>
                              {d.change.total_diff > 0 ? '+' : ''}{formatNumber(d.change.total_diff)}
                            </td>
                          )}
                          {visibleColumns.includes('pctChange') && (
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${getChangeBgColor(d.change.total_pct)} ${getChangeColor(d.change.total_pct)}`}>
                                {getChangeArrow(d.change.total_pct)} {formatPercent(d.change.total_pct)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.includes('rounds') && (
                            <td className="py-3 px-3 text-right text-[#94A3B8]">
                              {formatNumber(d.month_a.rounds)} → {formatNumber(d.month_b.rounds)}
                            </td>
                          )}
                          {visibleColumns.includes('safety') && (
                            <td className="py-3 px-3 text-right text-[#94A3B8]">
                              {formatNumber(d.month_a.safety)} → {formatNumber(d.month_b.safety)}
                            </td>
                          )}
                          {visibleColumns.includes('it') && (
                            <td className="py-3 px-3 text-right text-[#94A3B8]">
                              {formatNumber(d.month_a.it)} → {formatNumber(d.month_b.it)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}
        </>
      )}
export default function ComparisonPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'pulseGlow 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulseGlow 8s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #a78bfa 0%, transparent 60%)',
            filter: 'blur(100px)',
            animation: 'pulseGlow 10s ease-in-out infinite',
          }}
        />
      </div>

      {/* Glassmorphism Card */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-12 py-14 rounded-3xl border max-w-lg w-full mx-4"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Animated Timer Icon */}
        <div className="relative" style={{ width: 100, height: 100 }}>
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Outer ring track */}
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="3"
              fill="none"
            />
            {/* Animated progress ring */}
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="url(#timerGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="264"
              strokeDashoffset="66"
              style={{
                transformOrigin: '50px 50px',
                animation: 'spinRing 4s linear infinite',
              }}
            />
            {/* Pulsing inner glow */}
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="rgba(99, 102, 241, 0.06)"
              style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}
            />
            {/* Clock body */}
            <circle
              cx="50"
              cy="50"
              r="24"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
              fill="rgba(255,255,255,0.02)"
            />
            {/* Hour hand */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="34"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                transformOrigin: '50px 50px',
                animation: 'rotateHour 8s linear infinite',
              }}
            />
            {/* Minute hand */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="30"
              stroke="rgba(167,139,250,0.8)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                transformOrigin: '50px 50px',
                animation: 'rotateMinute 3s linear infinite',
              }}
            />
            {/* Center dot */}
            <circle cx="50" cy="50" r="2.5" fill="#a78bfa" />
            {/* Top knob */}
            <rect
              x="47"
              y="2"
              width="6"
              height="8"
              rx="3"
              fill="rgba(255,255,255,0.2)"
            />
            {/* Tick marks */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (deg) => (
                <line
                  key={deg}
                  x1="50"
                  y1="28"
                  x2="50"
                  y2={deg % 90 === 0 ? '31' : '30'}
                  stroke={
                    deg % 90 === 0
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(255,255,255,0.12)'
                  }
                  strokeWidth={deg % 90 === 0 ? '1.5' : '1'}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: '50px 50px',
                    transform: `rotate(${deg}deg)`,
                  }}
                />
              )
            )}
            <defs>
              <linearGradient
                id="timerGradient"
                x1="0"
                y1="0"
                x2="100"
                y2="100"
              >
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #e2e8f0 0%, #a78bfa 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Coming Soon
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Month-over-month comparison analytics are currently being built. Check back shortly.
          </p>
        </div>

        {/* Subtle divider */}
        <div
          className="w-16 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)',
          }}
        />

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {['Trend Analysis', 'Facility Breakdown', 'Issue Tracking'].map(
            (feature) => (
              <span
                key={feature}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {feature}
              </span>
            )
          )}
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateHour {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateMinute {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
