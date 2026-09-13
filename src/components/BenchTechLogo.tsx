interface BenchTechLogoProps {
  className?: string
  size?: number
}

export function BenchTechLogo({ className = '', size = 32 }: BenchTechLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 shadow-md shadow-blue-500/25 shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        {/* Main Solid 'B' Base */}
        <path
          d="M5 4.5C5 3.67 5.67 3 6.5 3H14C16.49 3 18.5 5.01 18.5 7.5C18.5 9.15 17.61 10.6 16.3 11.4C18.06 12.16 19.3 13.9 19.3 16C19.3 18.76 17.06 21 14.3 21H6.5C5.67 21 5 20.33 5 19.5V4.5Z"
          fill="white"
        />
        {/* Upper Core Window */}
        <rect x="8.5" y="6" width="5.5" height="3.5" rx="1.75" fill="#2563eb" />
        {/* Lower Core Window */}
        <rect x="8.5" y="13.5" width="6.5" height="4" rx="2" fill="#2563eb" />
        {/* Benchmark Circuit Node */}
        <circle cx="16.5" cy="15.5" r="1.25" fill="#93c5fd" />
      </svg>
    </div>
  )
}