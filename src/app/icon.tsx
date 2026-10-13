import { ImageResponse } from 'next/og'

export const size = {
  width: 64,
  height: 64,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #070B14 0%, #030509 100%)',
          borderRadius: '15px',
        }}
      >
        <svg
          width="46"
          height="46"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="benchtechGrad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#0088FF" />
              <stop offset="100%" stopColor="#0044FF" />
            </linearGradient>
          </defs>

          {/* Left Detached Geometric Stem */}
          <path
            d="M22 53C22 47.5 26.5 43 32 43H45L22 80V53Z"
            fill="url(#benchtechGrad)"
          />

          {/* Main Geometric 'B' Ribbon */}
          <path
            d="M20 18H60C73 18 82 26.5 82 37.5C82 44.5 77.5 50.5 70.5 53C78.5 55.5 84 62 84 70.5C84 82.5 74 90 60 90H23L32 75H57C63.5 75 68 71.5 68 66.5C68 61.5 63.5 58 57 58H42L60 33H32C27.5 33 24.5 30 22.5 25L20 18Z"
            fill="url(#benchtechGrad)"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}