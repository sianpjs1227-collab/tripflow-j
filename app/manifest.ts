import type { MetadataRoute } from "next";
import { PWA_CONFIG } from "@/lib/pwa-config";
import { getPwaManifestIcons } from "@/lib/pwa-icons";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: PWA_CONFIG.id,
    name: PWA_CONFIG.name,
    short_name: PWA_CONFIG.short_name,
    description: PWA_CONFIG.description,
    start_url: PWA_CONFIG.start_url,
    scope: PWA_CONFIG.scope,
    display: PWA_CONFIG.display,
    orientation: PWA_CONFIG.orientation,
    theme_color: PWA_CONFIG.theme_color,
    background_color: PWA_CONFIG.background_color,
    lang: PWA_CONFIG.lang,
    icons: getPwaManifestIcons(),
  };
}
