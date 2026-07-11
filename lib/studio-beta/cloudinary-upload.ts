import { createHash } from "node:crypto";
import { getCloudinaryServerAuth } from "@/lib/cloudinary-server";

/**
 * העלאה חתומה חדשה לסטודיו בטא, בנויה מעל getCloudinaryServerAuth()
 * (התשתית הגנרית הקיימת). אלגוריתם החתימה הוא חוזה ה-API הפומבי של
 * Cloudinary — לא קוד קנייני של הסטודיו הישן.
 */

function getCloudName(): string {
  const auth = getCloudinaryServerAuth();
  const fromAuth = auth?.cloudName;
  const fromEnv = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cloudName = fromAuth || fromEnv;
  if (!cloudName) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME חסר — נדרש להעלאת קבצים ל-Cloudinary"
    );
  }
  return cloudName;
}

function buildSignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

type UploadInput = {
  /** data URI (data:image/png;base64,...) או URL ציבורי קיים */
  source: string;
  resourceType: "image" | "video";
  /** קידומת שם קובץ ל-public_id — מזהה את מקור הנכס (למשל studio-beta-background) */
  filenamePrefix: string;
  folder?: string;
};

export async function uploadToCloudinary(
  input: UploadInput
): Promise<{ url: string; publicId: string }> {
  const auth = getCloudinaryServerAuth();
  if (!auth) {
    throw new Error(
      "CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET חסרים — נדרש להעלאת קבצים"
    );
  }

  const cloudName = getCloudName();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${input.filenamePrefix}-${timestamp}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const signParams: Record<string, string | number> = {
    public_id: publicId,
    timestamp,
    ...(input.folder ? { folder: input.folder } : {}),
  };
  const signature = buildSignature(signParams, auth.apiSecret);

  const form = new FormData();
  form.set("file", input.source);
  form.set("api_key", auth.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("public_id", publicId);
  if (input.folder) form.set("folder", input.folder);
  form.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${input.resourceType}/upload`,
    { method: "POST", body: form }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`העלאה ל-Cloudinary נכשלה (${response.status}): ${text}`);
  }

  const json = (await response.json()) as { secure_url: string };
  return { url: json.secure_url, publicId };
}
