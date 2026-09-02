import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../utils/format'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-green text-white hover:bg-brand-green-dark border border-brand-green',
  secondary:
    'bg-transparent text-brand-green border border-brand-green hover:bg-brand-green hover:text-white',
  ghost:
    'bg-transparent text-graphite hover:bg-off-white border border-transparent',
  outline:
    'bg-transparent text-graphite border border-border hover:border-brand-green hover:text-brand-green',
}

const sizes = {
  sm: 'px-5 py-2 text-xs tracking-widest uppercase',
  md: 'px-8 py-3 text-xs tracking-widest uppercase',
  lg: 'px-10 py-4 text-sm tracking-widest uppercase',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center justify-center font-sans font-medium transition-colors duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
