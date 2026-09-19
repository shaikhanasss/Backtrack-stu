'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { signupSchema, type SignupInput } from '@/lib/validators/auth';
import { registerUser, loginUser } from '@/server/actions/auth-actions';

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  function onSubmit(values: SignupInput) {
    startTransition(async () => {
      const result = await registerUser(values);

      if (!result.ok) {
        toast.error(result.message);
        // Surface server-side field errors (e.g. duplicate email) on the form.
        Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof SignupInput, { message: messages[0] });
          }
        });
        return;
      }

      // The account exists now, so sign the user straight in.
      const signedIn = await loginUser({
        email: values.email,
        password: values.password,
      });

      if (signedIn.ok) {
        toast.success('Account created. Welcome to BackTrack!');
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.success('Account created. Please sign in.');
        router.push('/login');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Aditya Chaudhari" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          {isPending ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}
