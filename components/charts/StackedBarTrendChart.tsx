'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
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

export default function StackedBarTrendChart({ data, series }: Props) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[#64748B] text-sm">
        No trend data available
      </div>
    );
  }

  const seriesMap = Object.fromEntries(series.map((s) => [s.key, s.label]));

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            interval="preserveStartEnd"
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
            formatter={(value: any, name: any) => [
              formatNumber(Number(value)),
              seriesMap[name] || (name === 'total' ? 'Total' : name),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
            formatter={(value) => (
              <span style={{ color: '#94A3B8' }}>
                {seriesMap[value] || (value === 'total' ? 'Total' : value)}
              </span>
            )}
          />
          {/* Total as a semi-transparent background bar */}
          <Bar
            dataKey="total"
            fill="#3B82F6"
            fillOpacity={0.15}
            radius={[4, 4, 0, 0]}
            animationDuration={300}
          />
          {/* Stacked issue-type bars */}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="issues"
              fill={s.color}
              radius={i === series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              animationDuration={300}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
