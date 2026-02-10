'use client';

export default function ComparisonPage() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-80 h-80 rounded-full blur-[100px] opacity-30"
          style={{
            background: 'radial-gradient(circle, #3B82F6, transparent)',
            top: '15%',
            left: '20%',
            animation: 'floatOrb1 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-72 h-72 rounded-full blur-[100px] opacity-25"
          style={{
            background: 'radial-gradient(circle, #8B5CF6, transparent)',
            bottom: '15%',
            right: '15%',
            animation: 'floatOrb2 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full blur-[120px] opacity-20"
          style={{
            background: 'radial-gradient(circle, #06B6D4, transparent)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'floatOrb3 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full blur-[80px] opacity-15"
          style={{
            background: 'radial-gradient(circle, #EC4899, transparent)',
            top: '60%',
            left: '10%',
            animation: 'floatOrb4 9s ease-in-out infinite',
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Glassmorphism card */}
      <div
        className="relative z-10 rounded-2xl p-12 max-w-lg w-full text-center shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Animated timer icon */}
        <div className="mx-auto mb-8 w-24 h-24 relative flex items-center justify-center">
          {/* Outer spinning ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: '#3B82F6',
              borderRightColor: '#8B5CF6',
              animation: 'spinRing 3s linear infinite',
            }}
          />
          {/* Inner counter-spinning ring */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '4px',
              border: '2px solid transparent',
              borderBottomColor: '#06B6D4',
              borderLeftColor: '#3B82F6',
              animation: 'spinRingReverse 4s linear infinite',
            }}
          />
          {/* Pulsing glow behind icon */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '8px',
              background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          />
          {/* Clock/Timer SVG */}
          <svg
            className="relative w-10 h-10 text-[#3B82F6]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Gradient title */}
        <h2
          className="text-4xl font-bold mb-3"
          style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #3B82F6 50%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Coming Soon
        </h2>
        <p className="text-[#94A3B8] text-base leading-relaxed mb-8">
          Month-to-month comparison analytics are being built.
          <br />
          <span className="text-[#64748B]">
            Compare issue trends, resolution rates, and facility performance across time periods.
          </span>
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['Trend Analysis', 'Facility Comparison', 'Resolution Metrics'].map((feature) => (
            <span
              key={feature}
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                color: '#93C5FD',
              }}
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Animated progress bar */}
        <div className="w-full rounded-full h-1.5 mb-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: '65%',
              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #06B6D4)',
              backgroundSize: '200% 100%',
              animation: 'shimmerBar 2s ease-in-out infinite',
            }}
          />
        </div>
        <p className="text-xs text-[#64748B] tracking-wide uppercase">Development In Progress</p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.05); }
          66% { transform: translate(25px, -35px) scale(0.9); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes floatOrb4 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, -30px); }
        }
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinRingReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes shimmerBar {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
