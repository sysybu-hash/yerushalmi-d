/** משתני סביבה נדרשים לסטודיו AI */
const STUDIO_ENV_KEYS = [
  "REPLICATE_API_TOKEN",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
  "JWT_SECRET",
] as const;

export function getStudioEnvIssues(): string[] {
  return STUDIO_ENV_KEYS.filter((key) => !process.env[key]?.trim());
}

export function assertStudioEnv(): void {
  const missing = getStudioEnvIssues();
  if (missing.length > 0) {
    throw new Error(
      `חסרים משתני סביבה ב-Vercel (${missing.join(", ")}). הוסיפו אותם ב-Settings → Environment Variables לסביבת Production ו-Preview.`
    );
  }
}
