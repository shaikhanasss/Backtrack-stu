import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        // Rounded pill inputs, matching the prototype's 30px radius
        'flex h-12 w-full rounded-pill border border-white/15 bg-white/95 px-5 py-2 text-base text-brand-navy',
        'placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
