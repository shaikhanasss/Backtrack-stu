import type { FileKind } from '@prisma/client';

export interface SaveFileInput {
  kind: FileKind;
  /** Name supplied by the browser, used to derive the extension. */
  originalName: string;
  mimeType: string;
  data: Buffer;
}

export interface SavedFile {
  /** Provider-relative key, stored in FileAsset.storageKey. */
  storageKey: string;
  sizeBytes: number;
}

/**
 * Storage abstraction.
 *
 * Everything the app does with files goes through this interface, so replacing
 * local disk with S3 or Cloudflare R2 later means writing one new class and
 * changing the factory in `index.ts` — no route, action or database change.
 */
export interface StorageProvider {
  readonly name: string;
  save(input: SaveFileInput): Promise<SavedFile>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}

/** Upload limits and accepted types, enforced before anything touches disk. */
export const UPLOAD_RULES = {
  PDF: {
    maxBytes: 20 * 1024 * 1024, // 20 MB
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
  },
  IMAGE: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
  },
} as const satisfies Record<FileKind, {
  maxBytes: number;
  mimeTypes: readonly string[];
  extensions: readonly string[];
}>;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
