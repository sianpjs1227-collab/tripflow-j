import { ImageResponse } from "next/og";
import { PwaIconArt } from "@/lib/pwa-icon-art";

export const runtime = "edge";

const SIZE = 512;

export async function GET() {
  return new ImageResponse(<PwaIconArt size={SIZE} variant="maskable" />, {
    width: SIZE,
    height: SIZE,
  });
}
