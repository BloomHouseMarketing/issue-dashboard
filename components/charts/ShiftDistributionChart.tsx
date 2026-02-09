'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SHIFT_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

interface ShiftData {
  facility: string;
  shift: string;
  issue_count: number;
  percentage: number;
}

interface Props {
  data: ShiftData[];
}

export default function ShiftDistributionChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-text-muted text-sm">
        No shift data available
      </div>
    );
  }

  // Pivot: each facility as a row, shifts as columns
  const facilityMap = new Map<string, Record<string, number>>();
  data.forEach((row) => {
    const existing = facilityMap.get(row.facility) || {};
    existing[row.shift] = Number(row.issue_count);
    facilityMap.set(row.facility, existing);
  });

  const chartData = Array.from(facilityMap.entries()).map(([facility, shifts]) => ({
    facility,
    ...shifts,
  }));

  const shifts = Array.from(new Set(data.map((d) => d.shift))).filter(Boolean);

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="facility"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [formatNumber(Number(value)), String(name)]}
          />
          {shifts.map((shift) => (
            <Bar
              key={shift}
              dataKey={shift}
              stackId="shifts"
              fill={SHIFT_COLORS[shift] || '#6B7280'}
              radius={[0, 0, 0, 0]}
              animationDuration={300}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {shifts.map((shift) => (
          <div key={shift} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SHIFT_COLORS[shift] || '#6B7280' }} />
            {shift}
          </div>
        ))}
      </div>
    </div>
  );
}
