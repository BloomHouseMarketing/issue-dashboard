'use client';

import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { yearMonthToLabel, formatNumber } from '@/lib/utils';
import { ISSUE_TYPE_COLORS } from '@/lib/constants';

interface TrendData {
  year_month: string;
  total_issues: number;
  rounds_count: number;
  safety_count: number;
  it_count: number;
}

interface Props {
  data: TrendData[];
}

export default function MonthlyTrendChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-text-muted text-sm">
        No trend data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: yearMonthToLabel(d.year_month),
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const labels: Record<string, string> = {
                total_issues: 'Total',
                rounds_count: 'Rounds',
                safety_count: 'Safety',
                it_count: 'IT',
              };
              const n = String(name);
              return [formatNumber(Number(value)), labels[n] || n];
            }}
          />
          <Area
            type="monotone"
            dataKey="total_issues"
            stroke="#3B82F6"
            fill="url(#totalGradient)"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3B82F6' }}
            activeDot={{ r: 5 }}
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="rounds_count"
            stroke={ISSUE_TYPE_COLORS.Rounds}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="safety_count"
            stroke={ISSUE_TYPE_COLORS.Safety}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="it_count"
            stroke={ISSUE_TYPE_COLORS.IT}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <div className="w-4 h-0.5 bg-blue-500" /> Total
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <div className="w-4 h-0.5 bg-blue-500 border-dashed" style={{ borderTop: '2px dashed #3B82F6', height: 0 }} /> Rounds
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <div className="w-4 h-0.5" style={{ borderTop: '2px dashed #EF4444', height: 0 }} /> Safety
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <div className="w-4 h-0.5" style={{ borderTop: '2px dashed #6B7280', height: 0 }} /> IT
        </div>
      </div>
    </div>
  );
}
