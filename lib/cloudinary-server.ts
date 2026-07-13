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

export type CloudinaryUsage = {
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  usedPercent: number;
  storageCredits: number;
  bandwidthCredits: number;
  transformationCredits: number;
};

/** שאילתת שימוש חודשי מ-Admin API של Cloudinary — לתצוגת קרדיטים בלוח הבקרה */
export async function getCloudinaryUsage(): Promise<CloudinaryUsage | null> {
  const auth = getCloudinaryServerAuth();
  const cloudName =
    auth?.cloudName ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!auth || !cloudName) return null;

  const basicAuth = Buffer.from(`${auth.apiKey}:${auth.apiSecret}`).toString(
    "base64"
  );
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
    { headers: { Authorization: `Basic ${basicAuth}` }, cache: "no-store" }
  );
  if (!response.ok) return null;

  const json = await response.json();
  return {
    plan: json.plan ?? "לא ידוע",
    creditsUsed: json.credits?.usage ?? 0,
    creditsLimit: json.credits?.limit ?? 0,
    usedPercent: json.credits?.used_percent ?? 0,
    storageCredits: json.storage?.credits_usage ?? 0,
    bandwidthCredits: json.bandwidth?.credits_usage ?? 0,
    transformationCredits: json.transformations?.credits_usage ?? 0,
  };
}
