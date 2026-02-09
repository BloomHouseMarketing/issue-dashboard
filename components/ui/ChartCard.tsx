interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export default function ChartCard({ title, children, action, loading, className = '' }: ChartCardProps) {
  if (loading) {
    return (
      <div className={`bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm ${className}`}>
        <div className="h-5 w-40 bg-[#334155] rounded animate-pulse mb-6" />
        <div className="h-[300px] bg-[#334155]/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`bg-[#1E293B] border border-[#334155] rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#F8FAFC]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
