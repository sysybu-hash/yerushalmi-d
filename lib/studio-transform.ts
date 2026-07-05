/**
 * בניית כתובות Cloudinary עם טרנספורמציות — למיטוב ועריכה של
 * תמונות ווידאו קיימים בסטודיו.
 */

import type { VideoAudioStyleId } from "@/lib/studio-audio-presets";
import { getAudioStyle } from "@/lib/studio-audio-presets";

export type MediaResourceType = "image" | "video";

export type AspectId = "original" | "1:1" | "4:5" | "9:16" | "16:9";

export const ASPECT_OPTIONS: { id: AspectId; label: string }[] = [
  { id: "original", label: "מקורי" },
  { id: "1:1", label: "ריבוע 1:1 (פוסט)" },
  { id: "4:5", label: "פורטרט 4:5" },
  { id: "9:16", label: "סטורי / ריל 9:16" },
  { id: "16:9", label: "רוחב 16:9" },
];

export type ImageAdjustments = {
  autoEnhance: boolean;
  autoColor: boolean;
  sharpen: boolean;
  brightness: number;
  saturation: number;
  contrast: number;
  aspect: AspectId;
  upscale: boolean;
};

export type VideoAdjustments = {
  aspect: AspectId;
  mute: boolean;
  brightness: number;
  saturation: number;
  contrast: number;
  trimStart: number | null;
  trimEnd: number | null;
  autoEnhance: boolean;
  autoColor: boolean;
  sharpen: boolean;
  denoise: boolean;
  audioStyle: VideoAudioStyleId;
  audioVolume: number;
};

export const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  autoEnhance: true,
  autoColor: true,
  sharpen: true,
  brightness: 0,
  saturation: 0,
  contrast: 5,
  aspect: "original",
  upscale: true,
};

export const JEWELRY_CATALOG_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  autoEnhance: true,
  autoColor: true,
  sharpen: true,
  brightness: 5,
  saturation: -5,
  contrast: 8,
  aspect: "1:1",
  upscale: false,
};

export const DEFAULT_VIDEO_ADJUSTMENTS: VideoAdjustments = {
  aspect: "original",
  mute: false,
  brightness: 0,
  saturation: 0,
  contrast: 0,
  trimStart: null,
  trimEnd: null,
  autoEnhance: false,
  autoColor: false,
  sharpen: false,
  denoise: false,
  audioStyle: "original",
  audioVolume: 35,
};

export const JEWELRY_CATALOG_VIDEO_ADJUSTMENTS: VideoAdjustments = {
  aspect: "9:16",
  mute: false,
  brightness: 5,
  saturation: -5,
  contrast: 8,
  trimStart: null,
  trimEnd: null,
  autoEnhance: true,
  autoColor: true,
  sharpen: true,
  denoise: true,
  audioStyle: "luxury",
  audioVolume: 32,
};

function encodeFetchUrl(url: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(url).toString("base64");
  }
  return btoa(url);
}

function aspectComponent(aspect: AspectId): string | null {
  if (aspect === "original") return null;
  return `c_fill,g_auto,ar_${aspect}`;
}

function imageComponents(adj: ImageAdjustments): string[] {
  const parts: string[] = [];
  if (adj.autoEnhance) parts.push("e_improve");
  if (adj.autoColor) parts.push("e_auto_color");
  if (adj.sharpen) parts.push("e_sharpen:100");
  if (adj.brightness !== 0) parts.push(`e_brightness:${adj.brightness}`);
  if (adj.saturation !== 0) parts.push(`e_saturation:${adj.saturation}`);
  if (adj.contrast !== 0) parts.push(`e_contrast:${adj.contrast}`);

  const aspect = aspectComponent(adj.aspect);
  if (aspect) parts.push(aspect);
  else if (adj.upscale) parts.push("c_limit,w_2500");

  return parts;
}

function audioOverlayComponent(
  adj: VideoAdjustments
): string | null {
  if (adj.mute || adj.audioStyle === "none" || adj.audioStyle === "original") {
    return null;
  }
  const style = getAudioStyle(adj.audioStyle);
  if (!style.fetchUrl) return null;

  const volume = Math.max(-80, Math.min(80, adj.audioVolume - 50));
  const encoded = encodeFetchUrl(style.fetchUrl);
  return `l_fetch:${encoded},e_volume:${volume},e_loop:200,fl_layer_apply`;
}

function videoComponents(adj: VideoAdjustments): string[] {
  const parts: string[] = [];

  const trim: string[] = [];
  if (adj.trimStart != null && adj.trimStart > 0) {
    trim.push(`so_${adj.trimStart}`);
  }
  if (adj.trimEnd != null && adj.trimEnd > 0) {
    trim.push(`eo_${adj.trimEnd}`);
  }
  if (trim.length) parts.push(trim.join(","));

  const aspect = aspectComponent(adj.aspect);
  if (aspect) parts.push(aspect);

  if (adj.autoEnhance) parts.push("e_improve");
  if (adj.autoColor) parts.push("e_auto_color");
  if (adj.sharpen) parts.push("e_sharpen:80");
  if (adj.denoise) parts.push("e_noise_reduction:50");
  if (adj.brightness !== 0) parts.push(`e_brightness:${adj.brightness}`);
  if (adj.saturation !== 0) parts.push(`e_saturation:${adj.saturation}`);
  if (adj.contrast !== 0) parts.push(`e_contrast:${adj.contrast}`);

  if (adj.mute) {
    parts.push("ac_none");
  }

  const audioOverlay = audioOverlayComponent(adj);
  if (audioOverlay) {
    if (!adj.mute) parts.push("ac_none");
    parts.push(audioOverlay);
  }

  return parts;
}

function injectTransform(url: string, transform: string): string {
  if (!transform) return url;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const head = url.slice(0, i + marker.length);
  const tail = url.slice(i + marker.length);
  return `${head}${transform}/${tail}`;
}

export function hasImageEdits(adj: ImageAdjustments): boolean {
  return imageComponents(adj).length > 0;
}

export function hasVideoEdits(adj: VideoAdjustments): boolean {
  return videoComponents(adj).length > 0;
}

export function buildTransformedUrl(
  secureUrl: string,
  type: MediaResourceType,
  adjustments: ImageAdjustments | VideoAdjustments,
  options: { download?: boolean; quality?: "good" | "best" } = {}
): string {
  const components: string[] = [];

  const imageQuality =
    options.quality === "best" ? "q_auto:best" : "q_auto:good";
  components.push(
    type === "image" ? `f_auto,${imageQuality}` : "f_auto,q_auto:best"
  );

  const effectParts =
    type === "image"
      ? imageComponents(adjustments as ImageAdjustments)
      : videoComponents(adjustments as VideoAdjustments);

  components.push(...effectParts);

  if (options.download) {
    components.push("fl_attachment");
  }

  return injectTransform(secureUrl, components.join("/"));
}
