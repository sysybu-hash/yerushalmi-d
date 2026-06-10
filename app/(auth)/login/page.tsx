export const metadata = { title: "אזור אישי" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <p className="font-serif text-2xl font-light tracking-[0.15em]">
          ירושלמי
        </p>
        <p className="mt-1 text-[9px] tracking-[0.3em] text-muted-foreground">
          אזור אישי
        </p>
        <p className="mt-10 text-sm font-light text-muted-foreground">
          כניסה מאובטחת תוקם כאן (חיבור ספק ההזדהות יבוצע בשלב הבא).
        </p>
      </div>
    </main>
  );
}
