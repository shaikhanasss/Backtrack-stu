'use client';

import type { Control, FieldPath, FieldValues, UseFormReturn, PathValue } from 'react-hook-form';

import { TextField } from '@/components/admin/form-fields';
import { slugify } from '@/lib/utils';

/**
 * Slug input with a "generate from" shortcut. Slugs are deliberately editable
 * rather than derived automatically, because changing one breaks existing URLs
 * and that should be a conscious act.
 */
export function SlugField<T extends FieldValues>({
  form,
  name,
  sourceName,
  label = 'Slug',
  placeholder,
}: {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  sourceName: FieldPath<T>;
  label?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <TextField
        control={form.control as Control<T>}
        name={name}
        label={label}
        placeholder={placeholder}
        description="Used in URLs. Lowercase letters, numbers and hyphens."
      />
      <button
        type="button"
        className="text-xs text-brand-gold underline"
        onClick={() =>
          form.setValue(
            name,
            slugify(String(form.getValues(sourceName) ?? '')) as PathValue<T, FieldPath<T>>
          )
        }
      >
        Generate from name
      </button>
    </div>
  );
}
