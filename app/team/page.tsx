'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchTeamData } from '@/lib/api';
import { useFilters } from '@/components/providers/FilterProvider';
import ChartCard from '@/components/ui/ChartCard';
import StatCard from '@/components/ui/StatCard';
import ColumnSelector, { ColumnDef } from '@/components/ui/ColumnSelector';
import { formatNumber } from '@/lib/utils';

interface TeamMember {
  live_monitoring_team: string;
  issues_reported: number;
  facilities_covered: number;
  active_days: number;
  first_report: string;
  last_report: string;
}

interface HeatmapCell {
  live_monitoring_team: string;
  facility: string;
  count: number;
}

interface ActivityDay {
  live_monitoring_team: string;
  round_date: string;
  count: number;
}

const TEAM_COLUMNS: ColumnDef[] = [
  { key: 'rank', label: 'Rank' },
  { key: 'name', label: 'Team Member' },
  { key: 'issues', label: 'Issues Reported' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'active_days', label: 'Active Days' },
  { key: 'first_report', label: 'First Report' },
  { key: 'last_report', label: 'Last Report' },
];

export default function TeamPage() {
  const { filters } = useFilters();
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamCols, setTeamCols] = useState(TEAM_COLUMNS.map(c => c.key));
  const col = (key: string) => teamCols.includes(key);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { team, heatmapRows, activityRows } = await fetchTeamData();
        setTeamData(team);

        // Aggregate heatmap data (team x facility -> count)
        const cellMap = new Map<string, number>();
        heatmapRows.forEach((row: { live_monitoring_team: string; facility: string }) => {
          const key = `${row.live_monitoring_team}|||${row.facility}`;
          cellMap.set(key, (cellMap.get(key) || 0) + 1);
        });
        setHeatmapData(
          Array.from(cellMap.entries()).map(([key, count]) => {
            const [team, facility] = key.split('|||');
            return { live_monitoring_team: team, facility, count };
          })
        );

        // Aggregate activity data (team x date -> count)
        const dayMap = new Map<string, number>();
        activityRows.forEach((row: { live_monitoring_team: string; round_date: string }) => {
          const key = `${row.live_monitoring_team}|||${row.round_date}`;
          dayMap.set(key, (dayMap.get(key) || 0) + 1);
        });
        setActivityData(
          Array.from(dayMap.entries()).map(([key, count]) => {
            const [team, date] = key.split('|||');
            return { live_monitoring_team: team, round_date: date, count };
          })
        );
      } catch (err) {
        console.error('Failed to fetch team data:', err);
      }
      setLoading(false);
    }

    loadData();
  }, [filters]);

  // Heatmap computation
  const { teams, facilities, maxCount } = useMemo(() => {
    const teams = Array.from(new Set(heatmapData.map((d) => d.live_monitoring_team))).sort();
    const facilities = Array.from(new Set(heatmapData.map((d) => d.facility))).sort();
    const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);
    return { teams, facilities, maxCount };
  }, [heatmapData]);

  const getCellCount = (team: string, facility: string) => {
    return heatmapData.find((d) => d.live_monitoring_team === team && d.facility === facility)?.count || 0;
  };

  const getHeatColor = (count: number): string => {
    if (count === 0) return 'bg-[#334155]';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return 'bg-blue-900/40';
    if (intensity < 0.5) return 'bg-blue-800/60';
    if (intensity < 0.75) return 'bg-blue-600/70';
    return 'bg-blue-500';
  };

  // Activity timeline: compute monthly activity per team member
  const monthlyActivity = useMemo(() => {
    const monthMap = new Map<string, Map<string, number>>();
    activityData.forEach((d) => {
      const ym = d.round_date.substring(0, 7); // YYYY-MM
      if (!monthMap.has(d.live_monitoring_team)) {
        monthMap.set(d.live_monitoring_team, new Map());
      }
      const teamMap = monthMap.get(d.live_monitoring_team)!;
      teamMap.set(ym, (teamMap.get(ym) || 0) + d.count);
    });

    const allMonths = Array.from(new Set(activityData.map((d) => d.round_date.substring(0, 7)))).sort();
    const allTeams = Array.from(monthMap.keys()).sort();

    return { monthMap, allMonths: allMonths.slice(-12), allTeams }; // Last 12 months
  }, [activityData]);

  const totalIssues = teamData.reduce((sum, t) => sum + Number(t.issues_reported), 0);
  const totalMembers = teamData.length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#F8FAFC]">Monitoring Team</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Team Members" value={totalMembers} subtitle="Active monitoring staff" loading={loading} />
        <StatCard title="Total Issues Reported" value={totalIssues} loading={loading} />
        <StatCard title="Facilities Covered" value={facilities.length} subtitle="Across all team members" loading={loading} />
      </div>

      {/* Team Leaderboard */}
      <ChartCard
        title="Team Leaderboard"
        loading={loading}
        action={
          <ColumnSelector
            columns={TEAM_COLUMNS}
            visibleColumns={teamCols}
            onChange={setTeamCols}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#334155]">
                {col('rank') && <th className="text-left py-2 px-3">Rank</th>}
                {col('name') && <th className="text-left py-2 px-3">Team Member</th>}
                {col('issues') && <th className="text-right py-2 px-3">Issues Reported</th>}
                {col('facilities') && <th className="text-right py-2 px-3">Facilities</th>}
                {col('active_days') && <th className="text-right py-2 px-3">Active Days</th>}
                {col('first_report') && <th className="text-right py-2 px-3">First Report</th>}
                {col('last_report') && <th className="text-right py-2 px-3">Last Report</th>}
              </tr>
            </thead>
            <tbody>
              {teamData.map((member, i) => (
                <tr key={member.live_monitoring_team} className="border-b border-[#334155]/50 hover:bg-[#334155]/50">
                  {col('rank') && (
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        i === 0 ? 'bg-amber-500/20 text-amber-400' :
                        i === 1 ? 'bg-slate-400/20 text-slate-300' :
                        i === 2 ? 'bg-orange-600/20 text-orange-400' :
                        'bg-[#334155] text-[#64748B]'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                  )}
                  {col('name') && <td className="py-2 px-3 text-[#F8FAFC] font-medium">{member.live_monitoring_team}</td>}
                  {col('issues') && <td className="py-2 px-3 text-right font-mono text-[#F8FAFC]">{formatNumber(Number(member.issues_reported))}</td>}
                  {col('facilities') && <td className="py-2 px-3 text-right font-mono text-[#94A3B8]">{member.facilities_covered}</td>}
                  {col('active_days') && <td className="py-2 px-3 text-right font-mono text-[#94A3B8]">{member.active_days}</td>}
                  {col('first_report') && <td className="py-2 px-3 text-right text-[#64748B]">{member.first_report || '—'}</td>}
                  {col('last_report') && <td className="py-2 px-3 text-right text-[#64748B]">{member.last_report || '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Coverage Heatmap */}
      <ChartCard title="Team × Facility Coverage" loading={loading}>
        {teams.length > 0 && facilities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="text-left py-1 px-2 text-[#64748B] font-medium sticky left-0 bg-[#1E293B] min-w-[140px]">Team Member</th>
                  {facilities.map((f) => (
                    <th key={f} className="py-1 px-1 text-[#64748B] font-medium text-center" style={{ minWidth: '40px' }}>
                      <span className="block transform -rotate-45 origin-center whitespace-nowrap">{f}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team}>
                    <td className="py-1 px-2 text-[#94A3B8] font-medium sticky left-0 bg-[#1E293B] whitespace-nowrap">{team}</td>
                    {facilities.map((facility) => {
                      const count = getCellCount(team, facility);
                      return (
                        <td key={facility} className="py-1 px-1">
                          <div
                            className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono ${getHeatColor(count)} ${count > 0 ? 'text-white' : 'text-[#64748B]'}`}
                            title={`${team} × ${facility}: ${count} issues`}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-[#64748B] text-sm">
            No coverage data available
          </div>
        )}
      </ChartCard>

      {/* Activity Timeline */}
      <ChartCard title="Monthly Activity Timeline (Last 12 Months)" loading={loading}>
        {monthlyActivity.allTeams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="text-left py-1 px-2 text-[#64748B] font-medium sticky left-0 bg-[#1E293B] min-w-[140px]">Team Member</th>
                  {monthlyActivity.allMonths.map((m) => (
                    <th key={m} className="py-1 px-1 text-[#64748B] font-medium text-center min-w-[48px]">
                      {m.substring(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyActivity.allTeams.map((team) => {
                  const teamMap = monthlyActivity.monthMap.get(team)!;
                  const teamMax = Math.max(...Array.from(teamMap.values()), 1);
                  return (
                    <tr key={team}>
                      <td className="py-1 px-2 text-[#94A3B8] font-medium sticky left-0 bg-[#1E293B] whitespace-nowrap">{team}</td>
                      {monthlyActivity.allMonths.map((month) => {
                        const count = teamMap.get(month) || 0;
                        const intensity = count / teamMax;
                        const bgClass = count === 0
                          ? 'bg-[#334155]'
                          : intensity < 0.25 ? 'bg-emerald-900/40'
                          : intensity < 0.5 ? 'bg-emerald-700/50'
                          : intensity < 0.75 ? 'bg-emerald-600/60'
                          : 'bg-emerald-500';
                        return (
                          <td key={month} className="py-1 px-1">
                            <div
                              className={`w-10 h-7 rounded flex items-center justify-center text-[10px] font-mono ${bgClass} ${count > 0 ? 'text-white' : 'text-[#64748B]'}`}
                              title={`${team} — ${month}: ${count} issues`}
                            >
                              {count > 0 ? count : ''}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-[#64748B] text-sm">
            No activity data available
          </div>
        )}
      </ChartCard>
    </div>
  );
}
