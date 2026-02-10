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

  // Compute _rest = total minus sum of visible series, so stacked bars fill to total
  const chartData = data.map((d) => {
    const typesSum = series.reduce((sum, s) => sum + (Number(d[s.key]) || 0), 0);
    return { ...d, _rest: Math.max(0, (Number(d.total) || 0) - typesSum) };
  });

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
            formatter={(value: any, name: any) => {
              if (name === '_rest') return [formatNumber(Number(value)), 'Other'];
              return [formatNumber(Number(value)), seriesMap[name] || name];
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            itemSorter={(item: any) => -(Number(item.value) || 0)}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
            formatter={(value) => {
              if (value === '_rest') return <span style={{ color: '#64748B' }}>Other</span>;
              return <span style={{ color: '#94A3B8' }}>{seriesMap[value] || value}</span>;
            }}
          />
          {/* Stacked issue-type bars from bottom */}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="stack"
              fill={s.color}
              animationDuration={300}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) => {
                const { x, y, width, height, index } = props;
                const row = chartData[index] as Record<string, unknown> | undefined;
                const actual = Number(row?.[s.key]) || 0;
                if (!actual || height < 18) return null;
                return (
                  <text
                    x={x + width / 2}
                    y={y + height / 2}
                    fill="#F8FAFC"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {formatNumber(actual)}
                  </text>
                );
              }}
            />
          ))}
          {/* Remainder fills up to total (semi-transparent top) */}
          <Bar
            dataKey="_rest"
            stackId="stack"
            fill="#94A3B8"
            fillOpacity={0.15}
            radius={[4, 4, 0, 0]}
            animationDuration={300}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
