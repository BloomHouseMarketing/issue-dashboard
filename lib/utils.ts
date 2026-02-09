export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function getChangeColor(value: number | null): string {
  if (value === null || value === undefined || value === 0) return 'text-text-muted';
  // Fewer issues = improvement = green, more issues = worse = red
  return value < 0 ? 'text-emerald-400' : 'text-red-400';
}

export function getChangeBgColor(value: number | null): string {
  if (value === null || value === undefined || value === 0) return 'bg-slate-700/50';
  return value < 0 ? 'bg-emerald-500/10' : 'bg-red-500/10';
}

export function getChangeArrow(value: number | null): string {
  if (value === null || value === undefined || value === 0) return '—';
  return value < 0 ? '↓' : '↑';
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function getSyncStatusColor(minutesAgo: number): string {
  if (minutesAgo < 35) return 'bg-emerald-500';
  if (minutesAgo < 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function yearMonthToLabel(ym: string): string {
  const [year, month] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${year}`;
}
