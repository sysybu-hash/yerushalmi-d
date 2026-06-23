import type { default as SharpDefault } from "sharp";

type SharpFn = typeof SharpDefault;

let sharpPromise: Promise<SharpFn> | null = null;

/** Lazy-load sharp so routes that never composite images do not pull native libvips. */
export async function loadSharp(): Promise<SharpFn> {
  if (!sharpPromise) {
    sharpPromise = import("sharp").then((mod) => mod.default as SharpFn);
  }
  return sharpPromise;
}
