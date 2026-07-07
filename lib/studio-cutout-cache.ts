import {
  persistentCacheKey,
  readPersistentCache,
  writePersistentCache,
} from "@/lib/studio-idempotency";

const CACHE_TTL_MS = 60 * 60 * 1000;

type CutoutEntry = {
  cutoutUrl: string;
  compositeUrl?: string;
  expiresAt: number;
};

const cutoutCache = new Map<string, CutoutEntry>();

function cacheKey(sourceUrl: string): string {
  return `v2-procedural:${sourceUrl.trim()}`;
}

export function getCachedCutout(sourceUrl: string): string | null {
  const entry = cutoutCache.get(cacheKey(sourceUrl));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cutoutCache.delete(cacheKey(sourceUrl));
    return null;
  }
  return entry.cutoutUrl;
}

export function getCachedComposite(sourceUrl: string): string | null {
  const entry = cutoutCache.get(cacheKey(sourceUrl));
  if (!entry?.compositeUrl) return null;
  if (Date.now() > entry.expiresAt) {
    cutoutCache.delete(cacheKey(sourceUrl));
    return null;
  }
  return entry.compositeUrl;
}

export function setCachedCutout(sourceUrl: string, cutoutUrl: string): void {
  const key = cacheKey(sourceUrl);
  const existing = cutoutCache.get(key);
  cutoutCache.set(key, {
    cutoutUrl,
    compositeUrl: existing?.compositeUrl,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function setCachedComposite(
  sourceUrl: string,
  cutoutUrl: string,
  compositeUrl: string
): void {
  cutoutCache.set(cacheKey(sourceUrl), {
    cutoutUrl,
    compositeUrl,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * מטמון cutout מתמיד (DB) — שורד deploy והפעלה מחדש.
 * L1: המפה בזיכרון למעלה; L2: טבלת studio_action_locks.
 */
export async function getPersistedCutout(
  sourceUrl: string
): Promise<string | null> {
  const inMemory = getCachedCutout(sourceUrl);
  if (inMemory) return inMemory;

  const stored = await readPersistentCache(
    persistentCacheKey("cutout", sourceUrl.trim())
  );
  const url = typeof stored?.cutoutUrl === "string" ? stored.cutoutUrl : null;
  if (url) setCachedCutout(sourceUrl, url);
  return url;
}

export async function persistCutout(
  sourceUrl: string,
  cutoutUrl: string
): Promise<void> {
  setCachedCutout(sourceUrl, cutoutUrl);
  await writePersistentCache(persistentCacheKey("cutout", sourceUrl.trim()), {
    cutoutUrl,
  });
}
