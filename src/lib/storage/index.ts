import 'server-only';

import { LocalStorageProvider } from '@/lib/storage/local-provider';
import type { StorageProvider } from '@/lib/storage/types';

export * from '@/lib/storage/types';

/**
 * Single place where the storage backend is chosen.
 *
 * To move to S3 or R2 later: implement StorageProvider in a new file and
 * return it here based on STORAGE_DRIVER. Nothing else in the codebase needs
 * to change, because every caller depends on the interface, not the class.
 */
let provider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (provider) return provider;

  const driver = process.env.STORAGE_DRIVER ?? 'local';

  switch (driver) {
    case 'local':
      provider = new LocalStorageProvider();
      break;
    default:
      throw new Error(
        `Unknown STORAGE_DRIVER "${driver}". Supported drivers: local.`
      );
  }

  return provider;
}
