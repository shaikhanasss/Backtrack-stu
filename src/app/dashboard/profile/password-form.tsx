'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/lib/validators/profile';
import { changePassword } from '@/server/actions/profile-actions';

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  function onSubmit(values: ChangePasswordInput) {
    startTransition(async () => {
      const result = await changePassword(values);

      if (!result.ok) {
        toast.error(result.message);
        Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof ChangePasswordInput, { message: messages[0] });
          }
        });
        return;
      }

      toast.success('Password changed');
      form.reset();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>
                At least 8 characters, with an uppercase letter, a lowercase
                letter and a number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          {isPending ? 'Updating...' : 'Change password'}
        </Button>
      </form>
    </Form>
  );
}
