import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

import type { SaveFileInput, SavedFile, StorageProvider } from '@/lib/storage/types';

/**
 * Stores files on local disk under `<project>/uploads/{pdfs,images}`.
 *
 * The directory sits OUTSIDE `public/` on purpose: files are served by
 * /api/files/[id], so the app decides who may read them. Dropping them in
 * `public/` would make every upload world-readable by URL guess and would tie
 * the app to a filesystem it cannot keep once it moves to object storage.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly root: string;

  constructor(root = path.join(process.cwd(), 'uploads')) {
    this.root = root;
  }

  private folderFor(kind: SaveFileInput['kind']) {
    return kind === 'PDF' ? 'pdfs' : 'images';
  }

  /**
   * Resolves a key to an absolute path and refuses anything that escapes the
   * root. Without this, a crafted key like "../../.env" would read arbitrary
   * files off the server.
   */
  private resolveKey(storageKey: string) {
    const absolute = path.resolve(this.root, storageKey);
    const rootWithSep = this.root.endsWith(path.sep) ? this.root : this.root + path.sep;
    if (!absolute.startsWith(rootWithSep)) {
      throw new Error('Invalid storage key');
    }
    return absolute;
  }

  async save({ kind, originalName, data }: SaveFileInput): Promise<SavedFile> {
    const folder = this.folderFor(kind);
    // Group by year-month so a long-lived uploads directory stays browsable.
    const now = new Date();
    const bucket = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Never reuse the client's filename on disk — it is attacker-controlled.
    // The original is preserved in the database for downloads instead.
    const extension = path.extname(originalName).toLowerCase().slice(0, 10);
    const storageKey = path.posix.join(folder, bucket, `${randomUUID()}${extension}`);

    const absolute = this.resolveKey(storageKey);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, data);

    return { storageKey, sizeBytes: data.byteLength };
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.resolveKey(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(this.resolveKey(storageKey));
    } catch (error) {
      // A missing file is not an error worth failing a delete over — the
      // database row is the source of truth and it is going away regardless.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await access(this.resolveKey(storageKey));
      return true;
    } catch {
      return false;
    }
  }
}
