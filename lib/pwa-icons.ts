import type { MetadataRoute } from "next";

/**
 * PWA 아이콘 경로 정의
 *
 * 나중에 아이콘만 교체할 때:
 * 1) public/icons/ 에 PNG 파일을 넣거나
 * 2) 아래 src 경로를 새 파일 경로로 변경
 *
 * 권장 파일명 (public/icons/):
 * - icon-192.png
 * - icon-512.png
 * - icon-maskable-512.png
 * - apple-touch-icon.png (180x180, iOS)
 */
export const PWA_ICON_ASSETS = {
  icon192: {
    src: "/icons/icon-192",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  icon512: {
    src: "/icons/icon-512",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  maskable512: {
    src: "/icons/icon-maskable-512",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
  appleTouch: {
    src: "/apple-icon",
    sizes: "180x180",
    type: "image/png",
    purpose: "any",
  },
} as const;

/** manifest.webmanifest icons 배열 */
export function getPwaManifestIcons(): MetadataRoute.Manifest["icons"] {
  return [
    {
      src: PWA_ICON_ASSETS.icon192.src,
      sizes: PWA_ICON_ASSETS.icon192.sizes,
      type: PWA_ICON_ASSETS.icon192.type,
      purpose: PWA_ICON_ASSETS.icon192.purpose,
    },
    {
      src: PWA_ICON_ASSETS.icon512.src,
      sizes: PWA_ICON_ASSETS.icon512.sizes,
      type: PWA_ICON_ASSETS.icon512.type,
      purpose: PWA_ICON_ASSETS.icon512.purpose,
    },
    {
      src: PWA_ICON_ASSETS.maskable512.src,
      sizes: PWA_ICON_ASSETS.maskable512.sizes,
      type: PWA_ICON_ASSETS.maskable512.type,
      purpose: PWA_ICON_ASSETS.maskable512.purpose,
    },
    {
      src: PWA_ICON_ASSETS.appleTouch.src,
      sizes: PWA_ICON_ASSETS.appleTouch.sizes,
      type: PWA_ICON_ASSETS.appleTouch.type,
      purpose: PWA_ICON_ASSETS.appleTouch.purpose,
    },
  ];
}

/** Service Worker 프리캐시용 아이콘·매니페스트 URL */
export function getPwaPrecacheUrls(): string[] {
  return [
    "/",
    "/manifest.webmanifest",
    PWA_ICON_ASSETS.icon192.src,
    PWA_ICON_ASSETS.icon512.src,
    PWA_ICON_ASSETS.maskable512.src,
    PWA_ICON_ASSETS.appleTouch.src,
  ];
}
