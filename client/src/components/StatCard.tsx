import type { ReactNode } from 'react';
import { cn } from './utils';

export function StatCard({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg bg-surface-card p-5', className)}>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{label}</span>
        {icon}
      </div>
      <p className="font-display mt-2 text-3xl leading-none text-ink">{value}</p>
      {sub ? <p className="mt-2 text-xs text-muted-soft">{sub}</p> : null}
    </div>
  );
}