'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilters } from '@/components/providers/FilterProvider';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import ColumnSelector, { ColumnDef } from '@/components/ui/ColumnSelector';
import FacilityBarChart from '@/components/charts/FacilityBarChart';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import IssueTypeDonut from '@/components/charts/IssueTypeDonut';
import ShiftDistributionChart from '@/components/charts/ShiftDistributionChart';

interface IssueRow {
  facility: string;
  round_date: string | null;
  shift: string | null;
  issue_status: string | null;
  rounds_issue: string | null;
  safety_issue: string | null;
  it_issue: string | null;
  group_name: string;
  staff_name: string | null;
}

interface FacilityOverview {
  facility: string;
  total_issues: number;
  rounds_count: number;
  safety_count: number;
  it_count: number;
  group_count: number;
}

interface MonthlyTrend {
  facility: string;
  year_month: string;
  total_issues: number;
  rounds_count: number;
  safety_count: number;
  it_count: number;
}

interface ShiftData {
  facility: string;
  shift: string;
  issue_count: number;
  percentage: number;
}

interface SyncLog {
  status: string;
  items_synced: number;
  completed_at: string;
  facility: string;
}

const SYNC_COLUMNS: ColumnDef[] = [
  { key: 'status', label: 'Status' },
  { key: 'facility', label: 'Facility' },
  { key: 'items_synced', label: 'Items' },
  { key: 'completed_at', label: 'Completed' },
];

