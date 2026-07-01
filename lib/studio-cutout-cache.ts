const CACHE_TTL_MS = 60 * 60 * 1000;

type CutoutEntry = {
  cutoutUrl: string;
  compositeUrl?: string;
  expiresAt: number;
};

const cutoutCache = new Map<string, CutoutEntry>();

function cacheKey(sourceUrl: string): string {
  return sourceUrl.trim();
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
