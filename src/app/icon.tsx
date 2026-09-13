import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 900,
          fontFamily: 'sans-serif',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.4)',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized 'B' with tech PCB / circuit styling */}
          <path
            d="M5 4.5C5 3.67 5.67 3 6.5 3H14C16.49 3 18.5 5.01 18.5 7.5C18.5 9.15 17.61 10.6 16.3 11.4C18.06 12.16 19.3 13.9 19.3 16C19.3 18.76 17.06 21 14.3 21H6.5C5.67 21 5 20.33 5 19.5V4.5Z"
            fill="white"
          />
          {/* Top Negative Space */}
          <rect x="8.5" y="6" width="5.5" height="3.5" rx="1.75" fill="#2563eb" />
          {/* Bottom Negative Space with circuit terminal accent */}
          <rect x="8.5" y="13.5" width="6.5" height="4" rx="2" fill="#2563eb" />
          {/* Glow Accent Dot */}
          <circle cx="16.5" cy="15.5" r="1.25" fill="#60a5fa" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}