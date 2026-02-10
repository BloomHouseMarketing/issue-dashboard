'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilters, ISSUE_TYPES } from '@/components/providers/FilterProvider';
import { ISSUE_TYPE_COLORS } from '@/lib/constants';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import ColumnSelector, { ColumnDef } from '@/components/ui/ColumnSelector';
import FacilityBarChart from '@/components/charts/FacilityBarChart';
import DynamicTrendChart from '@/components/charts/DynamicTrendChart';
import FacilitySubTypeChart from '@/components/charts/FacilitySubTypeChart';
import { yearMonthToLabel } from '@/lib/utils';

// Consistent color palette for sub-types
const SUB_TYPE_PALETTE = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#A855F7',
  '#6366F1', '#84CC16', '#E11D48', '#0EA5E9', '#D946EF',
];

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

// Get all sub-type values present on an issue row
function getSubTypes(issue: IssueRow): string[] {
  const subs: string[] = [];
  if (issue.rounds_issue) subs.push(issue.rounds_issue);
  if (issue.safety_issue) subs.push(issue.safety_issue);
  if (issue.it_issue) subs.push(issue.it_issue);
  return subs;
}

export default function OverviewPage() {
  const { filters, filterOptions } = useFilters();
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [syncLog, setSyncLog] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncCols, setSyncCols] = useState(SYNC_COLUMNS.map((c) => c.key));

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      let query = supabase
        .from('issues')
        .select('facility, round_date, shift, issue_status, rounds_issue, safety_issue, it_issue, group_name, staff_name');

      if (filters.facility) query = query.eq('facility', filters.facility);
      if (filters.shift) query = query.eq('shift', filters.shift);

      // Year + Month range
      if (filters.year && filters.monthFrom && filters.monthTo) {
        const startDate = `${filters.year}-${String(filters.monthFrom).padStart(2, '0')}-01`;
        const endMonth = filters.monthTo === 12 ? 1 : filters.monthTo + 1;
        const endYear = filters.monthTo === 12 ? filters.year + 1 : filters.year;
        query = query.gte('round_date', startDate).lt('round_date', `${endYear}-${String(endMonth).padStart(2, '0')}-01`);
      } else if (filters.year && filters.monthFrom) {
        query = query.gte('round_date', `${filters.year}-${String(filters.monthFrom).padStart(2, '0')}-01`).lt('round_date', `${filters.year + 1}-01-01`);
      } else if (filters.year && filters.monthTo) {
        const endMonth = filters.monthTo === 12 ? 1 : filters.monthTo + 1;
        const endYear = filters.monthTo === 12 ? filters.year + 1 : filters.year;
        query = query.gte('round_date', `${filters.year}-01-01`).lt('round_date', `${endYear}-${String(endMonth).padStart(2, '0')}-01`);
      } else if (filters.year) {
        query = query.gte('round_date', `${filters.year}-01-01`).lt('round_date', `${filters.year + 1}-01-01`);
      }

      // Issue type filter
      if (filters.issueTypes.length > 0) {
        const conds: string[] = [];
        if (filters.issueTypes.includes('Rounds')) conds.push('rounds_issue.not.is.null');
        if (filters.issueTypes.includes('Safety')) conds.push('safety_issue.not.is.null');
        if (filters.issueTypes.includes('IT')) conds.push('it_issue.not.is.null');
        if (conds.length > 0) query = query.or(conds.join(','));
      }

      // Issue sub-type filter
      if (filters.issueSubTypes.length > 0) {
        const roundsSubs = filters.issueSubTypes.filter((s) => filterOptions.roundsIssues.includes(s));
        const safetySubs = filters.issueSubTypes.filter((s) => filterOptions.safetyIssues.includes(s));
        const itSubs = filters.issueSubTypes.filter((s) => filterOptions.itIssues.includes(s));
        const orConds: string[] = [];
        if (roundsSubs.length > 0) orConds.push(`rounds_issue.in.(${roundsSubs.join(',')})`);
        if (safetySubs.length > 0) orConds.push(`safety_issue.in.(${safetySubs.join(',')})`);
        if (itSubs.length > 0) orConds.push(`it_issue.in.(${itSubs.join(',')})`);
        if (orConds.length > 0) query = query.or(orConds.join(','));
      }

      const [issuesRes, syncRes] = await Promise.all([
        query,
        supabase.from('sync_log').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      if (issuesRes.data) {
        let rows = issuesRes.data as IssueRow[];
        // Client-side month filter when no year set
        if (!filters.year && (filters.monthFrom || filters.monthTo)) {
          rows = rows.filter((r) => {
            if (!r.round_date) return false;
            const m = parseInt(r.round_date.substring(5, 7));
            if (filters.monthFrom && filters.monthTo) return m >= filters.monthFrom && m <= filters.monthTo;
            if (filters.monthFrom) return m >= filters.monthFrom;
            if (filters.monthTo) return m <= filters.monthTo;
            return true;
          });
        }
        setIssues(rows);
      }

      if (syncRes.data) setSyncLog(syncRes.data);
      setLoading(false);
    }

    fetchData();
  }, [filters, filterOptions.roundsIssues, filterOptions.safetyIssues, filterOptions.itIssues]);

  // All available sub-types based on active issue types
  const allAvailableSubTypes = useMemo(() => {
    const activeTypes = filters.issueTypes.length > 0 ? filters.issueTypes : ISSUE_TYPES;
    const all: string[] = [];
    if (activeTypes.includes('Rounds')) all.push(...filterOptions.roundsIssues);
    if (activeTypes.includes('Safety')) all.push(...filterOptions.safetyIssues);
    if (activeTypes.includes('IT')) all.push(...filterOptions.itIssues);
    return all;
  }, [filters.issueTypes, filterOptions.roundsIssues, filterOptions.safetyIssues, filterOptions.itIssues]);

  // Dynamic mode: sub-type lines when specific (not all) sub-types are selected
  const useSubTypeMode = filters.issueSubTypes.length > 0 && filters.issueSubTypes.length < allAvailableSubTypes.length;

  // Series for dynamic line charts
  const activeSubTypeSeries = useMemo(() => {
    return filters.issueSubTypes.map((st, i) => ({
      key: st,
      label: st,
      color: SUB_TYPE_PALETTE[i % SUB_TYPE_PALETTE.length],
    }));
  }, [filters.issueSubTypes]);

  const issueTypeSeries = useMemo(() => {
    const activeTypes = filters.issueTypes.length > 0 ? filters.issueTypes : ISSUE_TYPES;
    return activeTypes.map((t) => ({
      key: t === 'Rounds' ? 'rounds_count' : t === 'Safety' ? 'safety_count' : 'it_count',
      label: t,
      color: ISSUE_TYPE_COLORS[t] || '#94A3B8',
      dashed: true,
    }));
  }, [filters.issueTypes]);

  const trendSeries = useSubTypeMode ? activeSubTypeSeries : issueTypeSeries;

  // Stats
  const totalIssues = issues.length;
  const facilitiesCount = new Set(issues.map((i) => i.facility)).size;
  const roundsCount = issues.filter((i) => i.rounds_issue != null).length;
  const safetyCount = issues.filter((i) => i.safety_issue != null).length;
  const itCount = issues.filter((i) => i.it_issue != null).length;

  // ROW 1 LEFT: Facility bars broken down by sub-types
  const facilityBarData = useMemo(() => {
    const subTypesToShow = filters.issueSubTypes.length > 0 ? filters.issueSubTypes : allAvailableSubTypes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, Record<string, any>>();
    issues.forEach((issue) => {
      const f = issue.facility;
      if (!map.has(f)) map.set(f, { facility: f, total_issues: 0 });
      const row = map.get(f)!;
      row.total_issues++;
      getSubTypes(issue).forEach((sub) => {
        if (subTypesToShow.includes(sub)) {
          row[sub] = (row[sub] || 0) + 1;
        }
      });
    });
    return Array.from(map.values());
  }, [issues, filters.issueSubTypes, allAvailableSubTypes]);

  const facilityBarSeries = useMemo(() => {
    const subTypesToShow = filters.issueSubTypes.length > 0 ? filters.issueSubTypes : allAvailableSubTypes;
    return subTypesToShow.map((st, i) => ({
      key: st,
      label: st,
      color: SUB_TYPE_PALETTE[i % SUB_TYPE_PALETTE.length],
    }));
  }, [filters.issueSubTypes, allAvailableSubTypes]);

  // ROW 1 RIGHT + ROW 2 LEFT: Monthly trend data
  const trendData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, Record<string, any>>();
    issues.forEach((issue) => {
      if (!issue.round_date) return;
      const ym = issue.round_date.substring(0, 7);
      if (!map.has(ym)) map.set(ym, { year_month: ym, total: 0, rounds_count: 0, safety_count: 0, it_count: 0 });
      const row = map.get(ym)!;
      row.total++;
      if (issue.rounds_issue) row.rounds_count++;
      if (issue.safety_issue) row.safety_count++;
      if (issue.it_issue) row.it_count++;

      if (useSubTypeMode) {
        getSubTypes(issue).forEach((sub) => {
          if (filters.issueSubTypes.includes(sub)) {
            row[sub] = (row[sub] || 0) + 1;
          }
        });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => a.year_month.localeCompare(b.year_month))
      .map((d) => ({ ...d, label: yearMonthToLabel(d.year_month) }));
  }, [issues, useSubTypeMode, filters.issueSubTypes]);

  // ROW 2 RIGHT: Facility bars with total + overlapping sub-type bars
  const facilitySubTypeData = useMemo(() => {
    const subTypesToShow = filters.issueSubTypes.length > 0 ? filters.issueSubTypes : allAvailableSubTypes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, Record<string, any>>();
    issues.forEach((issue) => {
      const f = issue.facility;
      if (!map.has(f)) map.set(f, { facility: f, total: 0 });
      const row = map.get(f)!;
      row.total++;
      getSubTypes(issue).forEach((sub) => {
        if (subTypesToShow.includes(sub)) {
          row[sub] = (row[sub] || 0) + 1;
        }
      });
    });
    return Array.from(map.values());
  }, [issues, filters.issueSubTypes, allAvailableSubTypes]);

  const facilitySubTypeSeries = useMemo(() => {
    const subTypesToShow = filters.issueSubTypes.length > 0 ? filters.issueSubTypes : allAvailableSubTypes;
    return subTypesToShow.map((st, i) => ({
      key: st,
      label: st,
      color: SUB_TYPE_PALETTE[i % SUB_TYPE_PALETTE.length],
    }));
  }, [filters.issueSubTypes, allAvailableSubTypes]);

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
          <StatCard title="Rounds Issues" value={roundsCount} subtitle="Staff compliance issues" loading={loading}
            icon={<svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        )}
        {(filters.issueTypes.length === 0 || filters.issueTypes.includes('Safety')) && (
          <StatCard title="Safety Issues" value={safetyCount} subtitle="Safety incidents reported" loading={loading}
            icon={<svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          />
        )}
        {(filters.issueTypes.length === 0 || filters.issueTypes.includes('IT')) && (
          <StatCard title="IT Issues" value={itCount} subtitle="Infrastructure problems" loading={loading}
            icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>}
          />
        )}
      </div>

      {/* Row 1: Facility Sub-Type Breakdown + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Issues by Facility" loading={loading}>
          <FacilityBarChart data={facilityBarData} series={facilityBarSeries} />
        </ChartCard>
        <ChartCard title="Monthly Trend" loading={loading}>
          <DynamicTrendChart data={trendData} series={trendSeries} showTotal={!useSubTypeMode} />
        </ChartCard>
      </div>

      {/* Row 2: Dynamic Trend + Facility Sub-Type Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={useSubTypeMode ? 'Sub-Issue Trend' : 'Issue Type Trend'} loading={loading}>
          <DynamicTrendChart data={trendData} series={trendSeries} showTotal={!useSubTypeMode} />
        </ChartCard>
        <ChartCard title="Facility Breakdown" loading={loading}>
          <FacilitySubTypeChart data={facilitySubTypeData} series={facilitySubTypeSeries} />
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
