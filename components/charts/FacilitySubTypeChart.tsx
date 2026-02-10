'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

export default function FacilitySubTypeChart({ data, series }: Props) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[#64748B] text-sm">
        No data available
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => (b.total || 0) - (a.total || 0));

  // Build formatter lookup
  const seriesMap = Object.fromEntries(series.map((s) => [s.key, s.label]));

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [formatNumber(Number(value)), seriesMap[name] || (name === 'total' ? 'Total' : name)]}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
            formatter={(value) => <span style={{ color: '#94A3B8' }}>{seriesMap[value] || (value === 'total' ? 'Total' : value)}</span>}
          />
          {/* Total bar as background */}
          <Bar dataKey="total" fill="#334155" opacity={0.5} radius={[4, 4, 0, 0]} animationDuration={300} barSize={30} />
          {/* Sub-type bars overlapping */}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.color}
              radius={[2, 2, 0, 0]}
              animationDuration={300}
              barSize={Math.max(6, Math.floor(24 / Math.max(series.length, 1)))}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
