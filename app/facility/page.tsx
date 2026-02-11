'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilters } from '@/components/providers/FilterProvider';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import ColumnSelector, { ColumnDef } from '@/components/ui/ColumnSelector';
import { formatNumber } from '@/lib/utils';

interface GroupBreakdown {
  facility: string;
  group_name: string;
  issue_count: number;
  rounds_count: number;
  safety_count: number;
  it_count: number;
  earliest: string;
  latest: string;
}

interface StaffSummary {
  staff_name: string;
  facility: string;
  total_issues: number;
  groups_involved: number;
  rounds_count: number;
  safety_count: number;
  first_issue: string;
  last_issue: string;
}

interface Issue {
  id: number;
  round_date: string;
  group_name: string;
  shift: string;
  issue_status: string;
  rounds_issue: string | null;
  safety_issue: string | null;
  it_issue: string | null;
  staff_name: string;
  result_status: string;
  item_name: string;
  issue_note: string;
}

interface DashboardStats {
  total_issues: number;
  facilities_count: number;
  groups_count: number;
  by_issue_type: { rounds: number; safety: number; it: number };
  staff_involved: number;
  date_range: { earliest: string; latest: string };
}

interface TrendData {
  facility: string;
  year_month: string;
  total_issues: number;
  rounds_count: number;
  safety_count: number;
  it_count: number;
}

// Column definitions for each table
const GROUP_COLUMNS: ColumnDef[] = [
  { key: 'group_name', label: 'Group' },
  { key: 'issue_count', label: 'Issues' },
  { key: 'rounds_count', label: 'Rounds' },
  { key: 'safety_count', label: 'Safety' },
  { key: 'it_count', label: 'IT' },
];

const STAFF_COLUMNS: ColumnDef[] = [
  { key: 'staff_name', label: 'Staff' },
  { key: 'total_issues', label: 'Issues' },
  { key: 'groups_involved', label: 'Groups' },
  { key: 'rounds_count', label: 'Rounds' },
  { key: 'safety_count', label: 'Safety' },
  { key: 'first_issue', label: 'First' },
  { key: 'last_issue', label: 'Last' },
];

const ISSUE_COLUMNS: ColumnDef[] = [
  { key: 'round_date', label: 'Date' },
  { key: 'group_name', label: 'Group' },
  { key: 'shift', label: 'Shift' },
  { key: 'type', label: 'Type' },
  { key: 'staff_name', label: 'Staff' },
  { key: 'result_status', label: 'Status' },
];

