/**
 * IndexedDB storage utility for saving local uploaded movies, posters,
 * and channel metadata persistently in Awn Tv pro without exhausting localStorage quotas.
 */

const DB_NAME = 'awn_tv_pro_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'local_media';

export interface LocalMediaChannelMeta {
  name: string;
  group: string;
  badge?: string;
  resolution?: '4K' | 'FHD' | 'HD' | 'SD';
  description?: string;
}

export interface StoredLocalMedia {
  id: string;
  videoBlob: Blob;
  posterBlob?: Blob | null;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
  channelMeta?: LocalMediaChannelMeta;
}

export interface HydratedLocalMedia {
  id: string;
  videoUrl: string;
  posterUrl?: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
  channelMeta?: LocalMediaChannelMeta;
}

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB غير مدعوم في هذا المتصفح'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('تعذر فتح قاعدة بيانات الأفلام'));
  });
}

export async function saveLocalMedia(record: StoredLocalMedia): Promise<void> {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('فشل حفظ ملف الفيلم في قاعدة البيانات'));
    };
    tx.onabort = () => {
      db.close();
      reject(new Error('تم إلغاء عملية حفظ الملف — قد تكون المساحة المتوفرة غير كافية'));
    };
  });
}

export async function getLocalMedia(id: string): Promise<StoredLocalMedia | null> {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as StoredLocalMedia) || null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error || new Error('فشل قراءة الفيلم من قاعدة البيانات'));
    };
  });
}

export async function updateLocalMediaRecord(
  id: string,
  updates: {
    videoBlob?: Blob;
    posterBlob?: Blob | null;
    fileName?: string;
    mimeType?: string;
    size?: number;
    channelMeta?: LocalMediaChannelMeta;
  }
): Promise<StoredLocalMedia | null> {
  const existing = await getLocalMedia(id);
  if (!existing) return null;

  const updated: StoredLocalMedia = {
    ...existing,
    videoBlob: updates.videoBlob !== undefined ? updates.videoBlob : existing.videoBlob,
    posterBlob: updates.posterBlob !== undefined ? updates.posterBlob : existing.posterBlob,
    fileName: updates.fileName !== undefined ? updates.fileName : existing.fileName,
    mimeType: updates.mimeType !== undefined ? updates.mimeType : existing.mimeType,
    size: updates.size !== undefined ? updates.size : existing.size,
    channelMeta: updates.channelMeta !== undefined ? updates.channelMeta : existing.channelMeta
  };

  await saveLocalMedia(updated);
  return updated;
}

export async function deleteLocalMedia(id: string): Promise<void> {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('تعذر حذف ملف الفيلم من قاعدة البيانات'));
    };
  });
}

export async function hydrateAllLocalMedia(): Promise<Record<string, HydratedLocalMedia>> {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      db.close();
      const records = (req.result as StoredLocalMedia[]) || [];
      const map: Record<string, HydratedLocalMedia> = {};

      for (const rec of records) {
        if (!rec || !rec.id || !rec.videoBlob) continue;
        const videoUrl = URL.createObjectURL(rec.videoBlob);
        const posterUrl = rec.posterBlob ? URL.createObjectURL(rec.posterBlob) : undefined;
        map[rec.id] = {
          id: rec.id,
          videoUrl,
          posterUrl,
          fileName: rec.fileName,
          mimeType: rec.mimeType,
          size: rec.size,
          createdAt: rec.createdAt,
          channelMeta: rec.channelMeta
        };
      }

      resolve(map);
    };

    req.onerror = () => {
      db.close();
      reject(req.error || new Error('تعذر استعادة الأفلام المحلية'));
    };
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}