export default function OverviewPage() {
  const { filters } = useFilters();
  const [totalIssues, setTotalIssues] = useState(0);
  const [facilitiesCount, setFacilitiesCount] = useState(0);
  const [roundsCount, setRoundsCount] = useState(0);
  const [safetyCount, setSafetyCount] = useState(0);
  const [itCount, setItCount] = useState(0);
  const [facilityData, setFacilityData] = useState<FacilityOverview[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [shiftData, setShiftData] = useState<ShiftData[]>([]);
  const [syncLog, setSyncLog] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncCols, setSyncCols] = useState(SYNC_COLUMNS.map((c) => c.key));

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Build filtered query on issues table
      let query = supabase
        .from('issues')
        .select('facility, round_date, shift, issue_status, rounds_issue, safety_issue, it_issue, group_name, staff_name');

      // Apply server-side filters
      if (filters.facility) {
        query = query.eq('facility', filters.facility);
      }
      if (filters.shift) {
        query = query.eq('shift', filters.shift);
      }

      // Status filter
      if (filters.statuses.length > 0) {
        query = query.in('issue_status', filters.statuses);
      }

      // Year + Month date range filter
      if (filters.year && filters.month) {
        const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const endMonth = filters.month === 12 ? 1 : filters.month + 1;
        const endYear = filters.month === 12 ? filters.year + 1 : filters.year;
        const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
        query = query.gte('round_date', startDate).lt('round_date', endDate);
      } else if (filters.year) {
        query = query.gte('round_date', `${filters.year}-01-01`).lt('round_date', `${filters.year + 1}-01-01`);
      } else if (filters.month) {
        // Month without year — use the month text column (JAN, FEB, etc.)
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        query = query.eq('month', monthNames[filters.month - 1]);
      }

      // Issue type filter — include rows that have at least one selected type
      if (filters.issueTypes.length > 0) {
        const conditions: string[] = [];
        if (filters.issueTypes.includes('Rounds')) conditions.push('rounds_issue.not.is.null');
        if (filters.issueTypes.includes('Safety')) conditions.push('safety_issue.not.is.null');
        if (filters.issueTypes.includes('IT')) conditions.push('it_issue.not.is.null');
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

      // Fetch issues + sync log in parallel
      const [issuesRes, syncRes] = await Promise.all([
        query,
        supabase.from('sync_log').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      if (issuesRes.data) {
        const issues = issuesRes.data as IssueRow[];

        // Compute stats
        setTotalIssues(issues.length);
        setFacilitiesCount(new Set(issues.map((i) => i.facility)).size);
        setRoundsCount(issues.filter((i) => i.rounds_issue != null).length);
        setSafetyCount(issues.filter((i) => i.safety_issue != null).length);
        setItCount(issues.filter((i) => i.it_issue != null).length);

        // Compute facility bar chart data
        const facilityMap = new Map<string, { total: number; rounds: number; safety: number; it: number; groups: Set<string> }>();
        issues.forEach((issue) => {
          const f = issue.facility;
          const existing = facilityMap.get(f) || { total: 0, rounds: 0, safety: 0, it: 0, groups: new Set<string>() };
          existing.total++;
          if (issue.rounds_issue) existing.rounds++;
          if (issue.safety_issue) existing.safety++;
          if (issue.it_issue) existing.it++;
          if (issue.group_name) existing.groups.add(issue.group_name);
          facilityMap.set(f, existing);
        });

        setFacilityData(
          Array.from(facilityMap.entries()).map(([facility, data]) => ({
            facility,
            total_issues: data.total,
            rounds_count: data.rounds,
            safety_count: data.safety,
            it_count: data.it,
            group_count: data.groups.size,
          }))
        );

        // Compute monthly trend data
        const monthMap = new Map<string, { total: number; rounds: number; safety: number; it: number }>();
        issues.forEach((issue) => {
          if (!issue.round_date) return;
          const ym = issue.round_date.substring(0, 7);
          const existing = monthMap.get(ym) || { total: 0, rounds: 0, safety: 0, it: 0 };
          existing.total++;
          if (issue.rounds_issue) existing.rounds++;
          if (issue.safety_issue) existing.safety++;
          if (issue.it_issue) existing.it++;
          monthMap.set(ym, existing);
        });

        setTrendData(
          Array.from(monthMap.entries())
            .map(([ym, counts]) => ({
              facility: 'All',
              year_month: ym,
              total_issues: counts.total,
              rounds_count: counts.rounds,
              safety_count: counts.safety,
              it_count: counts.it,
            }))
            .sort((a, b) => a.year_month.localeCompare(b.year_month))
        );

        // Compute shift distribution data
        const shiftMap = new Map<string, { facility: string; shift: string; count: number }>();
        issues.forEach((issue) => {
          if (!issue.shift) return;
          const key = `${issue.facility}|${issue.shift}`;
          const existing = shiftMap.get(key) || { facility: issue.facility, shift: issue.shift, count: 0 };
          existing.count++;
          shiftMap.set(key, existing);
        });

        // Calculate percentages per facility
        const facilityTotals = new Map<string, number>();
        shiftMap.forEach((v) => {
          facilityTotals.set(v.facility, (facilityTotals.get(v.facility) || 0) + v.count);
        });

        setShiftData(
          Array.from(shiftMap.values()).map((v) => ({
            facility: v.facility,
            shift: v.shift,
            issue_count: v.count,
            percentage: Math.round((v.count / (facilityTotals.get(v.facility) || 1)) * 1000) / 10,
          }))
        );
      }

      if (syncRes.data) setSyncLog(syncRes.data);

      setLoading(false);
    }

    fetchData();
  }, [filters]);

  // Issue type donut data
  const issueTypeData = [
    { name: 'Rounds', value: roundsCount, color: '#3B82F6' },
    { name: 'Safety', value: safetyCount, color: '#EF4444' },
    { name: 'IT', value: itCount, color: '#6B7280' },
  ].filter((d) => filters.issueTypes.length === 0 || filters.issueTypes.includes(d.name));

  const col = (key: string) => syncCols.includes(key);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#F8FAFC]">Executive Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Issues"
          value={totalIssues}
          subtitle={`Across ${facilitiesCount} facilities`}
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
        {(filters.issueTypes.length === 0 || filters.issueTypes.includes('Rounds')) && (
          <StatCard
            title="Rounds Issues"
            value={roundsCount}
            subtitle="Staff compliance issues"
            loading={loading}
            icon={
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        )}
        {(filters.issueTypes.length === 0 || filters.issueTypes.includes('Safety')) && (
          <StatCard
            title="Safety Issues"
            value={safetyCount}
            subtitle="Safety incidents reported"
            loading={loading}
            icon={
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
        )}
        {(filters.issueTypes.length === 0 || filters.issueTypes.includes('IT')) && (
          <StatCard
            title="IT Issues"
            value={itCount}
            subtitle="Infrastructure problems"
            loading={loading}
            icon={
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
              </svg>
            }
          />
        )}
      </div>

      {/* Charts Row 1: Facility Bar + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Issues by Facility" loading={loading}>
          <FacilityBarChart data={facilityData} />
        </ChartCard>
        <ChartCard title="Monthly Trend" loading={loading}>
          <MonthlyTrendChart data={trendData} />
        </ChartCard>
      </div>

      {/* Charts Row 2: Issue Type Donut + Shift Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Issue Type Distribution" loading={loading}>
          <IssueTypeDonut data={issueTypeData} />
        </ChartCard>
        <ChartCard title="Shift Distribution" loading={loading}>
          <ShiftDistributionChart data={shiftData} />
        </ChartCard>
      </div>

      {/* Sync Status */}
      <ChartCard
        title="Recent Sync Activity"
        loading={loading}
        action={<ColumnSelector columns={SYNC_COLUMNS} visibleColumns={syncCols} onChange={setSyncCols} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#334155]">
                {col('status') && <th className="text-left py-2 px-3">Status</th>}
                {col('facility') && <th className="text-left py-2 px-3">Facility</th>}
                {col('items_synced') && <th className="text-right py-2 px-3">Items</th>}
                {col('completed_at') && <th className="text-right py-2 px-3">Completed</th>}
              </tr>
            </thead>
            <tbody>
              {syncLog.map((log, i) => (
                <tr key={i} className="border-b border-[#334155]/50 hover:bg-[#334155]/50">
                  {col('status') && (
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        log.status === 'completed' ? 'text-emerald-400' :
                        log.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          log.status === 'completed' ? 'bg-emerald-400' :
                          log.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'
                        }`} />
                        {log.status}
                      </span>
                    </td>
                  )}
                  {col('facility') && <td className="py-2 px-3 text-[#94A3B8]">{log.facility || '—'}</td>}
                  {col('items_synced') && <td className="py-2 px-3 text-right font-mono text-[#F8FAFC]">{log.items_synced}</td>}
                  {col('completed_at') && (
                    <td className="py-2 px-3 text-right text-[#94A3B8]">
                      {log.completed_at ? new Date(log.completed_at).toLocaleString() : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
