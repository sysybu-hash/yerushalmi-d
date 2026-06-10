export const metadata = { title: "סטודיו תוכן AI" };

// הסטודיו תלוי במשתני סביבה (Cloudinary) — לא לבנות אותו מראש
export const dynamic = "force-dynamic";

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Upload pipeline, generation queue, and approval flow will live here. */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
