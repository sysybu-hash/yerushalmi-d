import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ירושלמי יהלומים",
    short_name: "ירושלמי",
    description: "יהלומים נדירים ותכשיטי יוקרה בעבודת יד — אלגנטיות על-זמנית.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F4",
    theme_color: "#1A1714",
    lang: "he",
    dir: "rtl",
    icons: [
      {
        src: "/logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
