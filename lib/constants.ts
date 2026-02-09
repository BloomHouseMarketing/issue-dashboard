export const STATE_COLORS: Record<string, string> = {
  California: '#3B82F6',
  Tennessee: '#10B981',
  Texas: '#F59E0B',
  Kentucky: '#8B5CF6',
};

export const FACILITY_COLORS: Record<string, string> = {
  OPUS: '#2563EB',
  MHC: '#3B82F6',
  SVR: '#60A5FA',
  CAMH: '#93C5FD',
  Revival: '#1D4ED8',
  Hillside: '#1E40AF',
  PCMH: '#7DD3FC',
  LAMH: '#0EA5E9',
  TNBH: '#10B981',
  NASH: '#34D399',
  Lonestar: '#F59E0B',
  Dallas: '#FBBF24',
  Kentucky: '#8B5CF6',
};

export const FACILITY_STATES: Record<string, string> = {
  OPUS: 'California',
  MHC: 'California',
  SVR: 'California',
  CAMH: 'California',
  Revival: 'California',
  Hillside: 'California',
  PCMH: 'California',
  LAMH: 'California',
  TNBH: 'Tennessee',
  NASH: 'Tennessee',
  Lonestar: 'Texas',
  Dallas: 'Texas',
  Kentucky: 'Kentucky',
};

export const ISSUE_TYPE_COLORS: Record<string, string> = {
  Rounds: '#3B82F6',
  Safety: '#EF4444',
  IT: '#6B7280',
};

export const SHIFT_COLORS: Record<string, string> = {
  'NOC PST': '#1E3A5F',
  'AM PST': '#FBBF24',
  Swing: '#10B981',
};

export const STATUS_COLORS = {
  completed: '#10B981',
  failed: '#EF4444',
  running: '#F59E0B',
};

export const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: 'overview' },
  { label: 'Facility', href: '/facility', icon: 'facility' },
  { label: 'Comparison', href: '/comparison', icon: 'comparison' },
  { label: 'Team', href: '/team', icon: 'team' },
] as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
