'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { setProfileImage } from '@/server/actions/student';

/** Upload, replace or remove the student's profile picture. */
export function AvatarForm({
  currentImage,
  name,
}: {
  currentImage: string | null;
  name: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentImage);
  const [isUploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/upload/avatar', { method: 'POST', body });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error ?? 'Upload failed');
        return;
      }

      const result = await setProfileImage(payload.file.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setPreview(`/api/files/${payload.file.id}`);
      toast.success('Profile picture updated');
      router.refresh();
    } catch {
      toast.error('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove() {
    startTransition(async () => {
      const result = await setProfileImage(null);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setPreview(null);
      toast.success('Profile picture removed');
      router.refresh();
    });
  }

  const busy = isUploading || isPending;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar className="size-20">
        {preview ? <AvatarImage src={preview} alt="" /> : null}
        <AvatarFallback className="text-xl">{initials || 'S'}</AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={14} />}
            {isUploading ? 'Uploading...' : preview ? 'Change picture' : 'Upload picture'}
          </Button>

          {preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={busy}
              onClick={remove}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Trash2 size={14} />}
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-white/50">PNG, JPEG, WebP or GIF, up to 2 MB.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
