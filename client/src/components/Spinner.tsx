import { Loader2 } from 'lucide-react';
import { cn } from './utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-muted', className)} />;
}

export function CenteredSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted">
      <Spinner />
      {label}
    </div>
  );
}