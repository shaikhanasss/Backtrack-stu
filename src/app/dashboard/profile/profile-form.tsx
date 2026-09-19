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
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { profileSchema, type ProfileInput } from '@/lib/validators/profile';
import { updateProfile } from '@/server/actions/profile-actions';
import type { AcademicOptions } from '@/server/queries';

const NONE = '__none__';

export function ProfileForm({
  options,
  defaults,
}: {
  options: AcademicOptions;
  defaults: {
    name: string;
    image: string | null;
    boardId: string | null;
    classId: string | null;
    streamId: string | null;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: defaults.name,
      // Managed by the upload control above, not typed in as a URL.
      image: defaults.image ?? '',
      boardId: defaults.boardId ?? null,
      classId: defaults.classId ?? null,
      streamId: defaults.streamId ?? null,
    },
  });

  // Class and stream options depend on the chosen board, so they are derived
  // from the live form value rather than captured once at mount.
  const boardId = form.watch('boardId');
  const selectedBoard = options.find((board) => board.id === boardId);
  const classOptions = selectedBoard?.classes ?? [];
  const streamOptions = selectedBoard?.streams ?? [];

  // SSC has no Stream rows, so the field disappears entirely for it.
  const streamsApply = streamOptions.length > 0;

  function onSubmit(values: ProfileInput) {
    startTransition(async () => {
      const result = await updateProfile(values);

      if (!result.ok) {
        toast.error(result.message);
        Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof ProfileInput, { message: messages[0] });
          }
        });
        return;
      }

      toast.success('Profile updated');
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="boardId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Board</FormLabel>
              <Select
                value={field.value ?? NONE}
                onValueChange={(value) => {
                  field.onChange(value === NONE ? null : value);
                  // Changing board invalidates the previous class and stream.
                  form.setValue('classId', null);
                  form.setValue('streamId', null);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>Not set</SelectItem>
                  {options.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select
                value={field.value ?? NONE}
                onValueChange={(value) => field.onChange(value === NONE ? null : value)}
                disabled={!boardId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={boardId ? 'Not set' : 'Select a board first'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE}>Not set</SelectItem>
                  {classOptions.map((klass) => (
                    <SelectItem key={klass.id} value={klass.id}>
                      {klass.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rendered only when the selected board actually offers streams. */}
        {streamsApply ? (
          <FormField
            control={form.control}
            name="streamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stream</FormLabel>
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(value) => field.onChange(value === NONE ? null : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>Not set</SelectItem>
                    {streamOptions.map((stream) => (
                      <SelectItem key={stream.id} value={stream.id}>
                        {stream.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : boardId ? (
          <p className="text-sm text-white/55">
            {selectedBoard?.name} has no streams, so no stream is required.
          </p>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}
