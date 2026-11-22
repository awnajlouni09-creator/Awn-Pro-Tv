import { TitleReview, TitleReviewReply } from '../types/iptv';

export const VISITOR_REVIEWS_STORAGE_KEY = 'awn_tv_title_reviews_v1';
export const REVIEW_LIKES_STORAGE_KEY = 'awn_tv_review_likes_v1';
export const LIKED_TITLES_STORAGE_KEY = 'awn_tv_liked_titles_v1';
export const WATCHED_TITLES_STORAGE_KEY = 'awn_tv_watched_titles_v1';

export function readAllVisitorReviews(): Record<string, TitleReview[]> {
  try {
    const raw = localStorage.getItem(VISITOR_REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, TitleReview[]>;
      }
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

export function writeAllVisitorReviews(map: Record<string, TitleReview[]>): void {
  try {
    localStorage.setItem(VISITOR_REVIEWS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function getVisitorReviewsForChannel(channelId: string): TitleReview[] {
  const all = readAllVisitorReviews();
  return Array.isArray(all[channelId]) ? all[channelId] : [];
}

export function addVisitorReviewForChannel(channelId: string, review: TitleReview): TitleReview[] {
  const all = readAllVisitorReviews();
  const existing = Array.isArray(all[channelId]) ? all[channelId] : [];
  const next = [review, ...existing];
  all[channelId] = next;
  writeAllVisitorReviews(all);
  return next;
}

export function deleteVisitorReviewForChannel(channelId: string, reviewId: string): TitleReview[] {
  const all = readAllVisitorReviews();
  const existing = Array.isArray(all[channelId]) ? all[channelId] : [];
  const next = existing.filter((r) => r.id !== reviewId);
  if (next.length > 0) {
    all[channelId] = next;
  } else {
    delete all[channelId];
  }
  writeAllVisitorReviews(all);
  return next;
}

export function readReviewLikesState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(REVIEW_LIKES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, boolean>;
    }
  } catch {
    // ignore
  }
  return {};
}

export function toggleReviewLikeState(reviewId: string): Record<string, boolean> {
  const current = readReviewLikesState();
  const next = { ...current };
  if (next[reviewId]) {
    delete next[reviewId];
  } else {
    next[reviewId] = true;
  }
  try {
    localStorage.setItem(REVIEW_LIKES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function addReplyToVisitorReview(
  channelId: string,
  reviewId: string,
  reply: TitleReviewReply
): TitleReview[] {
  const all = readAllVisitorReviews();
  const existing = Array.isArray(all[channelId]) ? all[channelId] : [];
  const next = existing.map((r) => {
    if (r.id !== reviewId) return r;
    const replies = [...(r.replies || []), reply];
    return {
      ...r,
      replies,
      repliesCount: replies.length
    };
  });
  all[channelId] = next;
  writeAllVisitorReviews(all);
  return next;
}

export function readIdList(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function toggleIdInList(storageKey: string, id: string): string[] {
  const current = readIdList(storageKey);
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export async function compressImageFileToDataUrl(file: File, maxDim = 420, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('تعذر قراءة الصورة'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
        } catch {
          // fallback
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.readAsDataURL(file);
  });
}
