'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface DonutData {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutData[];
}

export default function IssueTypeDonut({ data }: Props) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="h-[300px] flex items-center justify-center text-text-muted text-sm">
        No issue type data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

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
    <div className="h-[300px] flex items-center">
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
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
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [formatNumber(Number(value)), 'Issues']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 pr-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <div>
              <span className="text-sm text-text-primary font-medium">{item.name}</span>
              <div className="text-xs text-text-muted">
                {formatNumber(item.value)} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
