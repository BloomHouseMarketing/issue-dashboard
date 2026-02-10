'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart,
} from 'recharts';
import { yearMonthToLabel, formatNumber } from '@/lib/utils';

interface SeriesDef {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  series: SeriesDef[];
  showTotal?: boolean;
}

export default function DynamicTrendChart({ data, series, showTotal = true }: Props) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[#64748B] text-sm">
        No trend data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.label || yearMonthToLabel(d.year_month),
  }));

  // Build a lookup for formatter
  const seriesMap = Object.fromEntries(series.map((s) => [s.key, s.label]));

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        {showTotal ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} interval="preserveStartEnd" />
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
            <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="url(#totalGrad)" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} activeDot={{ r: 5 }} animationDuration={300} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={1.5}
                dot={false}
                strokeDasharray={s.dashed ? '4 4' : undefined}
                animationDuration={300}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [formatNumber(Number(value)), seriesMap[name] || name]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
              formatter={(value) => <span style={{ color: '#94A3B8' }}>{seriesMap[value] || value}</span>}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, fill: s.color }}
                activeDot={{ r: 5 }}
                strokeDasharray={s.dashed ? '4 4' : undefined}
                animationDuration={300}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
