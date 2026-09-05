import React from 'react'

export function LogoIcon({ size = 28, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Outer 360-degree dynamic orbit ring */}
      <circle
        cx="24"
        cy="24"
        r="21"
        stroke="var(--primary, #8b3dff)"
        strokeWidth="2.5"
        strokeDasharray="100 32"
        strokeLinecap="round"
      />

      {/* Subtle inner payroll coin / cycle accent ring */}
      <circle
        cx="24"
        cy="24"
        r="16.5"
        stroke="var(--accent, #aa3bff)"
        strokeWidth="1.5"
        strokeDasharray="75 25"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />

      {/* Stylized Workforce Person Head */}
      <circle
        cx="24"
        cy="18"
        r="5"
        fill="var(--primary, #8b3dff)"
      />

      {/* Torso / Shoulders forming an upward growth arch */}
      <path
        d="M14.5 32.5 C14.5 26.5 19 25 24 25 C29 25 33.5 26.5 33.5 32.5"
        stroke="var(--primary, #8b3dff)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* 360 Satellite Node symbolizing payroll precision */}
      <circle
        cx="37"
        cy="13"
        r="3.2"
        fill="var(--accent, #aa3bff)"
      />
      <circle
        cx="37"
        cy="13"
        r="1.5"
        fill="#ffffff"
      />
    </svg>
  )
}

export function LogoBrand({ size = 28, fontSize = '20px', className = '' }) {
  return (
    <div
      className={`peoplepay-brand ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 700,
        fontFamily: 'var(--heading, system-ui, sans-serif)',
        lineHeight: 1,
      }}
    >
      <LogoIcon size={size} />
      <span
        style={{
          fontSize: fontSize,
          letterSpacing: '-0.02em',
          color: 'var(--text-heading, var(--text-h, #17131d))',
        }}
      >
        People<span style={{ color: 'var(--primary, #8b3dff)' }}>Pay</span>
        <span style={{ color: 'var(--text-muted, #746d7d)', fontWeight: 500 }}>360</span>
      </span>
    </div>
  )
}

export default LogoBrand
