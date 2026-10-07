import type { HTMLAttributes } from 'react';
import { cn } from './utils';

type Tone = 'neutral' | 'coral' | 'success' | 'warning' | 'error' | 'dark' | 'muted';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-card text-ink',
  coral: 'bg-primary text-white',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  dark: 'bg-surface-dark text-canvas',
  muted: 'bg-surface-soft text-muted',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}