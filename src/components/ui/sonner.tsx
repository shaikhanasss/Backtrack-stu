'use client';

import { Toaster as Sonner } from 'sonner';

/**
 * Replaces the prototype's `window.alert()` calls with proper toasts.
 */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            'glass rounded-2xl text-white border-white/15 backdrop-blur-md',
          description: 'text-white/70',
          actionButton: 'bg-brand-gold text-brand-navy',
          error: 'text-destructive',
        },
      }}
    />
  );
}
