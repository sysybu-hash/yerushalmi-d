import type { Metadata } from "next";
import { Cormorant_Garamond, Frank_Ruhl_Libre, Heebo } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const serif = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif",
});

const sans = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const brand = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ירושלמי יהלומים | YERUSHALMI DIAMONDS",
    template: "%s | ירושלמי יהלומים",
  },
  description: "יהלומים נדירים ותכשיטי יוקרה בעבודת יד — אלגנטיות על-זמנית.",
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "ירושלמי יהלומים",
    title: "ירושלמי יהלומים | YERUSHALMI DIAMONDS",
    description: "יהלומים נדירים ותכשיטי יוקרה בעבודת יד — אלגנטיות על-זמנית.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ירושלמי יהלומים",
    description: "יהלומים נדירים ותכשיטי יוקרה בעבודת יד — אלגנטיות על-זמנית.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${serif.variable} ${sans.variable} ${brand.variable} font-sans subpixel-antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
