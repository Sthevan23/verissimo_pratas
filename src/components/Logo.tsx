import { Link } from 'react-router-dom'

interface LogoProps {
  compact?: boolean
  variant?: 'light' | 'dark'
}

export function Logo({ compact = false, variant = 'light' }: LogoProps) {
  const isDark = variant === 'dark'
  const textColor = isDark ? 'text-white' : 'text-graphite'
  const subColor = isDark ? 'text-white/70' : 'text-muted'
  const monogramColor = isDark ? 'text-white' : 'text-graphite'

  return (
    <Link to="/" className="inline-flex flex-col items-center select-none group">
      <span
        className={`font-serif font-light tracking-tight leading-none ${monogramColor} ${
          compact ? 'text-2xl' : 'text-3xl'
        }`}
        aria-hidden="true"
      >
        VP
      </span>
      {!compact && (
        <>
          <span
            className={`block font-serif text-[10px] tracking-[0.35em] uppercase ${textColor} mt-1.5`}
          >
            Verissimo
          </span>
          <span
            className={`block text-[8px] tracking-[0.45em] uppercase ${subColor} mt-0.5`}
          >
            Pratas 925
          </span>
        </>
      )}
      <span className="sr-only">Verissimo Pratas 925</span>
    </Link>
  )
}