export default function FacilityPage() {
  const { filters, filterOptions, setFilter } = useFilters();
  const selectedFacility = filters.facility || filterOptions.facilities?.[0] || '';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [groups, setGroups] = useState<GroupBreakdown[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueCount, setIssueCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string>('issue_count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  // Column visibility state for each table
  const [groupVisibleCols, setGroupVisibleCols] = useState(GROUP_COLUMNS.map(c => c.key));
  const [staffVisibleCols, setStaffVisibleCols] = useState(STAFF_COLUMNS.map(c => c.key));
  const [issueVisibleCols, setIssueVisibleCols] = useState(ISSUE_COLUMNS.map(c => c.key));

  const groupCol = (key: string) => groupVisibleCols.includes(key);
  const staffCol = (key: string) => staffVisibleCols.includes(key);
  const issueCol = (key: string) => issueVisibleCols.includes(key);

  useEffect(() => {
    if (!selectedFacility) return;

    async function fetchData() {
      setLoading(true);

      const [statsRes, groupsRes, trendRes, staffRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats', {
          p_facility: selectedFacility,
          p_group_name: null,
          p_year: filters.dateFrom ? parseInt(filters.dateFrom.split('-')[0], 10) : null,
          p_month: null,
        }),
        supabase.from('v_group_breakdown').select('*').eq('facility', selectedFacility).order('issue_count', { ascending: false }),
        supabase.from('v_monthly_trend').select('facility, year_month, total_issues, rounds_count, safety_count, it_count').eq('facility', selectedFacility),
        supabase.from('v_staff_summary').select('*').eq('facility', selectedFacility).order('total_issues', { ascending: false }),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (groupsRes.data) setGroups(groupsRes.data);
      if (staffRes.data) setStaff(staffRes.data);

      if (trendRes.data) {
        // Aggregate by year_month for this facility
        const monthMap = new Map<string, { total: number; rounds: number; safety: number; it: number }>();
        (trendRes.data as TrendData[]).forEach((row) => {
          const existing = monthMap.get(row.year_month) || { total: 0, rounds: 0, safety: 0, it: 0 };
          existing.total += Number(row.total_issues);
          existing.rounds += Number(row.rounds_count);
          existing.safety += Number(row.safety_count);
          existing.it += Number(row.it_count);
          monthMap.set(row.year_month, existing);
        });

        const aggregated = Array.from(monthMap.entries())
          .map(([ym, counts]) => ({
            facility: selectedFacility,
            year_month: ym,
            total_issues: counts.total,
            rounds_count: counts.rounds,
            safety_count: counts.safety,
            it_count: counts.it,
          }))
          .sort((a, b) => a.year_month.localeCompare(b.year_month));
        setTrendData(aggregated);
      }

      setLoading(false);
    }

    fetchData();
    setPage(0);
  }, [selectedFacility, filters.dateFrom, filters.dateTo]);

  // Fetch issues with pagination, search, and issue type filtering
  useEffect(() => {
    if (!selectedFacility) return;

    async function fetchIssues() {
      let query = supabase
        .from('issues')
        .select('id, round_date, group_name, shift, issue_status, rounds_issue, safety_issue, it_issue, staff_name, result_status, item_name, issue_note', { count: 'exact' })
        .eq('facility', selectedFacility)
        .order('round_date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) {
        query = query.or(`item_name.ilike.%${search}%,issue_note.ilike.%${search}%`);
      }

      // Apply issue type filter from global filters
      if (filters.issueTypes.length > 0) {
        const typeConditions: string[] = [];
        if (filters.issueTypes.includes('Rounds')) typeConditions.push('rounds_issue.not.is.null');
        if (filters.issueTypes.includes('Safety')) typeConditions.push('safety_issue.not.is.null');
        if (filters.issueTypes.includes('IT')) typeConditions.push('it_issue.not.is.null');
        if (typeConditions.length > 0) {
          query = query.or(typeConditions.join(','));
        }
      }

      const { data, count } = await query;
      if (data) setIssues(data);
      if (count !== null) setIssueCount(count);
    }

    fetchIssues();
  }, [selectedFacility, page, search, filters.issueTypes]);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const aVal = Number((a as unknown as Record<string, unknown>)[sortCol] ?? 0);
      const bVal = Number((b as unknown as Record<string, unknown>)[sortCol] ?? 0);
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [groups, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const totalPages = Math.ceil(issueCount / pageSize);

  function getIssueType(row: Issue): string {
    const types = [];
    if (row.rounds_issue) types.push('Rounds');
    if (row.safety_issue) types.push('Safety');
    if (row.it_issue) types.push('IT');
    return types.join(', ') || '—';
  }

  // Count visible columns for colSpan on empty state row
  const visibleIssueColCount = ISSUE_COLUMNS.filter(c => issueVisibleCols.includes(c.key)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-[#F8FAFC]">Facility Deep Dive</h2>
        <select
          value={selectedFacility}
          onChange={(e) => setFilter('facility', e.target.value)}
          className="bg-[#334155] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {filterOptions.facilities?.map((f: string) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Facility Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Issues" value={stats?.total_issues ?? 0} subtitle={`${stats?.groups_count ?? 0} groups`} loading={loading} />
        <StatCard title="Rounds Issues" value={stats?.by_issue_type.rounds ?? 0} loading={loading} />
        <StatCard title="Safety Issues" value={stats?.by_issue_type.safety ?? 0} loading={loading} />
        <StatCard title="Staff Involved" value={stats?.staff_involved ?? 0} loading={loading} />
      </div>

      {/* Monthly Trend */}
      <ChartCard title={`Monthly Trend — ${selectedFacility}`} loading={loading}>
        <MonthlyTrendChart data={trendData} />
      </ChartCard>

      {/* Group Breakdown Table */}
      <ChartCard
        title="Group Breakdown"
        action={<ColumnSelector columns={GROUP_COLUMNS} visibleColumns={groupVisibleCols} onChange={setGroupVisibleCols} />}
        loading={loading}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#334155]">
                {groupCol('group_name') && (
                  <th
                    className="py-2 px-3 cursor-pointer hover:text-[#94A3B8] text-left"
                    onClick={() => handleSort('group_name')}
                  >
                    Group
                    {sortCol === 'group_name' && <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>}
                  </th>
                )}
                {groupCol('issue_count') && (
                  <th
                    className="py-2 px-3 cursor-pointer hover:text-[#94A3B8] text-right"
                    onClick={() => handleSort('issue_count')}
                  >
                    Issues
                    {sortCol === 'issue_count' && <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>}
                  </th>
                )}
                {groupCol('rounds_count') && (
                  <th
                    className="py-2 px-3 cursor-pointer hover:text-[#94A3B8] text-right"
                    onClick={() => handleSort('rounds_count')}
                  >
                    Rounds
                    {sortCol === 'rounds_count' && <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>}
                  </th>
                )}
                {groupCol('safety_count') && (
                  <th
                    className="py-2 px-3 cursor-pointer hover:text-[#94A3B8] text-right"
                    onClick={() => handleSort('safety_count')}
                  >
                    Safety
                    {sortCol === 'safety_count' && <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>}
                  </th>
                )}
                {groupCol('it_count') && (
                  <th
                    className="py-2 px-3 cursor-pointer hover:text-[#94A3B8] text-right"
                    onClick={() => handleSort('it_count')}
                  >
                    IT
                    {sortCol === 'it_count' && <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group, i) => (
                <tr key={i} className="border-b border-[#334155]/50 hover:bg-[#334155]/50">
                  {groupCol('group_name') && <td className="py-2 px-3 text-[#F8FAFC]">{group.group_name}</td>}
                  {groupCol('issue_count') && <td className="py-2 px-3 text-right font-mono text-[#F8FAFC]">{formatNumber(Number(group.issue_count))}</td>}
                  {groupCol('rounds_count') && <td className="py-2 px-3 text-right font-mono text-blue-400">{formatNumber(Number(group.rounds_count))}</td>}
                  {groupCol('safety_count') && <td className="py-2 px-3 text-right font-mono text-red-400">{formatNumber(Number(group.safety_count))}</td>}
                  {groupCol('it_count') && <td className="py-2 px-3 text-right font-mono text-gray-400">{formatNumber(Number(group.it_count))}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Staff Summary */}
      <ChartCard
        title="Staff Summary"
        action={<ColumnSelector columns={STAFF_COLUMNS} visibleColumns={staffVisibleCols} onChange={setStaffVisibleCols} />}
        loading={loading}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#334155]">
                {staffCol('staff_name') && <th className="text-left py-2 px-3">Staff</th>}
                {staffCol('total_issues') && <th className="text-right py-2 px-3">Issues</th>}
                {staffCol('groups_involved') && <th className="text-right py-2 px-3">Groups</th>}
                {staffCol('rounds_count') && <th className="text-right py-2 px-3">Rounds</th>}
                {staffCol('safety_count') && <th className="text-right py-2 px-3">Safety</th>}
                {staffCol('first_issue') && <th className="text-right py-2 px-3">First</th>}
                {staffCol('last_issue') && <th className="text-right py-2 px-3">Last</th>}
              </tr>
            </thead>
            <tbody>
              {staff.slice(0, 20).map((s, i) => (
                <tr key={i} className="border-b border-[#334155]/50 hover:bg-[#334155]/50">
                  {staffCol('staff_name') && <td className="py-2 px-3 text-[#F8FAFC]">{s.staff_name}</td>}
                  {staffCol('total_issues') && <td className="py-2 px-3 text-right font-mono text-[#F8FAFC]">{s.total_issues}</td>}
                  {staffCol('groups_involved') && <td className="py-2 px-3 text-right font-mono text-[#94A3B8]">{s.groups_involved}</td>}
                  {staffCol('rounds_count') && <td className="py-2 px-3 text-right font-mono text-blue-400">{s.rounds_count}</td>}
                  {staffCol('safety_count') && <td className="py-2 px-3 text-right font-mono text-red-400">{s.safety_count}</td>}
                  {staffCol('first_issue') && <td className="py-2 px-3 text-right text-[#64748B]">{s.first_issue || '—'}</td>}
                  {staffCol('last_issue') && <td className="py-2 px-3 text-right text-[#64748B]">{s.last_issue || '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Issues Table */}
      <ChartCard
        title="Issues"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B]">{formatNumber(issueCount)} total</span>
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="bg-[#334155] border border-[#334155] rounded-lg px-3 py-1 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
            <ColumnSelector columns={ISSUE_COLUMNS} visibleColumns={issueVisibleCols} onChange={setIssueVisibleCols} />
          </div>
        }
        loading={loading}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#334155]">
                {issueCol('round_date') && <th className="text-left py-2 px-3">Date</th>}
                {issueCol('group_name') && <th className="text-left py-2 px-3">Group</th>}
                {issueCol('shift') && <th className="text-left py-2 px-3">Shift</th>}
                {issueCol('type') && <th className="text-left py-2 px-3">Type</th>}
                {issueCol('staff_name') && <th className="text-left py-2 px-3">Staff</th>}
                {issueCol('result_status') && <th className="text-left py-2 px-3">Status</th>}
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/50">
                  {issueCol('round_date') && <td className="py-2 px-3 text-[#F8FAFC] whitespace-nowrap">{issue.round_date || '—'}</td>}
                  {issueCol('group_name') && <td className="py-2 px-3 text-[#94A3B8] max-w-[200px] truncate">{issue.group_name}</td>}
                  {issueCol('shift') && <td className="py-2 px-3 text-[#94A3B8]">{issue.shift || '—'}</td>}
                  {issueCol('type') && (
                    <td className="py-2 px-3">
                      <span className="text-xs">{getIssueType(issue)}</span>
                    </td>
                  )}
                  {issueCol('staff_name') && <td className="py-2 px-3 text-[#94A3B8]">{issue.staff_name || '—'}</td>}
                  {issueCol('result_status') && (
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        issue.result_status === 'Done' || issue.result_status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-[#334155] text-[#94A3B8]'
                      }`}>
                        {issue.result_status || issue.issue_status || '—'}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
              {issues.length === 0 && (
                <tr>
                  <td colSpan={visibleIssueColCount} className="py-8 text-center text-[#64748B]">
                    No issues found. Try adjusting your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#334155]">
            <span className="text-xs text-[#64748B]">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs bg-[#334155] text-[#94A3B8] rounded-lg disabled:opacity-50 hover:text-[#F8FAFC]"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs bg-[#334155] text-[#94A3B8] rounded-lg disabled:opacity-50 hover:text-[#F8FAFC]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
