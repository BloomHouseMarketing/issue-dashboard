'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface ComparisonData {
  name: string;
  monthA: number;
  monthB: number;
}

interface Props {
  data: ComparisonData[];
  labelA: string;
  labelB: string;
}

export default function ComparisonBarChart({ data, labelA, labelB }: Props) {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-text-muted text-sm">
        No comparison data available
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
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
            formatter={(value: any, name: any) => [formatNumber(Number(value ?? 0)), String(name)]}
          />
          <Legend
            wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}
          />
          <Bar name={labelA} dataKey="monthA" fill="#60A5FA" radius={[4, 4, 0, 0]} animationDuration={300} />
          <Bar name={labelB} dataKey="monthB" fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={300} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
