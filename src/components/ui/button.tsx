import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * The prototype's button was a gold pill that scaled up on hover. That is kept
 * as the `default` variant so the brand feel survives the migration.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy',
  {
    variants: {
      variant: {
        default:
          'rounded-pill bg-brand-gold text-brand-navy hover:bg-brand-goldDark hover:scale-105 shadow-glow-gold',
        secondary:
          'rounded-pill bg-brand-blue text-white hover:bg-brand-blue/85',
        outline:
          'rounded-pill border border-white/25 bg-white/5 text-white hover:bg-white/15',
        ghost: 'rounded-pill text-white/85 hover:bg-white/10 hover:text-white',
        destructive:
          'rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/85',
        link: 'text-brand-gold underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-14 px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
