'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { FACILITY_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  series: SeriesDef[];
}

export default function FacilityBarChart({ data, series }: Props) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[#64748B] text-sm">
        No facility data available
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => (b.total_issues || 0) - (a.total_issues || 0));

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
          <YAxis
            type="category"
            dataKey="facility"
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            width={55}
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
              const s = series.find((s) => s.key === name);
              return [formatNumber(Number(value)), s?.label || String(name)];
            }}
          />
          {series.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#94A3B8', paddingTop: '8px' }}
              formatter={(value) => {
                const s = series.find((s) => s.key === value);
                return <span style={{ color: '#94A3B8' }}>{s?.label || value}</span>;
              }}
            />
          )}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="stack"
              fill={s.color}
              radius={i === series.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
              animationDuration={300}
            />
          ))}
          {series.length === 0 && (
            <Bar dataKey="total_issues" radius={[0, 4, 4, 0]} animationDuration={300}>
              {sorted.map((entry) => (
                <Cell key={entry.facility} fill={FACILITY_COLORS[entry.facility] || '#3B82F6'} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
