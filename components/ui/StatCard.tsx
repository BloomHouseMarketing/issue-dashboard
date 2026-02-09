import { formatNumber, getChangeColor, getChangeBgColor, getChangeArrow } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  change?: number | null;
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function StatCard({ title, value, subtitle, change, icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-[#334155] rounded animate-pulse" />
          <div className="h-5 w-14 bg-[#334155] rounded-full animate-pulse" />
        </div>
        <div className="h-9 w-20 bg-[#334155] rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-[#334155] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
          {icon}
          {title}
        </span>
        {change !== undefined && change !== null && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${getChangeColor(change)} ${getChangeBgColor(change)}`}>
            {getChangeArrow(change)} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-[#F8FAFC] font-mono mt-2">
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      {subtitle && (
        <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>
      )}
    </div>
  );
}
