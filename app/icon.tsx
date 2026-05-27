import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: '#e06b49',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f5f0eb',
          fontWeight: 700,
          borderRadius: '6px',
        }}
      >
        C
      </div>
    ),
    { ...size },
  )
}
