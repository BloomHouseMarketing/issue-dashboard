'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

export default function TrendPieChart({ data, series }: Props) {
  // Aggregate across all months
  const pieData = series.map((s) => ({
    name: s.label,
    value: data.reduce((sum, row) => sum + (Number(row[s.key]) || 0), 0),
    color: s.color,
  })).filter((d) => d.value > 0);

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  if (!pieData.length || total === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[#64748B] text-sm">
        No trend data available
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (!percent || percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#F8FAFC" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <div className="h-[340px] flex items-center">
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
              animationDuration={300}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#F8FAFC' }}
              labelStyle={{ color: '#F8FAFC' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [formatNumber(Number(value)), 'Issues']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 pr-4">
        {pieData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <div>
              <span className="text-sm text-[#F8FAFC] font-medium">{item.name}</span>
              <div className="text-xs text-[#64748B]">
                {formatNumber(item.value)} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
