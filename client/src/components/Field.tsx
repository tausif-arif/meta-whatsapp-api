import type { InputHTMLAttributes, ReactNode } from 'react';
import { Label } from '@radix-ui/react-label';
import { cn } from './utils';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export function Field({ label, error, hint, icon, className, ...props }: FieldProps) {
  const id = props.id ?? `field-${label}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-body-strong">
        {label}
      </Label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          className={cn(
            'h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 text-sm text-ink',
            'placeholder:text-muted-soft focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-primary/25',
            icon && 'pl-9',
            error && 'border-error',
            className,
          )}
          {...props}
        />
      </div>
      {error ? <p className="text-xs text-error">{error}</p> : null}
      {hint && !error ? <p className="text-xs text-muted-soft">{hint}</p> : null}
    </div>
  );
}