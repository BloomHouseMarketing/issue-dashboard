export default function ComparisonPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'pulseGlow 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulseGlow 8s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #a78bfa 0%, transparent 60%)',
            filter: 'blur(100px)',
            animation: 'pulseGlow 10s ease-in-out infinite',
          }}
        />
      </div>

      {/* Glassmorphism Card */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-12 py-14 rounded-3xl border max-w-lg w-full mx-4"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Animated Timer Icon */}
        <div className="relative" style={{ width: 100, height: 100 }}>
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Outer ring track */}
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="3"
              fill="none"
            />
            {/* Animated progress ring */}
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="url(#timerGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="264"
              strokeDashoffset="66"
              style={{
                transformOrigin: '50px 50px',
                animation: 'spinRing 4s linear infinite',
              }}
            />
            {/* Pulsing inner glow */}
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="rgba(99, 102, 241, 0.06)"
              style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}
            />
            {/* Clock body */}
            <circle
              cx="50"
              cy="50"
              r="24"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
              fill="rgba(255,255,255,0.02)"
            />
            {/* Hour hand */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="34"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                transformOrigin: '50px 50px',
                animation: 'rotateHour 8s linear infinite',
              }}
            />
            {/* Minute hand */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="30"
              stroke="rgba(167,139,250,0.8)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                transformOrigin: '50px 50px',
                animation: 'rotateMinute 3s linear infinite',
              }}
            />
            {/* Center dot */}
            <circle cx="50" cy="50" r="2.5" fill="#a78bfa" />
            {/* Top knob */}
            <rect
              x="47"
              y="2"
              width="6"
              height="8"
              rx="3"
              fill="rgba(255,255,255,0.2)"
            />
            {/* Tick marks */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (deg) => (
                <line
                  key={deg}
                  x1="50"
                  y1="28"
                  x2="50"
                  y2={deg % 90 === 0 ? '31' : '30'}
                  stroke={
                    deg % 90 === 0
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(255,255,255,0.12)'
                  }
                  strokeWidth={deg % 90 === 0 ? '1.5' : '1'}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: '50px 50px',
                    transform: `rotate(${deg}deg)`,
                  }}
                />
              )
            )}
            <defs>
              <linearGradient
                id="timerGradient"
                x1="0"
                y1="0"
                x2="100"
                y2="100"
              >
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #e2e8f0 0%, #a78bfa 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Coming Soon
          </h1>
          <p className="text-[#94A3B8] text-sm leading-relaxed max-w-xs">
            Month-over-month comparison analytics are currently being built. Check back shortly.
          </p>
        </div>

        {/* Subtle divider */}
        <div
          className="w-16 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)',
          }}
        />

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {['Trend Analysis', 'Facility Breakdown', 'Issue Tracking'].map(
            (feature) => (
              <span
                key={feature}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {feature}
              </span>
            )
          )}
        </div>
      </div>

      {/* Keyframe animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes spinRing {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes rotateHour {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes rotateMinute {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulseGlow {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
          `,
        }}
      />
    </div>
  );
}
