import { Link } from 'react-router-dom'

interface LogoProps {
  compact?: boolean
  variant?: 'light' | 'dark'
}

export function Logo({ compact = false, variant = 'light' }: LogoProps) {
  const isDark = variant === 'dark'
  const textColor = isDark ? 'text-white' : 'text-graphite'
  const subColor = isDark ? 'text-white/80' : 'text-charcoal'
  const monogramColor = isDark ? 'text-white' : 'text-brand-green'

  return (
    <Link to="/" className="inline-flex flex-col items-center select-none group">
      <span
        className={`font-serif font-normal tracking-tight leading-none ${monogramColor} ${
          compact ? 'text-2xl' : 'text-3xl'
        }`}
        aria-hidden="true"
      >
        VP
      </span>
      {!compact && (
        <>
          <span
            className={`block font-serif text-xs tracking-[0.28em] uppercase ${textColor} mt-1.5 font-medium`}
          >
            Verissimo
          </span>
          <span
            className={`block text-[10px] tracking-[0.35em] uppercase ${subColor} mt-0.5 font-medium`}
          >
            Pratas 925
          </span>
        </>
      )}
      <span className="sr-only">Verissimo Pratas 925</span>
    </Link>
  )
}
