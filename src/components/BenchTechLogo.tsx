interface BenchTechLogoProps {
  className?: string
  size?: number
}

export function BenchTechLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-[#060911] border border-slate-800/80 flex items-center justify-center shadow-xs shrink-0 overflow-hidden`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[72%] h-[72%]"
      >
        <defs>
          <linearGradient
            id="btBrandGrad"
            x1="15"
            y1="15"
            x2="85"
            y2="85"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#0088FF" />
            <stop offset="100%" stopColor="#0044FF" />
          </linearGradient>
        </defs>
        <path
          d="M22 53C22 47.5 26.5 43 32 43H45L22 80V53Z"
          fill="url(#btBrandGrad)"
        />
        <path
          d="M20 18H60C73 18 82 26.5 82 37.5C82 44.5 77.5 50.5 70.5 53C78.5 55.5 84 62 84 70.5C84 82.5 74 90 60 90H23L32 75H57C63.5 75 68 71.5 68 66.5C68 61.5 63.5 58 57 58H42L60 33H32C27.5 33 24.5 30 22.5 25L20 18Z"
          fill="url(#btBrandGrad)"
        />
      </svg>
    </div>
  )
}