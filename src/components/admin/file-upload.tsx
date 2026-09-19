'use client';

import { useRef, useState } from 'react';
import { FileText, ImageIcon, Loader2, Upload, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { FileKind } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/storage/types';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  kind: FileKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Uploads a file to /api/admin/upload and hands the resulting FileAsset back.
 *
 * The upload happens immediately and independently of the form submit, so the
 * form only ever carries a file id. That keeps Server Action payloads small and
 * means a failed save does not lose an already-uploaded file.
 */
export function FileUploadField({
  kind,
  label,
  description,
  value,
  onChange,
}: {
  kind: FileKind;
  label: string;
  description?: string;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setUploading] = useState(false);

  const accept =
    kind === 'PDF' ? 'application/pdf' : 'image/png,image/jpeg,image/webp,image/gif';

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('kind', kind);

      const response = await fetch('/api/admin/upload', { method: 'POST', body });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error ?? 'Upload failed');
        return;
      }

      onChange(payload.file as UploadedFile);
      toast.success(`${file.name} uploaded`);
    } catch {
      toast.error('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const Icon = kind === 'PDF' ? FileText : ImageIcon;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-white/90">{label}</div>

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <Icon className="size-5 shrink-0 text-brand-gold" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-white">{value.originalName}</div>
            <div className="text-xs text-white/50">{formatBytes(value.sizeBytes)}</div>
          </div>
          <a
            href={`/api/files/${value.id}?download=1`}
            className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label={`Download ${value.originalName}`}
          >
            <Download size={16} />
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-destructive"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/20 p-4',
            isUploading && 'opacity-60'
          )}
        >
          <span className="text-sm text-white/55">
            {kind === 'PDF' ? 'PDF, up to 20 MB' : 'PNG, JPG, WebP or GIF, up to 5 MB'}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={14} />}
            {isUploading ? 'Uploading...' : 'Choose file'}
          </Button>
        </div>
      )}

      {description ? <p className="text-xs text-white/55">{description}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}

/** Multi-image variant used for note illustrations. */
export function MultiImageUploadField({
  label,
  values,
  onChange,
  max = 20,
}: {
  label: string;
  values: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  max?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {values.map((file, index) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
          >
            <span className="w-5 text-xs tabular-nums text-white/40">{index + 1}</span>
            <ImageIcon className="size-4 shrink-0 text-brand-gold" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white">{file.originalName}</div>
              <div className="text-xs text-white/50">{formatBytes(file.sizeBytes)}</div>
            </div>
            <button
              type="button"
              onClick={() => onChange(values.filter((f) => f.id !== file.id))}
              className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-destructive"
              aria-label={`Remove ${file.originalName}`}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {values.length < max ? (
        <FileUploadField
          kind="IMAGE"
          label={label}
          value={null}
          onChange={(file) => {
            if (!file) return;
            // Ignore a repeat upload of the same asset.
            if (values.some((f) => f.id === file.id)) return;
            onChange([...values, file]);
          }}
          description={`${values.length} of ${max} images added.`}
        />
      ) : (
        <p className="text-xs text-white/55">Maximum of {max} images reached.</p>
      )}
    </div>
  );
}
