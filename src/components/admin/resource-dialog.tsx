'use client';

import { createContext, useContext, useState } from 'react';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/**
 * Dialog wrapper for create/edit forms.
 *
 * `close` reaches the form through context rather than a render prop. The
 * render-prop version could not work: these dialogs are rendered by Server
 * Components, and a function cannot cross the server/client boundary — React
 * refuses to serialize it ("Functions cannot be passed directly to Client
 * Components"), which silently broke every New/Edit button in the admin panel.
 * A plain ReactNode child serializes fine, and the form pulls `close` from
 * context once it is running on the client.
 */
const DialogCloseContext = createContext<() => void>(() => {});

/** Dismisses the surrounding ResourceDialog. Safe to call outside one (no-op). */
export function useResourceDialogClose() {
  return useContext(DialogCloseContext);
}

export function ResourceDialog({
  trigger,
  title,
  description,
  children,
  className,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {/* Mounted only while open so a 50-row table does not instantiate 50 forms. */}
        {open ? (
          <DialogCloseContext.Provider value={() => setOpen(false)}>
            {children}
          </DialogCloseContext.Provider>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
