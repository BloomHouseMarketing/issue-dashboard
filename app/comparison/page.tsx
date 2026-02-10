'use client';

export default function ComparisonPage() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      {/* Blurred background shapes for depth */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#3B82F6]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#8B5CF6]/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-[120px]" />
      </div>

      {/* Glassmorphism card */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 max-w-lg w-full text-center shadow-2xl">
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-[#F8FAFC] mb-3">Coming Soon</h2>
        <p className="text-[#94A3B8] text-base leading-relaxed mb-8">
          Month-to-month comparison is currently under development.
          This feature will allow you to compare issue trends across different time periods.
        </p>

        {/* Decorative progress bar */}
        <div className="w-full bg-white/5 rounded-full h-2 mb-4 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] w-[65%] animate-pulse" />
        </div>
        <p className="text-xs text-[#64748B]">In Progress</p>
      </div>
    </div>
  );
}
