'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * Thin wrappers over the shadcn form primitives.
 *
 * Every admin form uses the same five field shapes, so binding label, control,
 * description and error message once here keeps eight entity forms readable
 * instead of repeating a nine-line <FormField> block per input.
 */

interface BaseProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  placeholder?: string;
}

export function TextField<T extends FieldValues>({
  control, name, label, description, placeholder, type = 'text',
}: BaseProps<T> & { type?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function NumberField<T extends FieldValues>({
  control, name, label, description, placeholder, min, max,
}: BaseProps<T> & { min?: number; max?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value)}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control, name, label, description, placeholder, rows = 4,
}: BaseProps<T> & { rows?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              rows={rows}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export const NONE_VALUE = '__none__';

export function SelectField<T extends FieldValues>({
  control, name, label, description, placeholder = 'Select...',
  options, allowNone = false, noneLabel = 'None', disabled = false, onChanged,
}: BaseProps<T> & {
  options: { value: string; label: string }[];
  allowNone?: boolean;
  noneLabel?: string;
  disabled?: boolean;
  onChanged?: (value: string | null) => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            disabled={disabled}
            value={field.value == null || field.value === '' ? NONE_VALUE : String(field.value)}
            onValueChange={(value) => {
              const next = value === NONE_VALUE ? (allowNone ? null : '') : value;
              field.onChange(next);
              onChanged?.(next === '' ? null : (next as string | null));
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {allowNone ? <SelectItem value={NONE_VALUE}>{noneLabel}</SelectItem> : null}
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SwitchField<T extends FieldValues>({
  control, name, label, description,
}: BaseProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            {description ? <FormDescription>{description}</FormDescription> : null}
          </div>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
