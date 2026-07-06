export type CloudinaryServerAuth = {
  apiKey: string;
  apiSecret: string;
  cloudName?: string;
};

/** מפתחות שרת לעלאה חתומה — מ-CLOUDINARY_API_KEY/SECRET או CLOUDINARY_URL */
export function getCloudinaryServerAuth(): CloudinaryServerAuth | null {
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (apiKey && apiSecret) {
    return { apiKey, apiSecret };
  }

  const url = process.env.CLOUDINARY_URL?.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "cloudinary:") return null;

    const key = decodeURIComponent(parsed.username);
    const secret = decodeURIComponent(parsed.password);
    const cloudName = parsed.hostname || undefined;

    if (!key || !secret) return null;
    return { apiKey: key, apiSecret: secret, cloudName };
  } catch {
    return null;
  }
}

export function hasCloudinaryServerAuth(): boolean {
  return getCloudinaryServerAuth() !== null;
}
