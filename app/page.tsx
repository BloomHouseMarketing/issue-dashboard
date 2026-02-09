'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilters } from '@/components/providers/FilterProvider';
import { FACILITY_STATES } from '@/lib/constants';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import FacilityBarChart from '@/components/charts/FacilityBarChart';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import IssueTypeDonut from '@/components/charts/IssueTypeDonut';
import ShiftDistributionChart from '@/components/charts/ShiftDistributionChart';

interface DashboardStats {
  total_issues: number;
  facilities_count: number;
  groups_count: number;
  by_issue_type: { rounds: number; safety: number; it: number };
  by_shift: { NOC_PST: number; AM_PST: number; Swing: number };
  staff_involved: number;
  date_range: { earliest: string; latest: string };
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

export default function OverviewPage() {
  const { filters } = useFilters();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [facilityData, setFacilityData] = useState<FacilityOverview[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [shiftData, setShiftData] = useState<ShiftData[]>([]);
  const [syncLog, setSyncLog] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [statsRes, facilityRes, trendRes, shiftRes, syncRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats', {
          p_facility: filters.facility,
          p_group_name: null,
          p_year: filters.year,
          p_month: null,
        }),
        supabase.from('v_facility_overview').select('*').order('total_issues', { ascending: false }),
        supabase.from('v_monthly_trend').select('facility, year_month, total_issues, rounds_count, safety_count, it_count'),
        supabase.from('v_shift_distribution').select('*'),
        supabase.from('sync_log').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      if (statsRes.data) setStats(statsRes.data);

      if (facilityRes.data) {
        let filtered = facilityRes.data;
        if (filters.state) {
          filtered = filtered.filter((f: FacilityOverview) => FACILITY_STATES[f.facility] === filters.state);
        }
        if (filters.facility) {
          filtered = filtered.filter((f: FacilityOverview) => f.facility === filters.facility);
        }
        setFacilityData(filtered);
      }

      if (trendRes.data) {
        // Aggregate by year_month across all facilities (or filter)
        let filtered = trendRes.data as MonthlyTrend[];
        if (filters.facility) {
          filtered = filtered.filter((t) => t.facility === filters.facility);
        }
        if (filters.state) {
          filtered = filtered.filter((t) => FACILITY_STATES[t.facility] === filters.state);
        }

        // Aggregate by year_month
        const monthMap = new Map<string, { total: number; rounds: number; safety: number; it: number }>();
        filtered.forEach((row) => {
          const existing = monthMap.get(row.year_month) || { total: 0, rounds: 0, safety: 0, it: 0 };
          existing.total += Number(row.total_issues);
          existing.rounds += Number(row.rounds_count);
          existing.safety += Number(row.safety_count);
          existing.it += Number(row.it_count);
          monthMap.set(row.year_month, existing);
        });

        const aggregated = Array.from(monthMap.entries())
          .map(([ym, counts]) => ({
            facility: 'All',
            year_month: ym,
            total_issues: counts.total,
            rounds_count: counts.rounds,
            safety_count: counts.safety,
            it_count: counts.it,
          }))
          .sort((a, b) => a.year_month.localeCompare(b.year_month));

        setTrendData(aggregated);
      }

      if (shiftRes.data) {
        let filtered = shiftRes.data as ShiftData[];
        if (filters.facility) {
          filtered = filtered.filter((s) => s.facility === filters.facility);
        }
        if (filters.state) {
          filtered = filtered.filter((s) => FACILITY_STATES[s.facility] === filters.state);
        }
        setShiftData(filtered);
      }

      if (syncRes.data) setSyncLog(syncRes.data);

      setLoading(false);
    }

    fetchData();
  }, [filters]);

  const issueTypeData = stats
    ? [
        { name: 'Rounds', value: stats.by_issue_type.rounds, color: '#3B82F6' },
        { name: 'Safety', value: stats.by_issue_type.safety, color: '#EF4444' },
        { name: 'IT', value: stats.by_issue_type.it, color: '#6B7280' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Executive Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Issues"
          value={stats?.total_issues ?? 0}
          subtitle={`Across ${stats?.facilities_count ?? 0} facilities`}
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          title="Rounds Issues"
          value={stats?.by_issue_type.rounds ?? 0}
          subtitle="Staff compliance issues"
          loading={loading}
          icon={
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Safety Issues"
          value={stats?.by_issue_type.safety ?? 0}
          subtitle="Safety incidents reported"
          loading={loading}
          icon={
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          title="IT Issues"
          value={stats?.by_issue_type.it ?? 0}
          subtitle="Infrastructure problems"
          loading={loading}
          icon={
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
            </svg>
          }
        />
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
      <ChartCard title="Recent Sync Activity" loading={loading}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border">
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Facility</th>
                <th className="text-right py-2 px-3">Items</th>
                <th className="text-right py-2 px-3">Completed</th>
              </tr>
            </thead>
            <tbody>
              {syncLog.map((log, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-surface-hover/50">
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
                  <td className="py-2 px-3 text-text-secondary">{log.facility || '—'}</td>
                  <td className="py-2 px-3 text-right font-mono text-text-primary">{log.items_synced}</td>
                  <td className="py-2 px-3 text-right text-text-secondary">
                    {log.completed_at ? new Date(log.completed_at).toLocaleString() : '—'}
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
