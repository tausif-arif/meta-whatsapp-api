import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-active focus-visible:outline-primary',
  secondary:
    'bg-canvas border border-hairline text-ink hover:bg-surface-soft focus-visible:outline-primary',
  ghost: 'text-ink hover:bg-surface-card focus-visible:outline-primary',
  danger: 'bg-error text-white hover:opacity-90 focus-visible:outline-error',
  dark: 'bg-surface-dark text-canvas hover:bg-surface-dark-elevated focus-visible:outline-primary',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}